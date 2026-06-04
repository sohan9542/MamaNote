import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { getActivityById } from '@constants/activities';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@utils/cn';
import type { ActivityDayCount } from '@utils/scheduleChart';

interface Props {
  data: ActivityDayCount;
  /** e.g. "this week" | "this month" */
  periodLabel: string;
  onPress?: (activityId: string) => void;
}

export function ActivityMiniChart({ data, periodLabel, onPress }: Props) {
  const { isDark } = useTheme();
  const activity = getActivityById(data.activityId);
  const Icon = activity?.icon;
  const total = data.counts.reduce((a, b) => a + b, 0);

  const cardStyle = isDark
    ? {
        backgroundColor: `${data.color}18`,
        borderColor: `${data.color}35`,
        borderWidth: 1,
      }
    : { backgroundColor: activity?.bg ?? `${data.color}18` };

  const content = (
    <>
      <View className="mb-1 flex-row items-center justify-center gap-2">
        <View
          className={cn(
            'h-8 w-8 items-center justify-center rounded-full',
            isDark ? 'bg-ink-800/90' : 'bg-white/80',
          )}
        >
          {Icon ? (
            <Icon size={16} color={data.color} strokeWidth={2} />
          ) : null}
        </View>
        <Text
          variant="caption"
          className="font-bold text-ink-800 dark:text-ink-50"
          numberOfLines={1}
        >
          {data.label}
        </Text>
      </View>

      <View className="items-center py-3">
        <Text
          variant="display"
          className="font-display text-4xl font-bold text-ink-800 dark:text-ink-50"
        >
          {total}
        </Text>
      </View>

      <Text
        variant="caption"
        className="text-center text-ink-500 dark:text-ink-300"
      >
        {periodLabel}
      </Text>
    </>
  );

  const cardClassName = cn(
    'min-w-[47%] flex-1 rounded-2xl p-4',
    !isDark && 'border border-transparent',
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(data.activityId)}
        className={cn(cardClassName, 'active:opacity-85')}
        style={cardStyle}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className={cardClassName} style={cardStyle}>
      {content}
    </View>
  );
}
