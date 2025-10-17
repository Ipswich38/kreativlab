import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const CreatePracticeSchema = z.object({
  name: z.string().min(1),
  practice_type: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  service_level: z.enum(['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']).default('BASIC'),
});

const UpdatePracticeSchema = CreatePracticeSchema.partial();

export const practicesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = ctx.supabase;

      const { data: practices, error } = await supabase
        .from('practices')
        .select(`
          *,
          contacts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch practices',
        });
      }

      return practices;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: practice, error } = await supabase
        .from('practices')
        .select(`
          *,
          contacts(*),
          calls(*),
          tickets(*),
          billing(*),
          insurance_claims(*)
        `)
        .eq('id', input.id)
        .single();

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Practice not found',
        });
      }

      return practice;
    }),

  create: protectedProcedure
    .input(CreatePracticeSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: practice, error } = await supabase
        .from('practices')
        .insert(input as any)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create practice',
        });
      }

      return practice;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: UpdatePracticeSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { data: practice, error } = await (supabase as any)
        .from('practices')
        .update(input.data)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update practice',
        });
      }

      return practice;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = ctx.supabase;

      const { error } = await supabase
        .from('practices')
        .delete()
        .eq('id', input.id);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete practice',
        });
      }

      return { success: true };
    }),

  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const supabase = ctx.supabase;

      const { data: practices } = await supabase
        .from('practices')
        .select('service_level');

      const stats = {
        total: practices?.length || 0,
        byServiceLevel: {
          BASIC: 0,
          STANDARD: 0,
          PREMIUM: 0,
          ENTERPRISE: 0,
        },
      };

      practices?.forEach((practice: any) => {
        stats.byServiceLevel[practice.service_level as keyof typeof stats.byServiceLevel]++;
      });

      return stats;
    }),
});