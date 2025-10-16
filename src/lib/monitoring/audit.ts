import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { SecurityAuditLog } from '../types/security';

export interface AuditLogEntry {
  userId?: string;
  agentId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

export class AuditLogger extends EventEmitter {
  constructor(private db: PrismaClient) {
    super();
  }

  async log(entry: AuditLogEntry): Promise<SecurityAuditLog> {
    const auditLog: SecurityAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: entry.userId,
      agentId: entry.agentId,
      action: entry.action,
      resource: entry.resource,
      outcome: entry.outcome,
      riskLevel: entry.riskLevel,
      details: entry.details,
      ip: entry.ip,
      userAgent: entry.userAgent,
    };

    await this.db.securityAuditLog.create({
      data: {
        id: auditLog.id,
        timestamp: auditLog.timestamp,
        userId: auditLog.userId,
        agentId: auditLog.agentId,
        action: auditLog.action,
        resource: auditLog.resource,
        outcome: auditLog.outcome,
        riskLevel: auditLog.riskLevel,
        details: auditLog.details,
        ip: auditLog.ip,
        userAgent: auditLog.userAgent,
      },
    });

    this.emit('audit_logged', auditLog);

    // Check for suspicious patterns
    await this.analyzeSuspiciousActivity(auditLog);

    return auditLog;
  }

  async getLogs(filters: {
    userId?: string;
    agentId?: string;
    action?: string;
    outcome?: string;
    riskLevel?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    logs: SecurityAuditLog[];
    total: number;
  }> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.action) where.action = filters.action;
    if (filters.outcome) where.outcome = filters.outcome;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;

    if (filters.startTime || filters.endTime) {
      where.timestamp = {};
      if (filters.startTime) where.timestamp.gte = filters.startTime;
      if (filters.endTime) where.timestamp.lte = filters.endTime;
    }

    const [logs, total] = await Promise.all([
      this.db.securityAuditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.db.securityAuditLog.count({ where }),
    ]);

