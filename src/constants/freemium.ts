/** Complimentary Plus trial length (set in DB on signup). */
export const COMPLIMENTARY_PLUS_DAYS = 7;

/** After the trial, non‑subscribers can create this many logs per day (all history stays visible). */
export const POST_TRIAL_DAILY_LOG_LIMIT = 3;

export const FREE_BABY_LIMIT = 1;

export const POST_TRIAL_TIER_SUMMARY = [
  'View all past activity logs',
  `${POST_TRIAL_DAILY_LOG_LIMIT} new logs per day`,
  'Sleep, growth, sharing & insights require Plus',
] as const;

export type FreemiumLimitCode =
  | 'daily_logs'
  | 'baby_profiles'
  | 'share_links'
  | 'full_insights';
