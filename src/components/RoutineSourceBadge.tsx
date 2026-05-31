import { View } from 'react-native';

import { Text } from './Text';
import type { RoutineMeta } from '@app-types/schedule';

interface Props {
  meta: RoutineMeta | null;
}

export function RoutineSourceBadge({ meta }: Props) {
  const isClaude = meta?.source === 'claude';

  if (!isClaude) {
    return (
      <View className="self-start rounded-full bg-amber-100 px-2.5 py-0.5 dark:bg-amber-900/30">
        <Text variant="caption" className="text-[10px] font-bold text-amber-700 dark:text-amber-200">
          Demo
        </Text>
      </View>
    );
  }

  return (
    <View className="self-start rounded-full bg-white/80 px-2.5 py-0.5 dark:bg-ink-700/80">
      <Text variant="caption" className="text-[10px] font-bold text-lavender-700 dark:text-lavender-200">
        Sonnet ✦
      </Text>
    </View>
  );
}
