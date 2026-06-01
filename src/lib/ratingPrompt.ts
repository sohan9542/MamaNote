import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  RATING_PROMPT_AFTER_LOGS,
  RATING_PROMPT_COOLDOWN_DAYS,
} from '@constants/ratingPrompt';
import { supabase } from '@lib/supabase';
import { useSubscriptionStore } from '@store/subscriptionStore';

const PROMPT_KEY = '@mamanote/rating-prompt-shown';

async function readPromptShownAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PROMPT_KEY);
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : ts;
}

async function countUserLogs(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('log_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** After 5 saved logs (DB total), ask for a store rating once per cooldown. */
export async function trackLogSavedForRating(
  userId: string,
  onPrompt: () => void,
): Promise<void> {
  if (useSubscriptionStore.getState().hasPaidPremium()) return;

  const lastShown = await readPromptShownAt();
  const cooldownMs = RATING_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (lastShown != null && Date.now() - lastShown < cooldownMs) return;

  const total = await countUserLogs(userId);
  if (total < RATING_PROMPT_AFTER_LOGS) return;

  await AsyncStorage.setItem(PROMPT_KEY, new Date().toISOString());
  onPrompt();
}

export async function resetRatingPromptState(): Promise<void> {
  await AsyncStorage.removeItem(PROMPT_KEY);
}
