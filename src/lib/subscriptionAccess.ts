import { POST_TRIAL_DAILY_LOG_LIMIT } from '@constants/freemium';
import { PREMIUM_STATUSES } from '@constants/subscription';
import type { SubscriptionEntitlement } from '@store/subscriptionStore';

export interface FreemiumAccess {
  isPremium: boolean;
  /** True when the 7-day trial ended and the user has not subscribed. */
  isLimitedFree: boolean;
  dailyLogLimit: number;
}

export function buildFreemiumAccess(
  entitlement: SubscriptionEntitlement | null,
): FreemiumAccess {
  const hasPaidPremium =
    entitlement != null && PREMIUM_STATUSES.includes(entitlement.status);
  const complimentaryUntil = entitlement?.complimentaryPremiumUntil;
  const isComplimentaryPremium =
    !hasPaidPremium &&
    complimentaryUntil != null &&
    new Date(complimentaryUntil) > new Date();
  const isPremium = hasPaidPremium || isComplimentaryPremium;
  const isLimitedFree = !isPremium;

  const dailyLogLimit = isPremium
    ? Number.POSITIVE_INFINITY
    : POST_TRIAL_DAILY_LOG_LIMIT;

  return { isPremium, isLimitedFree, dailyLogLimit };
}

export function complimentaryDaysRemaining(
  until: string | null | undefined,
): number | null {
  if (!until) return null;
  const end = new Date(until).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}
