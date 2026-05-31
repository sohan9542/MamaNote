import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { getActivityForEntry } from '@constants/activities';
import { entryDetailLine, entryDisplayTitle } from '@utils/baby';
import { activityTimeLabel } from '@utils/date';
import type { LogEntry } from '@app-types/database';
import type { LogMetadata } from '@constants/logFields';

interface Props {
  entry: LogEntry;
  onPress?: () => void;
}

export function LogEntryRow({ entry, onPress }: Props) {
  const meta = (entry.metadata ?? {}) as LogMetadata;
  const activity = getActivityForEntry(entry.type, meta);
  const Icon = activity?.icon;
  const iconColor = activity?.iconColor ?? '#FB7185';
  const bg = activity?.bg ?? '#FDF2F8';

  const content = (
    <>
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: bg }}
      >
        {Icon ? (
          <Icon size={20} color={iconColor} strokeWidth={2} />
        ) : (
          <Text className="text-lg">•</Text>
        )}
      </View>
      <View className="flex-1">
        <Text variant="subtitle" className="text-[15px] font-bold">
          {entryDisplayTitle(entry)}
        </Text>
        <Text variant="caption" muted numberOfLines={2} className="mt-0.5 leading-4">
          {entryDetailLine(entry)}
        </Text>
      </View>
      <Text variant="caption" muted className="max-w-[88px] text-right text-[11px] leading-4">
        {activityTimeLabel(entry.started_at)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-3 rounded-2xl border border-ink-100/40 bg-white px-4 py-3.5 active:opacity-85 dark:border-ink-600 dark:bg-ink-700"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-ink-100/40 bg-white px-4 py-3.5 dark:border-ink-600 dark:bg-ink-700">
      {content}
    </View>
  );
}