    return {
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId || undefined,
        agentId: log.agentId || undefined,
        action: log.action,
        resource: log.resource,
        outcome: log.outcome as SecurityAuditLog['outcome'],
        riskLevel: log.riskLevel as SecurityAuditLog['riskLevel'],
        details: log.details as Record<string, any>,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
      })),
      total,
    };
  }

  async getActivitySummary(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    blockedActions: number;
    riskBreakdown: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    const now = new Date();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = new Date(now.getTime() - timeframes[timeframe]);

    const logs = await this.db.securityAuditLog.findMany({
      where: {
        timestamp: { gte: startTime },
      },
    });

    const totalActions = logs.length;
    const successfulActions = logs.filter(log => log.outcome === 'success').length;
    const failedActions = logs.filter(log => log.outcome === 'failure').length;
    const blockedActions = logs.filter(log => log.outcome === 'blocked').length;

    // Risk breakdown
    const riskBreakdown: Record<string, number> = {};
    logs.forEach(log => {
      riskBreakdown[log.riskLevel] = (riskBreakdown[log.riskLevel] || 0) + 1;
    });

    // Top actions
    const actionCount: Record<string, number> = {};
    logs.forEach(log => {
      actionCount[log.action] = (actionCount[log.action] || 0) + 1;
    });

    const topActions = Object.entries(actionCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Top users
    const userCount: Record<string, number> = {};
    logs.forEach(log => {
      if (log.userId) {
        userCount[log.userId] = (userCount[log.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    return {
      totalActions,
      successfulActions,
      failedActions,
      blockedActions,
      riskBreakdown,
      topActions,
      topUsers,
    };
  }

  async detectAnomalies(): Promise<Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: Record<string, any>;
  }>> {
    const anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      details: Record<string, any>;
    }> = [];

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check for unusual failure rates
    const recentLogs = await this.db.securityAuditLog.findMany({
      where: { timestamp: { gte: last24Hours } },
    });

    const failureRate = recentLogs.filter(log => log.outcome === 'failure').length / recentLogs.length;

    if (failureRate > 0.3) { // 30% failure rate
      anomalies.push({
        type: 'high_failure_rate',
        description: `High failure rate detected: ${(failureRate * 100).toFixed(1)}%`,
        severity: failureRate > 0.5 ? 'high' : 'medium',
        details: { failureRate, totalLogs: recentLogs.length },
      });
    }

    // Check for suspicious user activity
    const userActivity: Record<string, number> = {};
    recentLogs.forEach(log => {
      if (log.userId) {
        userActivity[log.userId] = (userActivity[log.userId] || 0) + 1;
      }
    });

    Object.entries(userActivity).forEach(([userId, count]) => {
      if (count > 1000) { // More than 1000 actions in 24 hours
        anomalies.push({
          type: 'excessive_user_activity',
          description: `User ${userId} has performed ${count} actions in 24 hours`,
          severity: count > 5000 ? 'high' : 'medium',
          details: { userId, actionCount: count },
        });
      }
    });

    // Check for failed authentication attempts
    const authFailures = recentLogs.filter(log =>
      log.action.includes('auth') && log.outcome === 'failure'
    );

    const authFailuresByUser: Record<string, number> = {};
    authFailures.forEach(log => {
      if (log.userId) {
        authFailuresByUser[log.userId] = (authFailuresByUser[log.userId] || 0) + 1;
      }
    });

    Object.entries(authFailuresByUser).forEach(([userId, count]) => {
      if (count > 10) { // More than 10 failed auth attempts
        anomalies.push({
          type: 'failed_authentication',
          description: `User ${userId} has ${count} failed authentication attempts`,
          severity: count > 50 ? 'critical' : count > 25 ? 'high' : 'medium',
          details: { userId, failureCount: count },
        });
      }
    });

    // Check for blocked actions
    const blockedActions = recentLogs.filter(log => log.outcome === 'blocked');
    if (blockedActions.length > 100) {
      anomalies.push({
        type: 'high_blocked_actions',
        description: `High number of blocked actions: ${blockedActions.length}`,
        severity: blockedActions.length > 500 ? 'critical' : 'high',
        details: { blockedCount: blockedActions.length },
      });
    }

    return anomalies;
  }

  private async analyzeSuspiciousActivity(log: SecurityAuditLog): Promise<void> {
    // Check for rapid successive failures
    if (log.outcome === 'failure' && log.userId) {
      const recentFailures = await this.db.securityAuditLog.count({
        where: {
          userId: log.userId,
          outcome: 'failure',
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (recentFailures > 5) {
        this.emit('suspicious_activity', {
          type: 'rapid_failures',
          userId: log.userId,
          count: recentFailures,
        });
      }
    }

    // Check for high-risk actions
    if (log.riskLevel === 'critical' || log.riskLevel === 'high') {
      this.emit('high_risk_action', log);
    }

    // Check for unusual IP addresses
    if (log.ip && log.userId) {
      const recentIPs = await this.db.securityAuditLog.findMany({
        where: {
          userId: log.userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: { ip: true },
        distinct: ['ip'],
      });

      const uniqueIPs = new Set(recentIPs.map(l => l.ip).filter(Boolean));
      if (uniqueIPs.size > 5) { // More than 5 different IPs in 24 hours
        this.emit('suspicious_activity', {
          type: 'multiple_ips',
          userId: log.userId,
          ipCount: uniqueIPs.size,
        });
      }
    }
  }

  async exportLogs(
    filters: Parameters<typeof this.getLogs>[0],
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 });

    if (format === 'csv') {
      const headers = [
        'timestamp',
        'userId',
        'agentId',
        'action',
        'resource',
        'outcome',
        'riskLevel',
        'ip',
        'userAgent',
        'details',
      ].join(',');

      const rows = logs.map(log => [
        log.timestamp.toISOString(),
        log.userId || '',
        log.agentId || '',
        log.action,
        log.resource,
        log.outcome,
        log.riskLevel,
        log.ip || '',
        log.userAgent || '',
        JSON.stringify(log.details),
      ].map(field => `"${field}"`).join(','));

      return [headers, ...rows].join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await this.db.securityAuditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        riskLevel: { in: ['low', 'medium'] }, // Keep high and critical logs longer
      },
    });

    this.emit('logs_cleaned', { deleted: result.count, retentionDays });

    return result.count;
  }
}