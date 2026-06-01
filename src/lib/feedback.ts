import { Linking, Platform, Share } from 'react-native';
import Constants from 'expo-constants';

import { copyToClipboard } from '@utils/clipboard';

function appVersion() {
  return Constants.expoConfig?.version ?? '1.0.0';
}

export function feedbackEmail() {
  return process.env.EXPO_PUBLIC_FEEDBACK_EMAIL?.trim() || '';
}

export function hasFeedbackEmail() {
  return feedbackEmail().length > 0;
}

export function storeListingUrl() {
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_APP_STORE_URL?.trim() || '';
  }
  return process.env.EXPO_PUBLIC_PLAY_STORE_URL?.trim() || '';
}

export function hasStoreListing() {
  return storeListingUrl().length > 0;
}

function formatFeedback(message: string, userEmail?: string) {
  return [
    message.trim(),
    '',
    '---',
    `App version: ${appVersion()}`,
    `Platform: ${Platform.OS}`,
    userEmail ? `From: ${userEmail}` : undefined,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function openStoreListing() {
  const url = storeListingUrl();
  if (!url) {
    throw new Error('Store rating will be available once MamaNote is published.');
  }
  await Linking.openURL(url);
}

export async function sendFeedback(message: string, userEmail?: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error('Please write your feedback before sending.');
  }

  const payload = formatFeedback(trimmed, userEmail);
  const email = feedbackEmail();

  if (email) {
    const subject = encodeURIComponent('MamaNote feedback');
    const body = encodeURIComponent(payload);
    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (!canOpen) {
      throw new Error('No email app found on this device.');
    }
    await Linking.openURL(mailto);
    return 'email' as const;
  }

  const copied = await copyToClipboard(payload);
  if (!copied) {
    await Share.share({ message: payload, title: 'MamaNote feedback' });
    return 'share' as const;
  }
  return 'clipboard' as const;
}
