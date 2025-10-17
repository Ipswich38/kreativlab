import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const CreateCallSchema = z.object({
  practice_id: z.string(),
  caller_name: z.string().optional(),
  caller_phone: z.string().optional(),
  call_type: z.enum(['INBOUND', 'OUTBOUND']),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  duration_minutes: z.number().optional(),
});

const UpdateCallSchema = CreateCallSchema.partial().omit({ practice_id: true });

export const callsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      practice_id: z.string().optional(),
      call_type: z.enum(['INBOUND', 'OUTBOUND']).optional(),
      handled_by: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      let query = supabase
        .from('calls')
        .select(`
          *,
          practices(name),
          handler:users!calls_handled_by_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(input?.limit || 50);

      if (input?.practice_id) {
        query = query.eq('practice_id', input.practice_id);
      }

      if (input?.call_type) {
        query = query.eq('call_type', input.call_type);
      }

      if (input?.handled_by) {
        query = query.eq('handled_by', input.handled_by);
      }

      const { data: calls, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch calls',
        });
      }

      return calls;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: call, error } = await supabase
        .from('calls')
        .select(`
          *,
          practices(name),
          handler:users!calls_handled_by_fkey(name)
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Call not found',
        });
      }

      return call;
    }),

  create: protectedProcedure
    .input(CreateCallSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      // In a real app, you'd get this from the session
      const handled_by = 'user-agent-1'; // TODO: Get from ctx.session.user.id

      const { data: call, error } = await supabase
        .from('calls')
        .insert({ ...input, handled_by } as any)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create call record',
        });
      }

      return call;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: UpdateCallSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: call, error } = await (supabase as any)
        .from('calls')
        .update(input.data)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update call record',
        });
      }

      return call;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete call record',
        });
      }

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({
      practice_id: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      let query = supabase
        .from('calls')
        .select('call_type, duration_minutes, created_at');

      if (input?.practice_id) {
        query = query.eq('practice_id', input.practice_id);
      }

      if (input?.start_date) {
        query = query.gte('created_at', input.start_date);
      }

      if (input?.end_date) {
        query = query.lte('created_at', input.end_date);
      }

      const { data: calls } = await (query as any);

      const stats = {
        total: calls?.length || 0,
        byType: {
          INBOUND: 0,
          OUTBOUND: 0,
        },
        totalDuration: 0,
        averageDuration: 0,
      };

      let totalDuration = 0;
      let callsWithDuration = 0;

      calls?.forEach((call: any) => {
        stats.byType[call.call_type as keyof typeof stats.byType]++;
        if (call.duration_minutes) {
          totalDuration += call.duration_minutes;
          callsWithDuration++;
        }
      });

      stats.totalDuration = totalDuration;
      stats.averageDuration = callsWithDuration > 0 ? totalDuration / callsWithDuration : 0;

      return stats;
    }),
});