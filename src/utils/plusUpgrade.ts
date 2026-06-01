import { Alert } from 'react-native';

import { FreemiumLimitError } from '@lib/freemium';
import { useSubscriptionStore } from '@store/subscriptionStore';

const DEFAULT_TITLE = 'MamaNote Plus';

export function promptPlusUpgrade(
  message = 'This feature requires MamaNote Plus. Subscribe to unlock unlimited logging, sharing, insights, and more.',
  title = DEFAULT_TITLE,
) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Get Plus', onPress: () => useSubscriptionStore.getState().showPaywall() },
  ]);
}

export function requirePlus(message?: string): boolean {
  if (useSubscriptionStore.getState().isPremium()) return true;
  promptPlusUpgrade(message);
  return false;
}

/** Returns true when a freemium limit alert was shown (caller should skip generic error UI). */
export function handleFreemiumError(error: unknown): boolean {
  if (error instanceof FreemiumLimitError) {
    promptPlusUpgrade(error.message);
    return true;
  }
  return false;
}

export const PLUS_MESSAGES = {
  generateRoutine:
    'AI daily rhythms are part of MamaNote Plus. Subscribe to generate personalized schedules from your logs.',
  weeklyInsights:
    'Weekly drill-downs and activity details are part of MamaNote Plus.',
  addBaby:
    'Multiple baby profiles are included with MamaNote Plus.',
  share:
    'Sharing activity links with family is part of MamaNote Plus.',
  growthSkills:
    'Growth & skills tracking is part of MamaNote Plus.',
  sleepHub:
    'Sleep timer and schedules are part of MamaNote Plus.',
  medicineReminders:
    'Medicine reminders are included with MamaNote Plus.',
  routinePreview:
    'AI daily rhythms are part of MamaNote Plus.',
} as const;
