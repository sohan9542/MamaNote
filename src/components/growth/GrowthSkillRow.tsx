import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Check, Star } from 'lucide-react-native';

import { Text } from '@components/Text';
import { cn } from '@utils/cn';

interface Props {
  label: string;
  done: boolean;
  accentColor: string;
  onPress: () => void;
}

function GrowthSkillRowComponent({ label, done, accentColor, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      className={cn(
        'min-h-[48px] flex-row items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 active:opacity-85',
        done ? 'border-transparent' : 'border-ink-100/80 dark:border-ink-600',
      )}
      style={
        done
          ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}44` }
          : undefined
      }
    >
      <View
        className={cn(
          'h-8 w-8 items-center justify-center rounded-full',
          !done && 'border-2 border-dashed border-ink-200 bg-white dark:border-ink-500 dark:bg-ink-700',
        )}
        style={done ? { backgroundColor: accentColor } : undefined}
      >
        {done ? (
          <Check size={16} color="#fff" strokeWidth={3} />
        ) : (
          <Star size={15} color={accentColor} fill={`${accentColor}22`} />
        )}
      </View>
      <Text
        variant="caption"
        className={cn(
          'flex-1 text-[13px] leading-5',
          done ? 'font-semibold text-ink-800 dark:text-ink-50' : 'text-ink-600 dark:text-ink-200',
        )}
      >
        {label}
      </Text>
      {done ? <Text className="text-base">✨</Text> : null}
    </Pressable>
  );
}

export const GrowthSkillRow = memo(GrowthSkillRowComponent);
