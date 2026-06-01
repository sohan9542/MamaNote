import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, RefreshCw } from 'lucide-react-native';

import { Button } from '@components/Button';
import { PaywallSheet } from '@components/PaywallSheet';
import { RoutineBlockList, RoutineNextCards } from '@components/RoutineBlockList';
import { RoutineSourceBadge } from '@components/RoutineSourceBadge';
import { RoutineTimelineChart } from '@components/RoutineTimelineChart';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { PLUS_MESSAGES, promptPlusUpgrade, requirePlus } from '@utils/plusUpgrade';
import { PremiumRequiredError } from '@lib/schedule';
import { useBabyStore } from '@store/babyStore';
import { useScheduleStore } from '@store/scheduleStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { babyAge } from '@utils/date';

export default function RoutineScreen() {
  const router = useRouter();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const entries = useBabyStore((s) => s.entries);

  const routine = useScheduleStore((s) => s.routine);
  const routineMeta = useScheduleStore((s) => s.routineMeta);
  const generating = useScheduleStore((s) => s.generating);
  const premiumRequired = useScheduleStore((s) => s.premiumRequired);
  const clearPremiumRequired = useScheduleStore((s) => s.clearPremiumRequired);
  const fetchLatest = useScheduleStore((s) => s.fetchLatest);
  const generate = useScheduleStore((s) => s.generate);

  const paywallVisible = useSubscriptionStore((s) => s.paywallVisible);
  const hidePaywall = useSubscriptionStore((s) => s.hidePaywall);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);

  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;

  const load = useCallback(async () => {
    if (activeBabyId) await fetchLatest(activeBabyId);
  }, [activeBabyId, fetchLatest]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (premiumRequired) {
      promptPlusUpgrade(PLUS_MESSAGES.generateRoutine);
      clearPremiumRequired();
    }
  }, [premiumRequired, clearPremiumRequired]);

  const handleRefresh = async () => {
    if (!activeBabyId) return;
    if (!requirePlus(PLUS_MESSAGES.generateRoutine)) return;
    try {
      await generate(activeBabyId, 7);
      await fetchSubscription();
    } catch (e) {
      if (e instanceof PremiumRequiredError) {
        promptPlusUpgrade(PLUS_MESSAGES.generateRoutine);
      }
    }
  };

  const handlePaywallClose = () => {
    hidePaywall();
    clearPremiumRequired();
  };

  return (
    <Screen scroll contentClassName="pb-10">
      <View className="mb-5 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
        >
          <ChevronLeft size={22} color="#FB7185" />
        </Pressable>
        {routine ? (
          <Pressable
            onPress={handleRefresh}
            disabled={generating}
            className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
          >
            {generating ? (
              <ActivityIndicator size="small" color="#7C3AED" />
            ) : (
              <RefreshCw size={18} color="#7C3AED" />
            )}
          </Pressable>
        ) : null}
      </View>

      {!routine ? (
        <View className="items-center gap-4 py-16">
          <Text className="text-5xl">🌈</Text>
          <Text variant="title" className="font-bold">
            No rhythm yet
          </Text>
          <Text muted variant="caption" className="px-8 text-center">
            Log a few activities, then we&apos;ll map out your day.
          </Text>
          <Button
            onPress={handleRefresh}
            loading={generating}
            disabled={!activeBabyId || entries.length < 3}
            size="lg"
          >
            ✨ Generate
          </Button>
        </View>
      ) : (
        <>
          {/* Hero */}
          <View className="mb-6 items-center rounded-[32px] bg-lavender-200 px-6 py-8 dark:bg-lavender-200/15">
            <Text className="text-4xl">✨</Text>
            <Text variant="display" className="mt-2 font-display">
              Today&apos;s rhythm
            </Text>
            {activeBaby ? (
              <Text variant="caption" muted className="mt-1">
                {activeBaby.name} · {babyAge(activeBaby.birth_date)}
              </Text>
            ) : null}
            <View className="mt-3">
              <RoutineSourceBadge meta={routineMeta} />
            </View>
          </View>

          <View className="mb-6">
            <RoutineNextCards
              feed={routine.nextFeedWindow}
              sleep={routine.nextSleepWindow}
            />
          </View>

          <View className="mb-6">
            <RoutineTimelineChart blocks={routine.typicalDay} />
          </View>

          <Text variant="subtitle" className="mb-4 font-bold">
            Your day
          </Text>
          <RoutineBlockList routine={routine} compact />
        </>
      )}

      <PaywallSheet
        visible={paywallVisible}
        onClose={handlePaywallClose}
        onSubscribed={fetchSubscription}
      />
    </Screen>
  );
}
