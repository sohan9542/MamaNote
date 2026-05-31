import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@lib/supabase';
import type { GeneratedRoutine, RoutineMeta, RoutineSource } from '@app-types/schedule';
import { getRoutineMeta, parseGeneratedRoutine } from '@app-types/schedule';

export class PremiumRequiredError extends Error {
  code = 'PREMIUM_REQUIRED' as const;
  constructor(message = 'MamaNote Plus required') {
    super(message);
    this.name = 'PremiumRequiredError';
  }
}

async function invokeErrorPayload(error: unknown): Promise<{
  message: string;
  code?: string;
}> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as {
        error?: string;
        message?: string;
        code?: string;
      };
      return {
        message: payload.error ?? payload.message ?? error.message,
        code: payload.code,
      };
    } catch {
      return { message: error.message };
    }
  }
  if (error instanceof Error) return { message: error.message };
  return { message: 'Unknown error calling generate-schedule' };
}

export async function fetchLatestRoutine(babyId: string) {
  const { data, error } = await supabase
    .from('baby_routines')
    .select('*')
    .eq('baby_id', babyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const schedule = parseGeneratedRoutine(data.schedule);
  if (!schedule) return null;

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    periodDays: data.period_days as number,
    summary: data.summary as string | null,
    schedule,
    meta: getRoutineMeta(data.schedule),
  };
}

export async function generateRoutine(babyId: string, periodDays = 7) {
  const { data, error } = await supabase.functions.invoke('generate-schedule', {
    body: { babyId, periodDays },
  });

  if (error) {
    const { message, code } = await invokeErrorPayload(error);
    if (code === 'PREMIUM_REQUIRED') {
      throw new PremiumRequiredError(message);
    }
    throw new Error(message);
  }
  if (data?.code === 'PREMIUM_REQUIRED') {
    throw new PremiumRequiredError(data.error as string);
  }
  if (data?.error) throw new Error(data.error as string);

  const schedule = parseGeneratedRoutine(data?.schedule);
  if (!schedule) throw new Error('Invalid schedule response from server');

  return {
    id: data.id as string,
    createdAt: data.created_at as string,
    periodDays: (data.period_days as number) ?? periodDays,
    summary: (data.summary as string | null) ?? schedule.summary,
    schedule,
    meta: {
      source: (data.source as RoutineSource) ?? getRoutineMeta(data.schedule).source ?? 'claude',
      model: data.model as string | undefined,
    },
  };
}

export type SavedRoutine = Awaited<ReturnType<typeof fetchLatestRoutine>> & {
  schedule: GeneratedRoutine;
};
