import { memo, useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

import { GrowthSkillRow } from '@components/growth/GrowthSkillRow';
import { Text } from '@components/Text';
import { skillToken } from '@store/growthStore';
import type { Milestone } from '@constants/milestones';
import { cn } from '@utils/cn';

type Props = {
  milestone: Milestone;
  ageMonths: number;
  isCurrent: boolean;
  expanded: boolean;
  completedSet: Set<string>;
  onToggleExpand: (milestoneId: string) => void;
  onToggleSkill: (milestoneId: string, skillIndex: number) => void;
};

function GrowthMilestoneCardComponent({
  milestone,
  ageMonths,
  isCurrent,
  expanded,
  completedSet,
  onToggleExpand,
  onToggleSkill,
}: Props) {
  const isPast = milestone.monthEnd <= ageMonths;
  const doneCount = milestone.skills.filter((_, i) =>
    completedSet.has(skillToken(milestone.id, i)),
  ).length;
  const allDone = doneCount === milestone.skills.length;

  const handleHeaderPress = useCallback(() => {
    onToggleExpand(milestone.id);
  }, [milestone.id, onToggleExpand]);

  return (
    <View className="mb-4 w-full">
      <Pressable
        onPress={handleHeaderPress}
        className={cn(
          'w-full flex-row items-center gap-3 border-2 bg-white p-4 dark:bg-ink-800',
          expanded ? 'rounded-t-3xl rounded-b-none border-b-0' : 'rounded-3xl',
          isCurrent ? 'border-violet-300 dark:border-violet-600' : 'border-ink-100 dark:border-ink-600',
        )}
      >
        <View
          className={cn(
            'h-14 w-14 shrink-0 items-center justify-center rounded-full border-[3px] bg-white dark:bg-ink-700',
          )}
          style={{ borderColor: allDone ? '#FBBF24' : milestone.ringColor }}
        >
          <View
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: milestone.bgColor }}
          >
            <Text className="text-xl">{allDone ? '🏆' : milestone.emoji}</Text>
          </View>
        </View>

        <View className="min-w-0 flex-1">
          {isCurrent ? (
            <View className="mb-1 self-start rounded-full bg-pink-400 px-2.5 py-0.5">
              <Text className="text-[9px] font-bold uppercase text-white">You are here</Text>
            </View>
          ) : null}
          <Text className="text-base font-bold text-ink-800 dark:text-ink-50" numberOfLines={2}>
            {milestone.funTitle} {milestone.emoji}
          </Text>
          <Text variant="caption" muted numberOfLines={1}>
            {milestone.title}
            {isPast && !isCurrent ? ' · explored' : ''} · {doneCount}/{milestone.skills.length}
          </Text>
        </View>

        <ChevronDown
          size={20}
          color="#8B5CF6"
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {expanded ? (
        <View
          className={cn(
            'w-full gap-3 rounded-b-3xl border-2 border-t-0 bg-white px-4 pb-4 pt-2 dark:bg-ink-800',
            isCurrent ? 'border-violet-300 dark:border-violet-600' : 'border-ink-100 dark:border-ink-600',
          )}
        >
          {isCurrent ? (
            <Text
              variant="caption"
              className="text-center font-medium text-violet-600 dark:text-violet-300"
            >
              Tap a star when you spot it
            </Text>
          ) : null}
          {milestone.skills.map((skill, skillIndex) => (
            <GrowthSkillRow
              key={skillIndex}
              label={skill}
              done={completedSet.has(skillToken(milestone.id, skillIndex))}
              accentColor={milestone.ringColor}
              onPress={() => onToggleSkill(milestone.id, skillIndex)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export const GrowthMilestoneCard = memo(GrowthMilestoneCardComponent);
