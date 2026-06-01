export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'past_due';

export type SubscriptionPlan = 'monthly' | 'annual' | 'lifetime';

export const PREMIUM_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

export const PLANS: Array<{
  id: SubscriptionPlan;
  label: string;
  price: string;
  sublabel: string;
  badge?: string;
}> = [
  {
    id: 'annual',
    label: 'Annual',
    price: '$39.99/yr',
    sublabel: '~$3.33/mo · Billed yearly',
    badge: 'Best value',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    price: '$5.99/mo',
    sublabel: 'Cancel anytime',
  },
  {
    id: 'lifetime',
    label: 'Lifetime',
    price: '$59.99',
    sublabel: 'One-time purchase',
  },
];

export const PLUS_FEATURES = [
  'Unlimited activity logs',
  'Multiple baby profiles',
  'Unlimited sharing with family',
  'Full insights, weekly charts & AI routines',
];

/** Set in .env after creating prices in Paddle dashboard (sandbox + live). */
export const PADDLE_PRICE_IDS: Record<SubscriptionPlan, string | undefined> = {
  monthly: process.env.EXPO_PUBLIC_PADDLE_PRICE_MONTHLY,
  annual: process.env.EXPO_PUBLIC_PADDLE_PRICE_ANNUAL,
  lifetime: process.env.EXPO_PUBLIC_PADDLE_PRICE_LIFETIME,
};

export function planCheckoutCta(plan: SubscriptionPlan): string {
  return plan === 'lifetime' ? 'Purchase' : 'Subscribe';
}

export function planCheckoutFootnote(plan: SubscriptionPlan): string {
  if (plan === 'lifetime') {
    return 'Secure checkout opens inside the app.\nOne-time payment — Plus access does not expire.';
  }
  return 'Secure checkout opens inside the app.\nCancel anytime from your subscription settings.';
}

export function planLabel(plan: SubscriptionPlan | null | undefined): string {
  switch (plan) {
    case 'monthly':
      return 'Monthly';
    case 'annual':
      return 'Annual';
    case 'lifetime':
      return 'Lifetime';
    default:
      return 'MamaNote Plus';
  }
}

export function statusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Active';
    case 'canceled':
      return 'Canceled';
    case 'past_due':
      return 'Payment issue';
    default:
      return 'Free';
  }
}
