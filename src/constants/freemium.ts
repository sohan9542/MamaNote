/** Free-tier limits — MamaNote Plus unlocks everything below. */
export const FREE_DAILY_LOG_LIMIT = 15;
export const FREE_BABY_LIMIT = 1;
export const FREE_MEDICINE_REMINDER_LIMIT = 1;
export const FREE_SHARES_PER_WEEK = 1;

/** Soft upgrade prompt after this many saved logs (once per cooldown). */
export const UPGRADE_PROMPT_AFTER_LOGS = 5;
export const UPGRADE_PROMPT_COOLDOWN_DAYS = 7;

export const FREE_TIER_SUMMARY = [
  `${FREE_DAILY_LOG_LIMIT} activity logs per day`,
  `${FREE_BABY_LIMIT} baby profile`,
  `${FREE_SHARES_PER_WEEK} share link per week`,
  `${FREE_MEDICINE_REMINDER_LIMIT} medicine reminder`,
  'Basic daily stats',
] as const;

export const PLUS_TIER_SUMMARY = [
  'Unlimited activity logs',
  'Multiple baby profiles',
  'Unlimited sharing with family',
  'Unlimited medicine reminders',
  'Full insights, weekly charts & AI routines',
] as const;

export type FreemiumLimitCode =
  | 'daily_logs'
  | 'baby_profiles'
  | 'share_links'
  | 'medicine_reminders'
  | 'full_insights';
