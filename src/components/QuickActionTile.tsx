import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from './Text';
import { cn } from '@utils/cn';

interface Props {
  icon: LucideIcon;
  label: string;
  tone: 'pink' | 'mint' | 'lavender' | 'beige';
  onPress?: () => void;
}

const TONE_BG: Record<Props['tone'], string> = {
  pink: 'bg-pink-100 dark:bg-pink-100/10',
  mint: 'bg-mint-100 dark:bg-mint-100/10',
  lavender: 'bg-lavender-100 dark:bg-lavender-100/10',
  beige: 'bg-beige-100 dark:bg-beige-100/10',
};

const TONE_ICON: Record<Props['tone'], string> = {
  pink: '#FB7185',
  mint: '#4ADE80',
  lavender: '#A78BFA',
  beige: '#D9BC8A',
};

export function QuickActionTile({ icon: Icon, label, tone, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-1 items-center justify-center gap-2 rounded-3xl py-5 active:opacity-70',
        TONE_BG[tone],
      )}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/70 dark:bg-ink-700">
        <Icon size={22} color={TONE_ICON[tone]} />
      </View>
      <Text variant="caption" className="font-semibold">
        {label}
      </Text>
    </Pressable>
  );
}
