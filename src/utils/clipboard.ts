import { Alert, Platform, Share } from 'react-native';

/** Copy text without requiring expo-clipboard native module (works before rebuild). */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  }

  try {
    const Clipboard = await import('expo-clipboard');
    await Clipboard.setStringAsync(text);
    return true;
  } catch {
    // Dev build missing ExpoClipboard — fall back to share sheet
    await Share.share({ message: text });
    return false;
  }
}

export async function copyToClipboardWithFeedback(text: string): Promise<void> {
  const copied = await copyToClipboard(text);
  if (!copied && Platform.OS !== 'web') {
    Alert.alert('Copy link', 'Use “Copy” from the share sheet, or rebuild the app to enable one-tap copy.');
  }
}
