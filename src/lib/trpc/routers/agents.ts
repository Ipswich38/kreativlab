import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc';
import {
  AgentMetadataSchema,
  AgentMarketplaceFilterSchema,
  AgentPublishRequestSchema,
  AgentInstallRequestSchema,
} from '../../types';

export const agentsRouter = createTRPCRouter({
  // Public endpoints for browsing marketplace
  search: publicProcedure
    .input(z.object({
      query: z.string().optional(),
      filter: AgentMarketplaceFilterSchema.optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { query, filter } = input;

      // Use discovery service to search agents
      const results = await ctx.discoveryService.search(query || '', filter);

      return {
        agents: results.agents,
        total: results.total,
        facets: results.facets,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const agent = await ctx.registry.getAgent(input.id);

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return agent;
    }),

  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.discoveryService.getCategories();
    }),

  getTags: publicProcedure
    .query(async ({ ctx }) => {
      return await ctx.discoveryService.getTags();
    }),

  getPopular: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input, ctx }) => {
      return await ctx.discoveryService.getPopularAgents(input.limit);
    }),

  getTrending: publicProcedure
    .input(z.object({
      timeframe: z.enum(['day', 'week', 'month']).default('week'),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.discoveryService.getTrendingAgents(input.timeframe, input.limit);
    }),

  getSimilar: publicProcedure
    .input(z.object({
      agentId: z.string(),
      limit: z.number().min(1).max(20).default(5),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.discoveryService.findSimilarAgents(input.agentId, input.limit);
    }),

  // Protected endpoints requiring authentication
  publish: protectedProcedure
    .input(AgentPublishRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      // Check permissions
      await ctx.security.checkPermission(userId, 'agent:publish');

      try {
        const agent = await ctx.registry.publishAgent(input, userId);

        // Log the action
        await ctx.auditLogger.log({
          userId,
          action: 'agent:publish',
          resource: `agent:${agent.metadata.id}`,
          outcome: 'success',
          riskLevel: 'low',
          details: { agentId: agent.metadata.id, name: agent.metadata.name },
        });

        return agent;
      } catch (error) {
        await ctx.auditLogger.log({
          userId,
          action: 'agent:publish',
          resource: 'agent:*',
          outcome: 'failure',
          riskLevel: 'medium',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        });

        throw error;
      }
    }),

  update: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      updates: AgentPublishRequestSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'agent:update');

      return await ctx.registry.updateAgent(input.agentId, input.updates, userId);
    }),

  delete: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'agent:delete');

      await ctx.registry.deleteAgent(input.agentId, userId);

      return { success: true };
    }),

  install: protectedProcedure
    .input(AgentInstallRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'agent:install');

      // Check user limits
      const userLimits = await ctx.security.getUserLimits(userId);
      const userInstances = await ctx.runtimeManager.getInstancesByUser(userId);

      if (userInstances.length >= userLimits.maxAgents) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Maximum number of agents reached',
        });
      }

      const agent = await ctx.registry.installAgent(input, userId);

      // Create instance if autoStart is true
      if (input.autoStart) {
        await ctx.runtimeManager.createInstance(
          agent.metadata,
          userId,
          input.config,
          input.environment
        );
      }

      return agent;
    }),

  // Instance management
  createInstance: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      config: z.record(z.any()).default({}),
      environment: z.record(z.string()).default({}),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'agent:create');

      const agent = await ctx.registry.getAgent(input.agentId);
      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return await ctx.runtimeManager.createInstance(
        agent.metadata,
        userId,
        input.config,
        input.environment
      );
    }),

  getInstances: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await ctx.runtimeManager.getInstancesByUser(userId);
    }),

  getInstance: protectedProcedure
    .input(z.object({ instanceId: z.string() }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const instance = await ctx.runtimeManager.getInstance(input.instanceId);

      if (!instance) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Instance not found',
        });
      }

      if (instance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this instance',
        });
      }

      return instance;
    }),

  deleteInstance: protectedProcedure
    .input(z.object({ instanceId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const instance = await ctx.runtimeManager.getInstance(input.instanceId);

      if (!instance || instance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this instance',
        });
      }

      await ctx.runtimeManager.deleteInstance(input.instanceId);

      return { success: true };
    }),

  // Execution
  execute: protectedProcedure
    .input(z.object({
      instanceId: z.string(),
      capability: z.string(),
      input: z.record(z.any()),
      environment: z.record(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'agent:execute');

      const instance = await ctx.runtimeManager.getInstance(input.instanceId);
      if (!instance || instance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to execute this instance',
        });
      }

      return await ctx.runtimeManager.executeCapability({
        instanceId: input.instanceId,
        capability: input.capability,
        input: input.input,
        userId,
        environment: input.environment,
      });
    }),

  getExecutions: protectedProcedure
    .input(z.object({
      instanceId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const instance = await ctx.runtimeManager.getInstance(input.instanceId);

      if (!instance || instance.userId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to access this instance',
        });
      }

      // Get executions from database
      return await ctx.db.agentExecution.findMany({
        where: { instanceId: input.instanceId },
        orderBy: { startTime: 'desc' },
        take: input.limit,
        skip: input.offset,
      });
    }),

  // Reviews
  addReview: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().min(1).max(1000),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.registry.addReview(
        input.agentId,
        userId,
        input.rating,
        input.comment
      );

      return { success: true };
    }),

  // Admin endpoints
  verify: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      verified: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'admin:agents');

      await ctx.registry.verifyAgent(input.agentId, input.verified);

      return { success: true };
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;

      await ctx.security.checkPermission(userId, 'admin:system');

      const registryStats = await ctx.registry.getRegistryStats();
      const runtimeStats = ctx.runtimeManager.getStats();

      return {
        registry: registryStats,
        runtime: runtimeStats,
      };
    }),
});