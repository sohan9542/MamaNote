import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import { Check, Copy, Link2, Share2 } from 'lucide-react-native';

import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import { copyToClipboard } from '@utils/clipboard';

interface Props {
  url: string;
  filterLabel: string;
  entryCount: number;
  expiresLabel: string;
}

export function ShareLinkCard({ url, filterLabel, entryCount, expiresLabel }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const copied = await copyToClipboard(url);
    if (copied) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    await Share.share({
      message: `View ${filterLabel.toLowerCase()} on Mamanote:\n${url}`,
      url,
      title: 'Mamanote activity log',
    });
  };

  return (
    <Card className="items-center gap-5">
      <View className="items-center gap-2">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-lavender-200 dark:bg-lavender-200/20">
          <Link2 size={22} color="#7C3AED" />
        </View>
        <Text variant="subtitle" className="text-center font-bold">
          Share link ready
        </Text>
        <Text variant="caption" muted className="text-center">
          {entryCount} {entryCount === 1 ? 'activity' : 'activities'} · {filterLabel}
        </Text>
        <Text variant="caption" muted className="text-center">
          Expires {expiresLabel}
        </Text>
      </View>

      <View className="rounded-3xl border border-ink-100/80 bg-white p-5 dark:border-ink-600 dark:bg-ink-800">
        <QRCode value={url} size={180} backgroundColor="transparent" color="#322C44" />
      </View>

      <Text variant="caption" muted className="text-center leading-5">
        Scan the QR code or send the link to a partner, pediatrician, or caregiver.
      </Text>

      <View className="w-full rounded-2xl border border-ink-100/80 bg-ink-50 px-4 py-3 dark:border-ink-600 dark:bg-ink-700">
        <Text variant="caption" className="font-mono text-xs leading-5 text-ink-700 dark:text-ink-100">
          {url}
        </Text>
      </View>

      <View className="w-full gap-3">
        <Button onPress={handleShare} size="lg" fullWidth leftIcon={<Share2 size={18} color="#fff" />}>
          Share link
        </Button>
        <Pressable
          onPress={handleCopy}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-ink-100/80 py-3 dark:border-ink-600"
        >
          {copied ? (
            <Check size={16} color="#16A34A" />
          ) : (
            <Copy size={16} color="#7C3AED" />
          )}
          <Text variant="caption" className="font-semibold">
            {copied ? 'Copied!' : 'Copy link'}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
