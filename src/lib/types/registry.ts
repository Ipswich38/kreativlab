import { z } from 'zod';
import { AgentMetadataSchema } from './agent';

export const AgentRegistryEntrySchema = z.object({
  metadata: AgentMetadataSchema,
  code: z.string(),
  manifest: z.record(z.any()),
  checksum: z.string(),
  verified: z.boolean().default(false),
  publishedAt: z.date(),
  downloadCount: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.array(z.object({
    userId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string(),
    createdAt: z.date(),
  })).default([]),
});
export type AgentRegistryEntry = z.infer<typeof AgentRegistryEntrySchema>;

export const AgentMarketplaceFilterSchema = z.object({
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  verified: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  search: z.string().optional(),
  author: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'downloadCount', 'rating', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type AgentMarketplaceFilter = z.infer<typeof AgentMarketplaceFilterSchema>;

export const AgentInstallRequestSchema = z.object({
  agentId: z.string(),
  version: z.string().optional(),
  config: z.record(z.any()).default({}),
  environment: z.record(z.string()).default({}),
  autoStart: z.boolean().default(false),
});
export type AgentInstallRequest = z.infer<typeof AgentInstallRequestSchema>;

export const AgentPublishRequestSchema = z.object({
  metadata: AgentMetadataSchema,
  code: z.string(),
  manifest: z.record(z.any()),
  readme: z.string().optional(),
  license: z.string().optional(),
  examples: z.array(z.object({
    name: z.string(),
    description: z.string(),
    input: z.record(z.any()),
    expectedOutput: z.record(z.any()),
  })).default([]),
});
export type AgentPublishRequest = z.infer<typeof AgentPublishRequestSchema>;