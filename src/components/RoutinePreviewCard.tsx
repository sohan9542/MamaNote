import { Pressable, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { Text } from './Text';
import type { GeneratedRoutine } from '@app-types/schedule';

interface Props {
  routine: GeneratedRoutine;
  onPress: () => void;
}

export function RoutinePreviewCard({ routine, onPress }: Props) {
  const next = routine.typicalDay[0];

  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center gap-3.5 rounded-3xl bg-lavender-100 px-5 py-5 dark:bg-lavender-200/15">
        <Text className="text-4xl">✨</Text>
        <View className="flex-1">
          <Text variant="subtitle" className="text-base font-bold text-lavender-800 dark:text-lavender-200">
            Today&apos;s rhythm
          </Text>
          {next ? (
            <Text variant="caption" muted className=" text-[13px] leading-4">
              Up next: {next.label} · {next.startTime}
            </Text>
          ) : null}
        </View>
        <ChevronRight size={22} color="#7C3AED" />
      </View>
    </Pressable>
  );
}
