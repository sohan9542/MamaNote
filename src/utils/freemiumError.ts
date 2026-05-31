import { FreemiumLimitError } from '@lib/freemium';
import { useSubscriptionStore } from '@store/subscriptionStore';

export function handleFreemiumError(error: unknown, fallbackMessage = 'Something went wrong') {
  if (error instanceof FreemiumLimitError) {
    useSubscriptionStore.getState().showPaywall();
    return error.message;
  }
  return error instanceof Error ? error.message : fallbackMessage;
}
