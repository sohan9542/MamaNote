import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST_TRIAL_DAILY_LOG_LIMIT } from '@constants/freemium';

import type { SubscriptionEntitlement } from '@store/subscriptionStore';

import { buildFreemiumAccess, complimentaryDaysRemaining } from './subscriptionAccess';

function entitlement(
  partial: Pick<SubscriptionEntitlement, 'status' | 'complimentaryPremiumUntil'>,
): SubscriptionEntitlement {
  return {
    plan: null,
    freeAiGenerationsUsed: 0,
    currentPeriodEnd: null,
    paddleCustomerId: null,
    ...partial,
  };
}

describe('buildFreemiumAccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('treats active and trialing as premium', () => {
    expect(
      buildFreemiumAccess(entitlement({ status: 'active', complimentaryPremiumUntil: null }))
        .isPremium,
    ).toBe(true);
    expect(
      buildFreemiumAccess(entitlement({ status: 'trialing', complimentaryPremiumUntil: null }))
        .isPremium,
    ).toBe(true);
  });

  it('grants complimentary premium before the expiry', () => {
    const access = buildFreemiumAccess(
      entitlement({
        status: 'free',
        complimentaryPremiumUntil: '2026-04-12T12:00:00.000Z',
      }),
    );
    expect(access.isPremium).toBe(true);
    expect(access.isLimitedFree).toBe(false);
    expect(access.dailyLogLimit).toBe(Number.POSITIVE_INFINITY);
  });

  it('applies the post-trial daily log limit when expired', () => {
    const access = buildFreemiumAccess(
      entitlement({
        status: 'free',
        complimentaryPremiumUntil: '2026-04-01T12:00:00.000Z',
      }),
    );
    expect(access.isPremium).toBe(false);
    expect(access.isLimitedFree).toBe(true);
    expect(access.dailyLogLimit).toBe(POST_TRIAL_DAILY_LOG_LIMIT);
  });
});

describe('complimentaryDaysRemaining', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no expiry is set', () => {
    expect(complimentaryDaysRemaining(null)).toBeNull();
  });

  it('ceilings remaining whole days', () => {
    expect(complimentaryDaysRemaining('2026-04-12T18:00:00.000Z')).toBe(3);
  });

  it('returns 0 after expiry', () => {
    expect(complimentaryDaysRemaining('2026-04-09T12:00:00.000Z')).toBe(0);
  });
});
