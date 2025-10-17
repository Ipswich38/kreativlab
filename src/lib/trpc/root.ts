import { createTRPCRouter } from './trpc';
import { practicesRouter } from './routers/practices';
import { ticketsRouter } from './routers/tickets';
import { callsRouter } from './routers/calls';

export const appRouter = createTRPCRouter({
  practices: practicesRouter,
  tickets: ticketsRouter,
  calls: callsRouter,
});

export type AppRouter = typeof appRouter;