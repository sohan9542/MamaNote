import { View } from 'react-native';
import { Baby as BabyIcon, Star } from 'lucide-react-native';

import { Text } from './Text';
import { babyAge, lastFeedLabel } from '@utils/date';
import type { Baby } from '@app-types/database';
import { useTheme } from '@hooks/useTheme';

interface Props {
  baby: Baby;
  lastFeedAt: string | null;
}

export function BabyProfileCard({ baby, lastFeedAt }: Props) {
  const { isDark } = useTheme();
  const age = babyAge(baby.birth_date);

  return (
    <View
      className="mb-6 overflow-hidden rounded-3xl border border-ink-100/50 bg-white p-5 dark:border-ink-600 dark:bg-ink-700"
      style={{
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.2 : 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <View className="flex-row items-center gap-4">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/20">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm dark:bg-ink-800/90">
            <BabyIcon size={32} color="#FB7185" strokeWidth={2} />
          </View>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text variant="title" className="text-xl font-bold">
              {baby.name}
            </Text>
            <Star size={16} color="#FBBF24" fill="#FBBF24" />
          </View>
          <Text variant="subtitle" className="mt-0.5 text-pink-500 dark:text-pink-300">
            {age} old
          </Text>
          <Text variant="caption" muted className="mt-1">
            {lastFeedLabel(lastFeedAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}
