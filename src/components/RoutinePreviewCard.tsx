import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Text } from './Text';
import type { GeneratedRoutine } from '@app-types/schedule';
import { useTheme } from '@hooks/useTheme';

interface Props {
  routine: GeneratedRoutine;
  onPress: () => void;
}

export function RoutinePreviewCard({ routine, onPress }: Props) {
  const { isDark, colors } = useTheme();
  const next = routine.typicalDay[0];
  const chevronColor = isDark ? colors.accent : '#7C3AED';

  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center gap-3.5 rounded-3xl bg-lavender-100 px-5 py-5 dark:bg-lavender-500/15">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/80 dark:bg-ink-800/90">
          <Text className="text-2xl">✨</Text>
        </View>
        <View className="flex-1">
          <Text variant="subtitle" className="text-base font-bold text-lavender-800 dark:text-lavender-200">
            Today&apos;s rhythm
          </Text>
          {next ? (
            <Text variant="caption" className="text-[13px] leading-4 text-ink-500 dark:text-ink-300">
              Up next: {next.label} · {next.startTime}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={22} color={chevronColor} />
      </View>
    </Pressable>
  );
}
