import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { PLUS_MESSAGES, promptPlusUpgrade } from '@utils/plusUpgrade';
import {
  FlatList,
  Pressable,
  View,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { GrowthMilestoneCard } from '@components/growth/GrowthMilestoneCard';
import { GrowthProgressHero } from '@components/growth/GrowthProgressHero';
import { Text } from '@components/Text';
import {
  MILESTONES,
  SKILL_CHEERS,
  getMilestoneForAgeMonths,
  type Milestone,
} from '@constants/milestones';
import { useBabyStore } from '@store/babyStore';
import {
  completedSkillsToSet,
  skillToken,
  useCompletedSkills,
  useGrowthStore,
} from '@store/growthStore';
import { babyAge, babyAgeInMonths } from '@utils/date';

const TOTAL_SKILLS = MILESTONES.reduce((sum, m) => sum + m.skills.length, 0);

export default function GrowthSkillsScreen() {
  const router = useRouter();
  const subscriptionLoading = useSubscriptionStore((s) => s.loading);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const babies = useBabyStore((s) => s.babies);

  useEffect(() => {
    if (subscriptionLoading) return;
    if (!isPremium()) {
      promptPlusUpgrade(PLUS_MESSAGES.growthSkills);
      router.back();
    }
  }, [subscriptionLoading, isPremium, router]);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;

  const hydrateForBaby = useGrowthStore((s) => s.hydrateForBaby);
  const toggleSkill = useGrowthStore((s) => s.toggleSkill);
  const completedSkills = useCompletedSkills(activeBaby?.id ?? null);
  const completedSet = useMemo(
    () => completedSkillsToSet(completedSkills),
    [completedSkills],
  );

  const ageMonths = activeBaby ? babyAgeInMonths(activeBaby.birth_date) : 0;
  const currentMilestone = useMemo(
    () => getMilestoneForAgeMonths(ageMonths),
    [ageMonths],
  );

  const [expandedId, setExpandedId] = useState<string | null>(currentMilestone.id);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeBabyId) void hydrateForBaby(activeBabyId);
  }, [activeBabyId, hydrateForBaby]);

  useEffect(() => {
    setExpandedId(currentMilestone.id);
  }, [currentMilestone.id, activeBabyId]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }, []);

  const handleToggleExpand = useCallback((milestoneId: string) => {
    setExpandedId((prev) => (prev === milestoneId ? null : milestoneId));
  }, []);

  const handleToggleSkill = useCallback(
    (milestoneId: string, skillIndex: number) => {
      if (!activeBaby) return;

      const milestone = MILESTONES.find((m) => m.id === milestoneId);
      if (!milestone) return;

      const token = skillToken(milestoneId, skillIndex);
      const wasDone = completedSet.has(token);

      void toggleSkill(activeBaby.id, milestoneId, skillIndex);

      if (!wasDone) {
        const cheerMsg = SKILL_CHEERS[Math.floor(Math.random() * SKILL_CHEERS.length)];
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const doneAfter =
          milestone.skills.filter((_, i) => {
            if (i === skillIndex) return true;
            return completedSet.has(skillToken(milestoneId, i));
          }).length;

        if (doneAfter === milestone.skills.length) {
          showToast(`Chapter complete: ${milestone.funTitle}! 🎉`);
        } else {
          showToast(`${cheerMsg} 🎉`);
        }
      }
    },
    [activeBaby, completedSet, toggleSkill, showToast],
  );

  const renderItem: ListRenderItem<Milestone> = useCallback(
    ({ item }) => (
      <View className="px-5">
        <GrowthMilestoneCard
          milestone={item}
          ageMonths={ageMonths}
          isCurrent={item.id === currentMilestone.id}
          expanded={item.id === expandedId}
          completedSet={completedSet}
          onToggleExpand={handleToggleExpand}
          onToggleSkill={handleToggleSkill}
        />
      </View>
    ),
    [
      ageMonths,
      currentMilestone.id,
      expandedId,
      completedSet,
      handleToggleExpand,
      handleToggleSkill,
    ],
  );

  const listHeader = useMemo(() => {
    if (!activeBaby) return null;
    return (
      <View className="px-5">
        <GrowthProgressHero
          babyName={activeBaby.name}
          ageLabel={babyAge(activeBaby.birth_date)}
          completedCount={completedSkills.length}
          totalSkills={TOTAL_SKILLS}
          currentFunTitle={currentMilestone.funTitle}
          currentEmoji={currentMilestone.emoji}
        />
        <Text
          variant="caption"
          className="mb-2 mt-6 text-center font-semibold uppercase tracking-widest text-violet-400"
        >
          Your adventure path
        </Text>
      </View>
    );
  }, [
    activeBaby,
    completedSkills.length,
    currentMilestone.funTitle,
    currentMilestone.emoji,
  ]);

  const listFooter = useMemo(
    () => (
      <View className="mb-8 mt-2 px-5">
        <View className="w-full items-center rounded-3xl bg-violet-100 px-6 py-5 dark:bg-violet-950/50">
          <Text className="text-2xl">🌈</Text>
          <Text variant="subtitle" className="mt-2 text-center font-bold text-violet-800 dark:text-violet-100">
            Every skill counts
          </Text>
          <Text variant="caption" muted className="mt-1 text-center leading-5">
            Babies grow at their own pace — celebrate the wins, never the rush.
          </Text>
        </View>
      </View>
    ),
    [],
  );

  if (!activeBaby) {
    return (
      <View className="flex-1 bg-violet-600 px-5 pt-14">
        <Pressable onPress={() => router.back()} className="mb-6 flex-row items-center gap-2">
          <ChevronLeft size={24} color="#fff" />
          <Text className="font-semibold text-white">Back</Text>
        </Pressable>
        <Text className="text-center text-white">Add a baby profile to see milestones.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F5F0FF] dark:bg-ink-900">
      {/* Full-width purple header — compact */}
      <SafeAreaView edges={['top']} className="bg-violet-500 dark:bg-violet-700">
        <View className="px-5 pb-4 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="mb-2 flex-row items-center gap-1.5 self-start rounded-full bg-white/20 px-3 py-1"
          >
            <ChevronLeft size={18} color="#fff" />
            <Text className="text-sm font-semibold text-white">Done</Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Text className="font-display text-xl font-bold text-white">Growth & Skills</Text>
            <Sparkles size={20} color="#FDE68A" />
          </View>
          <Text variant="caption" className="mt-1 text-violet-100">
            {activeBaby.name} · {babyAge(activeBaby.birth_date)} old
          </Text>

          {toast ? (
            <View className="mt-2 self-center rounded-full bg-white/95 px-4 py-1.5">
              <Text className="text-center text-xs font-semibold text-violet-700">{toast}</Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      <FlatList
        data={MILESTONES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerClassName="pb-10 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}
