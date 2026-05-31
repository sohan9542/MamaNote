import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { getActivityById } from '@constants/activities';
import type { ActivityDayCount } from '@utils/scheduleChart';

interface Props {
  data: ActivityDayCount;
  todayCount: number;
  onPress?: (activityId: string) => void;
}

export function ActivityMiniChart({ data, todayCount, onPress }: Props) {
  const activity = getActivityById(data.activityId);
  const Icon = activity?.icon;
  const total = data.counts.reduce((a, b) => a + b, 0);
  const cardBg = activity?.bg ?? `${data.color}18`;

  const content = (
    <>
      <View className="mb-1 flex-row items-start justify-between">
        <View className="flex-row items-center gap-2">
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: `${data.color}25` }}
          >
            {Icon ? (
              <Icon size={16} color={data.color} strokeWidth={2} />
            ) : null}
          </View>
          <Text variant="caption" className="font-bold">
            {data.label}
          </Text>
        </View>
        <View
          className="mt-0.5 h-3 w-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
      </View>

      <View className="items-center py-3">
        <Text variant="display" className="font-display text-4xl font-bold">
          {todayCount}
        </Text>
      </View>

      <Text variant="caption" muted className="text-center">
        {total} this week
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(data.activityId)}
        className="min-w-[47%] flex-1 rounded-2xl p-4 active:opacity-85"
        style={{ backgroundColor: cardBg }}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      className="min-w-[47%] flex-1 rounded-2xl p-4"
      style={{ backgroundColor: cardBg }}
    >
      {content}
    </View>
  );
}
