import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const CreateTicketSchema = z.object({
  practice_id: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['BILLING', 'SCHEDULING', 'INSURANCE', 'TECHNICAL', 'GENERAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assigned_to: z.string().optional(),
});

const UpdateTicketSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['BILLING', 'SCHEDULING', 'INSURANCE', 'TECHNICAL', 'GENERAL']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assigned_to: z.string().optional(),
});

export const ticketsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      practice_id: z.string().optional(),
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
      assigned_to: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      let query = supabase
        .from('tickets')
        .select(`
          *,
          practices(name),
          assigned_user:users!tickets_assigned_to_fkey(name),
          created_user:users!tickets_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (input?.practice_id) {
        query = query.eq('practice_id', input.practice_id);
      }

      if (input?.status) {
        query = query.eq('status', input.status);
      }

      if (input?.assigned_to) {
        query = query.eq('assigned_to', input.assigned_to);
      }

      const { data: tickets, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tickets',
        });
      }

      return tickets;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          practices(name),
          assigned_user:users!tickets_assigned_to_fkey(name),
          created_user:users!tickets_created_by_fkey(name)
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      return ticket;
    }),

  create: protectedProcedure
    .input(CreateTicketSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      // In a real app, you'd get this from the session
      const created_by = 'user-admin-1'; // TODO: Get from ctx.session.user.id

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert({ ...input, created_by } as any)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create ticket',
        });
      }

      return ticket;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: UpdateTicketSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: ticket, error } = await (supabase as any)
        .from('tickets')
        .update(input.data)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update ticket',
        });
      }

      return ticket;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete ticket',
        });
      }

      return { success: true };
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = ctx.supabase;

      const { data: tickets } = await supabase
        .from('tickets')
        .select('status, priority, category');

      const stats = {
        total: tickets?.length || 0,
        byStatus: {
          OPEN: 0,
          IN_PROGRESS: 0,
          RESOLVED: 0,
          CLOSED: 0,
        },
        byPriority: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          URGENT: 0,
        },
        byCategory: {
          BILLING: 0,
          SCHEDULING: 0,
          INSURANCE: 0,
          TECHNICAL: 0,
          GENERAL: 0,
        },
      };

      tickets?.forEach((ticket: any) => {
        stats.byStatus[ticket.status as keyof typeof stats.byStatus]++;
        stats.byPriority[ticket.priority as keyof typeof stats.byPriority]++;
        stats.byCategory[ticket.category as keyof typeof stats.byCategory]++;
      });

      return stats;
    }),
});