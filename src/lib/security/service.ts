import { EventEmitter } from 'events';
import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';
import {
  SecurityPolicy,
  UserPermission,
  SecurityAuditLog,
  ThreatDetection,
} from '../types/security';

export class SecurityService extends EventEmitter {
  constructor(private db: PrismaClient) {
    super();
  }

  async checkPermission(userId: string, permission: string): Promise<void> {
    const userPermissions = await this.getUserPermissions(userId);

    if (!userPermissions.permissions.includes(permission)) {
      this.emit('permission_denied', { userId, permission });

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Permission denied: ${permission}`,
      });
    }

    this.emit('permission_granted', { userId, permission });
  }

  async getUserPermissions(userId: string): Promise<UserPermission> {
    const permissions = await this.db.userPermission.findUnique({
      where: { userId },
    });

    if (!permissions) {
      // Create default permissions for new users
      const defaultPermissions = await this.db.userPermission.create({
        data: {
          userId,
          permissions: [
            'agent:read',
            'agent:execute',
            'agent:install',
            'marketplace:browse',
          ],
          maxAgents: 10,
          maxMemoryPerAgent: 128,
          maxConcurrentExecutions: 5,
          maxExecutionTime: 30000,
        },
      });

      return {
        userId: defaultPermissions.userId,
        permissions: defaultPermissions.permissions,
        resourceLimits: {
          maxAgents: defaultPermissions.maxAgents,
          maxMemoryPerAgent: defaultPermissions.maxMemoryPerAgent,
          maxConcurrentExecutions: defaultPermissions.maxConcurrentExecutions,
          maxExecutionTime: defaultPermissions.maxExecutionTime,
        },
        createdAt: defaultPermissions.createdAt,
        updatedAt: defaultPermissions.updatedAt,
      };
    }

    return {
      userId: permissions.userId,
      permissions: permissions.permissions,
      resourceLimits: {
        maxAgents: permissions.maxAgents,
        maxMemoryPerAgent: permissions.maxMemoryPerAgent,
        maxConcurrentExecutions: permissions.maxConcurrentExecutions,
        maxExecutionTime: permissions.maxExecutionTime,
      },
      createdAt: permissions.createdAt,
      updatedAt: permissions.updatedAt,
    };
  }

  async getUserLimits(userId: string): Promise<UserPermission['resourceLimits']> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.resourceLimits;
  }

  async updateUserPermissions(
    userId: string,
    updates: Partial<{
      permissions: string[];
      resourceLimits: Partial<UserPermission['resourceLimits']>;
    }>
  ): Promise<UserPermission> {
    const existing = await this.getUserPermissions(userId);

    const data: any = {};

    if (updates.permissions) {
      data.permissions = updates.permissions;
    }

    if (updates.resourceLimits) {
      if (updates.resourceLimits.maxAgents !== undefined) {
        data.maxAgents = updates.resourceLimits.maxAgents;
      }
      if (updates.resourceLimits.maxMemoryPerAgent !== undefined) {
        data.maxMemoryPerAgent = updates.resourceLimits.maxMemoryPerAgent;
      }
      if (updates.resourceLimits.maxConcurrentExecutions !== undefined) {
        data.maxConcurrentExecutions = updates.resourceLimits.maxConcurrentExecutions;
      }
      if (updates.resourceLimits.maxExecutionTime !== undefined) {
        data.maxExecutionTime = updates.resourceLimits.maxExecutionTime;
      }
    }

    const updated = await this.db.userPermission.update({
      where: { userId },
      data,
    });

    this.emit('permissions_updated', { userId, updates });

    return {
      userId: updated.userId,
      permissions: updated.permissions,
      resourceLimits: {
        maxAgents: updated.maxAgents,
        maxMemoryPerAgent: updated.maxMemoryPerAgent,
        maxConcurrentExecutions: updated.maxConcurrentExecutions,
        maxExecutionTime: updated.maxExecutionTime,
      },
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async validateSecurityPolicy(policy: SecurityPolicy): Promise<void> {
    // Validate memory limits
    if (policy.maxMemory > 1024) { // 1GB limit
      throw new Error('Memory limit exceeds maximum allowed (1GB)');
    }

    if (policy.maxExecutionTime > 300000) { // 5 minutes
      throw new Error('Execution time limit exceeds maximum allowed (5 minutes)');
    }

    // Validate network restrictions
    if (policy.allowNetwork && policy.allowedDomains.length === 0 && policy.blockedDomains.length === 0) {
      throw new Error('Network access requires domain restrictions');
    }

    // Validate file system access
    if (policy.allowFileSystem) {
      throw new Error('File system access is not permitted');
    }

    // Validate child processes
    if (policy.allowChildProcesses) {
      throw new Error('Child processes are not permitted');
    }

    this.emit('security_policy_validated', policy);
  }

  async detectThreat(
    type: ThreatDetection['type'],
    severity: ThreatDetection['severity'],
    source: string,
    description: string,
    metadata: Record<string, any> = {},
    target?: string
  ): Promise<ThreatDetection> {
    const threat: ThreatDetection = {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      severity,
      source,
      target,
      description,
      metadata,
      resolved: false,
    };

    await this.db.threatDetection.create({
      data: {
        id: threat.id,
        type: threat.type,
        severity: threat.severity,
        source: threat.source,
        target: threat.target,
        description: threat.description,
        metadata: threat.metadata,
        resolved: threat.resolved,
      },
    });

    this.emit('threat_detected', threat);

    // Auto-response for critical threats
    if (severity === 'critical') {
      await this.respondToThreat(threat);
    }

    return threat;
  }

  async resolveThreat(threatId: string, resolvedBy: string): Promise<void> {
    await this.db.threatDetection.update({
      where: { id: threatId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
      },
    });

    this.emit('threat_resolved', { threatId, resolvedBy });
  }

  async getActiveThreats(): Promise<ThreatDetection[]> {
    const threats = await this.db.threatDetection.findMany({
      where: { resolved: false },
      orderBy: { timestamp: 'desc' },
    });

    return threats.map(threat => ({
      id: threat.id,
      timestamp: threat.timestamp,
      type: threat.type as ThreatDetection['type'],
      severity: threat.severity as ThreatDetection['severity'],
      source: threat.source,
      target: threat.target || undefined,
      description: threat.description,
      metadata: threat.metadata as Record<string, any>,
      resolved: threat.resolved,
      resolvedAt: threat.resolvedAt || undefined,
      resolvedBy: threat.resolvedBy || undefined,
    }));
  }

  async analyzeCode(code: string): Promise<{
    risk: 'low' | 'medium' | 'high' | 'critical';
    issues: Array<{
      type: string;
      message: string;
      line?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    const issues: Array<{
      type: string;
      message: string;
      line?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }> = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, type: 'code_injection', severity: 'critical' as const, message: 'eval() usage detected' },
      { pattern: /Function\s*\(/, type: 'code_injection', severity: 'critical' as const, message: 'Function constructor usage detected' },
      { pattern: /process\./g, type: 'system_access', severity: 'high' as const, message: 'Process object access detected' },
      { pattern: /require\s*\(/g, type: 'module_access', severity: 'high' as const, message: 'require() usage detected' },
      { pattern: /import\s+/g, type: 'module_access', severity: 'medium' as const, message: 'import statement detected' },
      { pattern: /child_process/g, type: 'system_access', severity: 'critical' as const, message: 'Child process usage detected' },
      { pattern: /fs\./g, type: 'file_access', severity: 'high' as const, message: 'File system access detected' },
      { pattern: /\.exec\(/g, type: 'command_execution', severity: 'critical' as const, message: 'Command execution detected' },
      { pattern: /\.spawn\(/g, type: 'command_execution', severity: 'critical' as const, message: 'Process spawn detected' },
      { pattern: /fetch\(/g, type: 'network_access', severity: 'medium' as const, message: 'Network request detected' },
      { pattern: /XMLHttpRequest/g, type: 'network_access', severity: 'medium' as const, message: 'XMLHttpRequest usage detected' },
    ];

    const lines = code.split('\n');

    lines.forEach((line, index) => {
      dangerousPatterns.forEach(({ pattern, type, severity, message }) => {
        if (pattern.test(line)) {
          issues.push({
            type,
            message,
            line: index + 1,
            severity,
          });
        }
      });
    });

    // Check for suspicious string patterns
    const suspiciousStrings = [
      'password',
      'secret',
      'token',
      'api_key',
      'private_key',
      'credential',
    ];

    lines.forEach((line, index) => {
      suspiciousStrings.forEach(str => {
        if (line.toLowerCase().includes(str) && (line.includes('=') || line.includes(':'))) {
          issues.push({
            type: 'sensitive_data',
            message: `Potential sensitive data: ${str}`,
            line: index + 1,
            severity: 'medium',
          });
        }
      });
    });

    // Determine overall risk level
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    let risk: 'low' | 'medium' | 'high' | 'critical';

    if (criticalIssues > 0) {
      risk = 'critical';
    } else if (highIssues > 0) {
      risk = 'high';
    } else if (mediumIssues > 2) {
      risk = 'high';
    } else if (mediumIssues > 0) {
      risk = 'medium';
    } else {
      risk = 'low';
    }

    return { risk, issues };
  }

  async checkRateLimit(
    userId: string,
    resource: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const key = `rate_limit:${userId}:${resource}`;
    // In a real implementation, you would use Redis or another cache
    // For now, we'll use a simple in-memory approach

    const now = Date.now();
    const windowStart = now - windowMs;

    // This is a simplified implementation
    // In production, use Redis with ZSET for proper sliding window rate limiting
    return true; // Allow for now
  }

  private async respondToThreat(threat: ThreatDetection): Promise<void> {
    switch (threat.type) {
      case 'malware':
        // Quarantine the agent
        await this.quarantineAgent(threat.source);
        break;

      case 'unauthorized_access':
        // Block the user temporarily
        await this.temporaryUserBlock(threat.source);
        break;

      case 'rate_limit_exceeded':
        // Implement rate limiting
        await this.enforceRateLimit(threat.source);
        break;

      case 'resource_abuse':
        // Terminate excessive processes
        await this.terminateAbusiveProcesses(threat.source);
        break;

      case 'suspicious_code':
        // Flag for manual review
        await this.flagForReview(threat.source);
        break;
    }
  }

  private async quarantineAgent(agentId: string): Promise<void> {
    // Mark agent as quarantined in database
    await this.db.agent.update({
      where: { id: agentId },
      data: { verified: false },
    });

    this.emit('agent_quarantined', agentId);
  }

  private async temporaryUserBlock(userId: string): Promise<void> {
    // Implement temporary user blocking logic
    this.emit('user_blocked', userId);
  }

  private async enforceRateLimit(source: string): Promise<void> {
    // Implement rate limiting enforcement
    this.emit('rate_limit_enforced', source);
  }

  private async terminateAbusiveProcesses(source: string): Promise<void> {
    // Terminate processes that are consuming too many resources
    this.emit('processes_terminated', source);
  }

  private async flagForReview(agentId: string): Promise<void> {
    // Flag agent for manual security review
    this.emit('agent_flagged', agentId);
  }

  async getSecurityMetrics(): Promise<{
    activeThreats: number;
    resolvedThreats: number;
    auditLogs: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    const [activeThreats, totalThreats, auditLogsCount] = await Promise.all([
      this.db.threatDetection.count({ where: { resolved: false } }),
      this.db.threatDetection.count(),
      this.db.securityAuditLog.count(),
    ]);

    const resolvedThreats = totalThreats - activeThreats;

    // Calculate risk level based on active threats
    const criticalThreats = await this.db.threatDetection.count({
      where: { resolved: false, severity: 'critical' },
    });

    const highThreats = await this.db.threatDetection.count({
      where: { resolved: false, severity: 'high' },
    });

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';

    if (criticalThreats > 0) {
      riskLevel = 'critical';
    } else if (highThreats > 3) {
      riskLevel = 'high';
    } else if (activeThreats > 10) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      activeThreats,
      resolvedThreats,
      auditLogs: auditLogsCount,
      riskLevel,
    };
  }
}