import { memo } from 'react';
import { View } from 'react-native';
import { Star } from 'lucide-react-native';

import { Text } from '@components/Text';

interface Props {
  babyName: string;
  ageLabel: string;
  completedCount: number;
  totalSkills: number;
  currentFunTitle: string;
  currentEmoji: string;
}

function GrowthProgressHeroComponent({
  babyName,
  ageLabel,
  completedCount,
  totalSkills,
  currentFunTitle,
  currentEmoji,
}: Props) {
  const pct = totalSkills > 0 ? Math.round((completedCount / totalSkills) * 100) : 0;
  const filledStars = Math.min(5, Math.max(0, Math.ceil((pct / 100) * 5)));

  return (
    <View className="w-full rounded-3xl border border-violet-100 bg-white p-5 dark:border-ink-600 dark:bg-ink-800">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text variant="caption" className="font-semibold uppercase tracking-widest text-pink-500">
            Adventure log
          </Text>
          <Text variant="subtitle" className="mt-1 font-bold text-violet-800 dark:text-violet-100">
            {babyName}&apos;s journey
          </Text>
          <Text variant="caption" muted className="mt-0.5">
            {ageLabel} old · {completedCount} superpowers spotted
          </Text>
        </View>
        <Text className="text-3xl">{currentEmoji}</Text>
      </View>

      <View className="mt-3 flex-row items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={20}
            color={i < filledStars ? '#FBBF24' : '#E5E7EB'}
            fill={i < filledStars ? '#FBBF24' : 'transparent'}
          />
        ))}
        <Text variant="caption" className="ml-2 font-bold text-amber-600">
          {pct}%
        </Text>
      </View>

      <View className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-100 dark:bg-ink-700">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: '#A78BFA',
            minWidth: pct > 0 ? 6 : 0,
          }}
        />
      </View>

      <View className="mt-3 rounded-xl bg-violet-50 px-3 py-2.5 dark:bg-violet-950/40">
        <Text variant="caption" className="font-bold text-violet-700 dark:text-violet-200">
          Right now: {currentFunTitle} {currentEmoji}
        </Text>
        <Text variant="caption" muted className="mt-0.5">
          Open a chapter below to log skills
        </Text>
      </View>
    </View>
  );
}

export const GrowthProgressHero = memo(GrowthProgressHeroComponent);
