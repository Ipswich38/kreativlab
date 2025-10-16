import { z } from 'zod';

export const AgentStatusSchema = z.enum(['idle', 'running', 'paused', 'error', 'terminated']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const AgentCapabilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  inputSchema: z.record(z.any()),
  outputSchema: z.record(z.any()),
  category: z.string(),
  tags: z.array(z.string()).default([]),
});
export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export const AgentMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string(),
  license: z.string().default('MIT'),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  capabilities: z.array(AgentCapabilitySchema),
  tags: z.array(z.string()).default([]),
  category: z.string(),
  runtime: z.enum(['node', 'deno', 'python', 'isolated-vm']).default('isolated-vm'),
  memoryLimit: z.number().default(128), // MB
  timeoutLimit: z.number().default(30000), // ms
  rateLimits: z.object({
    requestsPerSecond: z.number().default(10),
    requestsPerMinute: z.number().default(100),
    requestsPerHour: z.number().default(1000),
  }).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;

export const AgentInstanceSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  userId: z.string(),
  status: AgentStatusSchema,
  metadata: AgentMetadataSchema,
  config: z.record(z.any()).default({}),
  environment: z.record(z.string()).default({}),
  resources: z.object({
    memoryUsed: z.number(),
    cpuUsed: z.number(),
    networkUsed: z.number(),
  }).default({ memoryUsed: 0, cpuUsed: 0, networkUsed: 0 }),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  terminatedAt: z.date().optional(),
});
export type AgentInstance = z.infer<typeof AgentInstanceSchema>;

export const AgentExecutionContextSchema = z.object({
  instanceId: z.string(),
  requestId: z.string(),
  userId: z.string(),
  capability: z.string(),
  input: z.record(z.any()),
  environment: z.record(z.string()),
  startTime: z.date(),
  timeoutAt: z.date(),
});
export type AgentExecutionContext = z.infer<typeof AgentExecutionContextSchema>;

export const AgentExecutionResultSchema = z.object({
  requestId: z.string(),
  success: z.boolean(),
  output: z.record(z.any()).optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),
  metadata: z.object({
    executionTime: z.number(),
    memoryUsed: z.number(),
    cpuTime: z.number(),
  }),
  logs: z.array(z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    message: z.string(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional(),
  })).default([]),
});
export type AgentExecutionResult = z.infer<typeof AgentExecutionResultSchema>;