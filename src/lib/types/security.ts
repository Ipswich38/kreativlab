import { z } from 'zod';

export const SecurityPolicySchema = z.object({
  allowedDomains: z.array(z.string()).default([]),
  blockedDomains: z.array(z.string()).default([]),
  allowedPorts: z.array(z.number()).default([80, 443]),
  maxMemory: z.number().default(128), // MB
  maxCpuTime: z.number().default(5000), // ms
  maxExecutionTime: z.number().default(30000), // ms
  allowFileSystem: z.boolean().default(false),
  allowNetwork: z.boolean().default(true),
  allowChildProcesses: z.boolean().default(false),
  allowNativeModules: z.array(z.string()).default([]),
  allowedEnvironmentVars: z.array(z.string()).default([]),
  sandbox: z.object({
    isolatedMemory: z.boolean().default(true),
    isolatedNetwork: z.boolean().default(true),
    isolatedFilesystem: z.boolean().default(true),
    containerized: z.boolean().default(true),
  }).default({}),
});
export type SecurityPolicy = z.infer<typeof SecurityPolicySchema>;

export const UserPermissionSchema = z.object({
  userId: z.string(),
  permissions: z.array(z.enum([
    'agent:create',
    'agent:read',
    'agent:update',
    'agent:delete',
    'agent:execute',
    'agent:publish',
    'agent:install',
    'marketplace:browse',
    'marketplace:publish',
    'admin:users',
    'admin:agents',
    'admin:system'
  ])),
  resourceLimits: z.object({
    maxAgents: z.number().default(10),
    maxMemoryPerAgent: z.number().default(128), // MB
    maxConcurrentExecutions: z.number().default(5),
    maxExecutionTime: z.number().default(30000), // ms
  }).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserPermission = z.infer<typeof UserPermissionSchema>;

export const SecurityAuditLogSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  userId: z.string().optional(),
  agentId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  outcome: z.enum(['success', 'failure', 'blocked']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  details: z.record(z.any()),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});
export type SecurityAuditLog = z.infer<typeof SecurityAuditLogSchema>;

export const ThreatDetectionSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(['malware', 'suspicious_code', 'unauthorized_access', 'rate_limit_exceeded', 'resource_abuse']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  source: z.string(),
  target: z.string().optional(),
  description: z.string(),
  metadata: z.record(z.any()),
  resolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
});
export type ThreatDetection = z.infer<typeof ThreatDetectionSchema>;