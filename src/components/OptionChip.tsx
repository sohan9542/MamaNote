import { Pressable } from 'react-native';

import { Text } from './Text';
import { cn } from '@utils/cn';

interface OptionChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  className?: string;
}

export function OptionChip({ label, selected, onPress, className }: OptionChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-full border px-4 py-2',
        selected
          ? 'border-lavender-400 bg-lavender-200 dark:border-lavender-300 dark:bg-lavender-200/20'
          : 'border-ink-100/60 bg-white dark:border-ink-600 dark:bg-ink-700',
        className,
      )}
    >
      <Text variant="caption" className={cn('font-semibold', selected && 'text-lavender-700 dark:text-lavender-200')}>
        {label}
      </Text>
    </Pressable>
  );
}
