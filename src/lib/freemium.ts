import {
  FREE_BABY_LIMIT,
  FREE_DAILY_LOG_LIMIT,
  FREE_MEDICINE_REMINDER_LIMIT,
  FREE_SHARES_PER_WEEK,
  type FreemiumLimitCode,
} from '@constants/freemium';
import { supabase } from '@lib/supabase';
import type { MedicineReminder } from '@app-types/medicineReminder';
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

export async function assertCanAddLog(babyId: string, isPremium: boolean) {
  if (isPremium) return;
  const count = await countTodayLogs(babyId);
  if (count >= FREE_DAILY_LOG_LIMIT) {
    throw new FreemiumLimitError(
      'daily_logs',
      `Free accounts can save up to ${FREE_DAILY_LOG_LIMIT} activities per day. Upgrade to MamaNote Plus for unlimited logging.`,
    );
  }
}

export function assertCanAddBaby(currentCount: number, isPremium: boolean) {
  if (isPremium) return;
  if (currentCount >= FREE_BABY_LIMIT) {
    throw new FreemiumLimitError(
      'baby_profiles',
      `Free accounts include ${FREE_BABY_LIMIT} baby profile. Upgrade to MamaNote Plus for multiple babies.`,
    );
  }
}

export async function assertCanCreateShare(userId: string, isPremium: boolean) {
  if (isPremium) return;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count, error } = await supabase
    .from('activity_shares')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', weekAgo.toISOString());

  if (error) throw new Error(error.message);
  if ((count ?? 0) >= FREE_SHARES_PER_WEEK) {
    throw new FreemiumLimitError(
      'share_links',
      `Free accounts can create ${FREE_SHARES_PER_WEEK} share link per week. Upgrade to MamaNote Plus for unlimited sharing.`,
    );
  }
}

export function countActiveMedicineReminders(
  remindersByBaby: Record<string, MedicineReminder[]>,
): number {
  return Object.values(remindersByBaby)
    .flat()
    .filter((reminder) => reminder.enabled && reminder.times.length > 0).length;
}

export function assertCanAddMedicineReminder(
  remindersByBaby: Record<string, MedicineReminder[]>,
  isPremium: boolean,
  options?: { excludeReminderId?: string; isUpdate?: boolean },
) {
  if (isPremium) return;

  const active = Object.values(remindersByBaby)
    .flat()
    .filter(
      (reminder) =>
        reminder.enabled &&
        reminder.times.length > 0 &&
        reminder.id !== options?.excludeReminderId,
    );

  if (options?.isUpdate && active.length <= FREE_MEDICINE_REMINDER_LIMIT) return;

  if (active.length >= FREE_MEDICINE_REMINDER_LIMIT) {
    throw new FreemiumLimitError(
      'medicine_reminders',
      `Free accounts include ${FREE_MEDICINE_REMINDER_LIMIT} medicine reminder. Upgrade to MamaNote Plus for unlimited reminders.`,
    );
  }
}

export function assertFullInsights(isPremium: boolean) {
  if (isPremium) return;
  throw new FreemiumLimitError(
    'full_insights',
    'Weekly insights and AI routines are part of MamaNote Plus.',
  );
}

export function freemiumLimitMessage(code: FreemiumLimitCode): string {
  switch (code) {
    case 'daily_logs':
      return `You've reached today's ${FREE_DAILY_LOG_LIMIT}-log limit on the free plan.`;
    case 'baby_profiles':
      return 'Multiple baby profiles require MamaNote Plus.';
    case 'share_links':
      return `Free plan includes ${FREE_SHARES_PER_WEEK} share link per week.`;
    case 'medicine_reminders':
      return `Free plan includes ${FREE_MEDICINE_REMINDER_LIMIT} medicine reminder.`;
    case 'full_insights':
      return 'Full insights and AI routines require MamaNote Plus.';
    default:
      return 'This feature requires MamaNote Plus.';
  }
}
