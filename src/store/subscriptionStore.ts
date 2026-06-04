import { create } from 'zustand';

import {
  PREMIUM_STATUSES,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@constants/subscription';
import { supabase } from '@lib/supabase';
import {
  buildFreemiumAccess,
  complimentaryDaysRemaining,
  type FreemiumAccess,
} from '@lib/subscriptionAccess';

export interface SubscriptionEntitlement {
  status: SubscriptionStatus;
  plan: SubscriptionPlan | null;
  freeAiGenerationsUsed: number;
  currentPeriodEnd: string | null;
  paddleCustomerId: string | null;
  complimentaryPremiumUntil: string | null;
}

interface SubscriptionState {
  entitlement: SubscriptionEntitlement | null;
  loading: boolean;
  /** True after the first fetch completes for the current session. */
  hydrated: boolean;
  error: string | null;
  paywallVisible: boolean;

  getFreemiumAccess: () => FreemiumAccess;
  hasPaidPremium: () => boolean;
  isComplimentaryPremium: () => boolean;
  isPremium: () => boolean;
  isLimitedFree: () => boolean;
  getDailyLogLimit: () => number;
  complimentaryDaysRemaining: () => number | null;
  canGenerateAi: () => boolean;
  hasUsedFreeGeneration: () => boolean;
  fetch: () => Promise<void>;
  showPaywall: () => void;
  hidePaywall: () => void;
  clear: () => void;
}

const DEFAULT: SubscriptionEntitlement = {
  status: 'free',
  plan: null,
  freeAiGenerationsUsed: 0,
  currentPeriodEnd: null,
  paddleCustomerId: null,
  complimentaryPremiumUntil: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  entitlement: null,
  loading: false,
  hydrated: false,
  error: null,
  paywallVisible: false,

  getFreemiumAccess: () => buildFreemiumAccess(get().entitlement),

  hasPaidPremium: () => {
    const status = get().entitlement?.status ?? 'free';
    return PREMIUM_STATUSES.includes(status);
  },

  isComplimentaryPremium: () => {
    if (get().hasPaidPremium()) return false;
    const until = get().entitlement?.complimentaryPremiumUntil;
    return until != null && new Date(until) > new Date();
  },

  isPremium: () => get().getFreemiumAccess().isPremium,

  isLimitedFree: () => get().getFreemiumAccess().isLimitedFree,

  getDailyLogLimit: () => get().getFreemiumAccess().dailyLogLimit,

  complimentaryDaysRemaining: () =>
    complimentaryDaysRemaining(get().entitlement?.complimentaryPremiumUntil),

  canGenerateAi: () => get().isPremium(),

  hasUsedFreeGeneration: () => !get().isPremium(),

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ entitlement: null, loading: false, hydrated: true });
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select(
          'status, plan, free_ai_generations_used, current_period_end, paddle_customer_id, complimentary_premium_until',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw new Error(error.message);

      set({
        entitlement: data
          ? {
              status: data.status as SubscriptionStatus,
              plan: data.plan as SubscriptionPlan | null,
              freeAiGenerationsUsed: data.free_ai_generations_used,
              currentPeriodEnd: data.current_period_end,
              paddleCustomerId: data.paddle_customer_id,
              complimentaryPremiumUntil: data.complimentary_premium_until,
            }
          : DEFAULT,
        loading: false,
        hydrated: true,
      });
    } catch (e) {
      set({ loading: false, hydrated: true, error: (e as Error).message });
    }
  },

  showPaywall: () => set({ paywallVisible: true }),
  hidePaywall: () => set({ paywallVisible: false }),

  clear: () =>
    set({
      entitlement: null,
      loading: false,
      hydrated: false,
      error: null,
      paywallVisible: false,
    }),
}));
