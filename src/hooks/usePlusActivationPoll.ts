import { useCallback, useEffect, useState } from 'react';

import {
  PLUS_ACTIVATION_POLL_MS,
  PLUS_ACTIVATION_TIMEOUT_MS,
} from '@lib/subscription';
import { useSubscriptionStore } from '@store/subscriptionStore';

export type PlusActivationPhase = 'activating' | 'active' | 'timeout';

export function usePlusActivationPoll(enabled: boolean) {
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);
  const hasPaidPremium = useSubscriptionStore((s) => s.hasPaidPremium);
  const [phase, setPhase] = useState<PlusActivationPhase>('activating');

  const refresh = useCallback(async () => {
    await fetchSubscription();
    if (useSubscriptionStore.getState().hasPaidPremium()) {
      setPhase('active');
      return true;
    }
    return false;
  }, [fetchSubscription]);

  useEffect(() => {
    if (!enabled) return;

    setPhase('activating');
    let cancelled = false;

    const tick = async () => {
      await fetchSubscription();
      if (cancelled) return;
      if (useSubscriptionStore.getState().hasPaidPremium()) {
        setPhase('active');
      }
    };

    void tick();

    const interval = setInterval(() => {
      void tick();
    }, PLUS_ACTIVATION_POLL_MS);

    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (!useSubscriptionStore.getState().hasPaidPremium()) {
        setPhase('timeout');
      }
    }, PLUS_ACTIVATION_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [enabled, fetchSubscription]);

  useEffect(() => {
    if (hasPaidPremium() && phase === 'activating') {
      setPhase('active');
    }
  }, [hasPaidPremium, phase]);

  return { phase, refresh };
}
