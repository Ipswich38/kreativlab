import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { createClient } from '../supabase/server';

interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
}

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Extract user session (simplified for now)
  const getUser = async (): Promise<Session | null> => {
    // In a real app, you'd extract this from cookies/session
    // For now, returning a mock user for development
    return {
      user: {
        id: 'user-admin-1',
        email: 'admin@kreativlab.com',
        name: 'Admin User',
        role: 'ADMIN',
      },
    };
  };

  const session = await getUser();
  const supabase = await createClient();

  return {
    req,
    res,
    session,
    supabase,
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