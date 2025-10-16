import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AgentRegistry } from '../agents/core/registry';
import { AgentDiscoveryService } from '../agents/core/discovery';
import { RuntimeManager } from '../agents/runtime/manager';
import { SecurityService } from '../security/service';
import { AuditLogger } from '../monitoring/audit';

const prisma = new PrismaClient();

interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Extract user session from JWT token
  const getUser = async (): Promise<Session | null> => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, email: true, name: true },
      });

      return user ? { user } : null;
    } catch {
      return null;
    }
  };

  const session = await getUser();

  // Initialize services
  const securityService = new SecurityService(prisma);
  const auditLogger = new AuditLogger(prisma);

  // Mock storage implementation for registry (would be replaced with real implementation)
  const registryStorage = {
    async saveAgent(entry: any) {
      return await prisma.agent.create({
        data: {
          id: entry.metadata.id,
          name: entry.metadata.name,
          description: entry.metadata.description,
          version: entry.metadata.version,
          author: entry.metadata.author,
          license: entry.metadata.license,
          homepage: entry.metadata.homepage,
          repository: entry.metadata.repository,
          category: entry.metadata.category,
          tags: entry.metadata.tags,
          runtime: entry.metadata.runtime,
          memoryLimit: entry.metadata.memoryLimit,
          timeoutLimit: entry.metadata.timeoutLimit,
          code: entry.code,
          manifest: entry.manifest,
          checksum: entry.checksum,
          verified: entry.verified,
          publishedAt: entry.publishedAt,
          downloadCount: entry.downloadCount,
          rating: entry.rating,
          capabilities: {
            create: entry.metadata.capabilities.map((cap: any) => ({
              name: cap.name,
              description: cap.description,
              inputSchema: cap.inputSchema,
              outputSchema: cap.outputSchema,
              category: cap.category,
              tags: cap.tags,
            })),
          },
        },
        include: {
          capabilities: true,
          reviews: true,
        },
      });
    },

    async getAgent(agentId: string) {
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          capabilities: true,
          reviews: true,
          rateLimits: true,
        },
      });

      if (!agent) return null;

      // Convert Prisma model to registry entry format
      return {
        metadata: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          version: agent.version,
          author: agent.author,
          license: agent.license,
          homepage: agent.homepage,
          repository: agent.repository,
          category: agent.category,
          tags: agent.tags,
          runtime: agent.runtime,
          memoryLimit: agent.memoryLimit,
          timeoutLimit: agent.timeoutLimit,
          capabilities: agent.capabilities.map(cap => ({
            id: cap.id,
            name: cap.name,
            description: cap.description,
            inputSchema: cap.inputSchema as any,
            outputSchema: cap.outputSchema as any,
            category: cap.category,
            tags: cap.tags,
          })),
          rateLimits: agent.rateLimits ? {
            requestsPerSecond: agent.rateLimits.requestsPerSecond,
            requestsPerMinute: agent.rateLimits.requestsPerMinute,
            requestsPerHour: agent.rateLimits.requestsPerHour,
          } : {
            requestsPerSecond: 10,
            requestsPerMinute: 100,
            requestsPerHour: 1000,
          },
          createdAt: agent.createdAt,
          updatedAt: agent.updatedAt,
        },
        code: agent.code,
        manifest: agent.manifest as any,
        checksum: agent.checksum,
        verified: agent.verified,
        publishedAt: agent.publishedAt,
        downloadCount: agent.downloadCount,
        rating: agent.rating,
        reviews: agent.reviews.map(review => ({
          userId: review.userId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
      };
    },

    async searchAgents(filter: any) {
      const where: any = {};

      if (filter.category) where.category = filter.category;
      if (filter.verified !== undefined) where.verified = filter.verified;
      if (filter.author) where.author = filter.author;
      if (filter.rating) where.rating = { gte: filter.rating };
      if (filter.tags && filter.tags.length > 0) {
        where.tags = { hasSome: filter.tags };
      }

      const [agents, total] = await Promise.all([
        prisma.agent.findMany({
          where,
          include: {
            capabilities: true,
            reviews: true,
          },
          orderBy: filter.sortBy ? { [filter.sortBy]: filter.sortOrder } : { createdAt: 'desc' },
          take: filter.limit,
          skip: filter.offset,
        }),
        prisma.agent.count({ where }),
      ]);

      return {
        entries: agents.map(agent => ({
          metadata: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            version: agent.version,
            author: agent.author,
            license: agent.license,
            homepage: agent.homepage,
            repository: agent.repository,
            category: agent.category,
            tags: agent.tags,
            runtime: agent.runtime,
            memoryLimit: agent.memoryLimit,
            timeoutLimit: agent.timeoutLimit,
            capabilities: agent.capabilities.map(cap => ({
              id: cap.id,
              name: cap.name,
              description: cap.description,
              inputSchema: cap.inputSchema as any,
              outputSchema: cap.outputSchema as any,
              category: cap.category,
              tags: cap.tags,
            })),
            rateLimits: {
              requestsPerSecond: 10,
              requestsPerMinute: 100,
              requestsPerHour: 1000,
            },
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
          },
          code: agent.code,
          manifest: agent.manifest as any,
          checksum: agent.checksum,
          verified: agent.verified,
          publishedAt: agent.publishedAt,
          downloadCount: agent.downloadCount,
          rating: agent.rating,
          reviews: agent.reviews.map(review => ({
            userId: review.userId,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
          })),
        })),
        total,
      };
    },

    async updateAgent(agentId: string, updates: any) {
      await prisma.agent.update({
        where: { id: agentId },
        data: updates,
      });
    },

    async deleteAgent(agentId: string) {
      await prisma.agent.delete({
        where: { id: agentId },
      });
    },

    async incrementDownloads(agentId: string) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { downloadCount: { increment: 1 } },
      });
    },

    async addReview(agentId: string, review: any) {
      await prisma.agentReview.create({
        data: {
          agentId,
          userId: review.userId,
          rating: review.rating,
          comment: review.comment,
        },
      });
    },
  };

  const registry = new AgentRegistry(registryStorage);

  const discoveryService = new AgentDiscoveryService(async () => {
    const result = await registryStorage.searchAgents({ limit: 1000, offset: 0 });
    return result.entries;
  });

  const runtimeManager = new RuntimeManager({
    maxConcurrentExecutions: 10,
    defaultTimeLimit: 30000,
    defaultMemoryLimit: 128,
    defaultSecurityPolicy: {
      allowedDomains: [],
      blockedDomains: [],
      allowedPorts: [80, 443],
      maxMemory: 128,
      maxCpuTime: 5000,
      maxExecutionTime: 30000,
      allowFileSystem: false,
      allowNetwork: true,
      allowChildProcesses: false,
      allowNativeModules: [],
      allowedEnvironmentVars: [],
      sandbox: {
        isolatedMemory: true,
        isolatedNetwork: true,
        isolatedFilesystem: true,
        containerized: true,
      },
    },
  });

  return {
    req,
    res,
    session,
    db: prisma,
    registry,
    discoveryService,
    runtimeManager,
    security: securityService,
    auditLogger,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});