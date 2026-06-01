import { FREE_BABY_LIMIT, type FreemiumLimitCode } from '@constants/freemium';
import { supabase } from '@lib/supabase';
import type { FreemiumAccess } from '@lib/subscriptionAccess';
import { localDateKey } from '@utils/date';

export class FreemiumLimitError extends Error {
  code: FreemiumLimitCode;

  constructor(code: FreemiumLimitCode, message: string) {
    super(message);
    this.name = 'FreemiumLimitError';
    this.code = code;
  }
}

export function startOfLocalDay(): Date {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day;
}

export async function countTodayLogs(babyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('log_entries')
    .select('*', { count: 'exact', head: true })
    .eq('baby_id', babyId)
    .gte('started_at', startOfLocalDay().toISOString());

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function countTodayLogsFromEntries(
  entries: { started_at: string; baby_id: string }[],
  babyId: string,
): number {
  const todayKey = localDateKey(new Date());
  return entries.filter(
    (entry) => entry.baby_id === babyId && localDateKey(new Date(entry.started_at)) === todayKey,
  ).length;
}

export async function assertCanAddLog(babyId: string, access: FreemiumAccess) {
  if (access.isPremium) return;
  const count = await countTodayLogs(babyId);
  const limit = access.dailyLogLimit;
  if (count >= limit) {
    throw new FreemiumLimitError(
      'daily_logs',
      `You can save up to ${limit} new activities per day. Upgrade to MamaNote Plus for unlimited logging.`,
    );
  }
}

export function assertCanAddBaby(currentCount: number, access: FreemiumAccess) {
  if (access.isPremium) return;
  if (currentCount >= FREE_BABY_LIMIT) {
    throw new FreemiumLimitError(
      'baby_profiles',
      'Multiple baby profiles are included with MamaNote Plus.',
    );
  }
}

export async function assertCanCreateShare(_userId: string, access: FreemiumAccess) {
  if (access.isPremium) return;
  throw new FreemiumLimitError(
    'share_links',
    'Sharing activity links with family is part of MamaNote Plus.',
  );
}

export function assertFullInsights(access: FreemiumAccess) {
  if (access.isPremium) return;
  throw new FreemiumLimitError(
    'full_insights',
    'Weekly insights and AI routines require MamaNote Plus.',
  );
}

export function freemiumLimitMessage(
  code: FreemiumLimitCode,
  dailyLogLimit?: number,
): string {
  switch (code) {
    case 'daily_logs':
      return dailyLogLimit != null
        ? `You've reached today's ${dailyLogLimit}-log limit. Upgrade to MamaNote Plus for unlimited logging.`
        : `You've reached today's log limit.`;
    case 'baby_profiles':
      return 'Multiple baby profiles require MamaNote Plus.';
    case 'share_links':
      return 'Sharing with family requires MamaNote Plus.';
    case 'full_insights':
      return 'Full insights and AI routines require MamaNote Plus.';
    default:
      return 'This feature requires MamaNote Plus.';
  }
}
