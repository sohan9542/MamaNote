import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  UPGRADE_PROMPT_AFTER_LOGS,
  UPGRADE_PROMPT_COOLDOWN_DAYS,
} from '@constants/freemium';

const COUNT_KEY = '@mamanote/logs-saved-count';
const PROMPT_KEY = '@mamanote/upgrade-prompt-shown';

async function readCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(COUNT_KEY);
  return raw ? Number.parseInt(raw, 10) || 0 : 0;
}

async function readPromptShownAt(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PROMPT_KEY);
  if (!raw) return null;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? null : ts;
}

export async function trackLogSaved(
  isPremium: boolean,
  onPrompt: () => void,
): Promise<void> {
  if (isPremium) return;

  const next = (await readCount()) + 1;
  await AsyncStorage.setItem(COUNT_KEY, String(next));

  if (next < UPGRADE_PROMPT_AFTER_LOGS) return;

  const lastShown = await readPromptShownAt();
  const cooldownMs = UPGRADE_PROMPT_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  if (lastShown != null && Date.now() - lastShown < cooldownMs) return;

  await AsyncStorage.setItem(PROMPT_KEY, new Date().toISOString());
  onPrompt();
}

export async function resetFreemiumPromptState(): Promise<void> {
  await AsyncStorage.multiRemove([COUNT_KEY, PROMPT_KEY]);
}
