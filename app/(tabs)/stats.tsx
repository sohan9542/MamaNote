import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';

import { ActivityMiniChart } from '@components/ActivityMiniChart';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { RoutinePreviewCard } from '@components/RoutinePreviewCard';
import { Screen } from '@components/Screen';
import { StatsEntriesSheet } from '@components/StatsEntriesSheet';
import { Text } from '@components/Text';
import { WeeklyAreaChart } from '@components/WeeklyAreaChart';
import { getActivityById } from '@constants/activities';
import { FREE_DAILY_LOG_LIMIT } from '@constants/freemium';
import { countTodayLogsFromEntries } from '@lib/freemium';
import { PremiumRequiredError } from '@lib/schedule';
import { useBabyStore } from '@store/babyStore';
import { useScheduleStore } from '@store/scheduleStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { countTodayForActivity } from '@utils/baby';
import { PLUS_MESSAGES, promptPlusUpgrade, requirePlus } from '@utils/plusUpgrade';
import {
  buildActivityMiniCharts,
  buildTrendChartData,
  trendUsesWeeklyBuckets,
  type StatsChartPeriod,
  type TrendChartPoint,
  weekDateKeyEnd,
} from '@utils/scheduleChart';
import {
  filterEntriesForStats,
  statsFilterTitle,
  type StatsFilter,
} from '@utils/statsFilter';

export default function StatsScreen() {
  const router = useRouter();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const entries = useBabyStore((s) => s.entries);
  const fetchEntries = useBabyStore((s) => s.fetchEntries);

  const routine = useScheduleStore((s) => s.routine);
  const generating = useScheduleStore((s) => s.generating);
  const routineError = useScheduleStore((s) => s.error);
  const fetchLatest = useScheduleStore((s) => s.fetchLatest);
  const generate = useScheduleStore((s) => s.generate);
  const premiumRequired = useScheduleStore((s) => s.premiumRequired);
  const clearPremiumRequired = useScheduleStore((s) => s.clearPremiumRequired);

  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const canGenerateAi = useSubscriptionStore((s) => s.canGenerateAi);

  const [chartPeriod, setChartPeriod] = useState<StatsChartPeriod>('7d');
  const [sheetFilter, setSheetFilter] = useState<StatsFilter | null>(null);

  const periodDays =
    chartPeriod === '30d' ? 30 : chartPeriod === 'all' ? 30 : 7;

  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;

  const trendData = useMemo(
    () => buildTrendChartData(entries, chartPeriod),
    [entries, chartPeriod],
  );

  const activityCharts = useMemo(
    () => buildActivityMiniCharts(entries, periodDays),
    [entries, periodDays],
  );

  const sheetEntries = useMemo(
    () => (sheetFilter ? filterEntriesForStats(entries, sheetFilter) : []),
    [entries, sheetFilter],
  );

  const sheetTitle = sheetFilter ? statsFilterTitle(sheetFilter) : '';

  const todayLogCount = useMemo(
    () => (activeBabyId ? countTodayLogsFromEntries(entries, activeBabyId) : 0),
    [entries, activeBabyId],
  );

  const openSheet = (filter: StatsFilter) => {
    if (!requirePlus(PLUS_MESSAGES.weeklyInsights)) return;
    setSheetFilter(filter);
  };
  const closeSheet = () => setSheetFilter(null);

  const load = useCallback(async () => {
    if (activeBabyId) {
      await fetchEntries(activeBabyId);
      await fetchLatest(activeBabyId);
    }
  }, [activeBabyId, fetchEntries, fetchLatest]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (premiumRequired) {
      promptPlusUpgrade(PLUS_MESSAGES.generateRoutine);
      clearPremiumRequired();
    }
  }, [premiumRequired, clearPremiumRequired]);

  const handleGenerate = async () => {
    if (!activeBabyId) {
      Alert.alert('No baby yet', 'Complete baby setup to generate a routine.');
      return;
    }
    if (entries.length < 3) {
      Alert.alert(
        'Keep logging',
        'Log at least a few activities over the week so Claude can spot patterns.',
      );
      return;
    }
    if (!canGenerateAi()) {
      promptPlusUpgrade(PLUS_MESSAGES.generateRoutine);
      return;
    }
    try {
      await generate(activeBabyId, periodDays);
      router.push('/routine');
    } catch (e) {
      if (e instanceof PremiumRequiredError) {
        promptPlusUpgrade(PLUS_MESSAGES.generateRoutine);
        return;
      }
      Alert.alert('Could not generate routine', (e as Error).message);
    }
  };

  const openRoutine = () => {
    if (!requirePlus(PLUS_MESSAGES.generateRoutine)) return;
    router.push('/routine');
  };

  const handleTrendDayPress = (point: TrendChartPoint) => {
    const weekly = trendUsesWeeklyBuckets(chartPeriod, trendData);
    if (weekly) {
      openSheet({ dateKey: point.dateKey, dateKeyEnd: weekDateKeyEnd(point.dateKey) });
      return;
    }
    openSheet({ dateKey: point.dateKey });
  };

  const handleChartPress = (activityId: string) => {
    openSheet({ activityId, dayCount: periodDays });
  };

  return (
    <Screen scroll contentClassName="pb-28">
      <Text variant="display" className="mb-2 mt-2 font-display">
        Insights
      </Text>
      <Text muted className="mb-6">
        {isPremium()
          ? 'Tap any chart to see the activities behind it.'
          : 'Explore everything — some features need MamaNote Plus after free limits.'}
      </Text>

      <Card tone="lavender" className="mb-6 gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-lavender-300/40">
            <Sparkles size={20} color="#7C3AED" />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-bold">
              Today&apos;s rhythm
            </Text>
            <Text variant="caption" muted className="mt-1">
              {activeBaby
                ? `AI maps ${activeBaby.name}'s week into a simple daily schedule.`
                : 'Add your baby to generate a schedule.'}
            </Text>
          </View>
        </View>

        {routine && isPremium() ? (
          <View className="gap-3">
            <RoutinePreviewCard routine={routine} onPress={openRoutine} />
            <Button variant="secondary" onPress={openRoutine} fullWidth>
              View full routine
            </Button>
          </View>
        ) : null}

        <Button
          onPress={handleGenerate}
          loading={generating}
          disabled={!activeBabyId}
          fullWidth
          leftIcon={<Sparkles size={18} color="#fff" />}
        >
          {routine && isPremium() ? 'Regenerate' : '✨ Generate'}
        </Button>

        {routineError ? (
          <Text variant="caption" className="text-pink-500">
            {routineError}
          </Text>
        ) : null}
      </Card>

      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Daily Statistics
        </Text>
        {!isPremium() && activeBabyId ? (
          <Text variant="caption" muted>
            {todayLogCount}/{FREE_DAILY_LOG_LIMIT} logs today
          </Text>
        ) : null}
      </View>
      <View className="mb-6 flex-row flex-wrap gap-3">
        {activityCharts.map((chart) => {
          const activity = getActivityById(chart.activityId);
          const todayCount = activity ? countTodayForActivity(entries, activity) : 0;
          return (
            <ActivityMiniChart
              key={chart.activityId}
              data={chart}
              todayCount={todayCount}
              onPress={handleChartPress}
            />
          );
        })}
      </View>

      <View className="mb-6">
        <WeeklyAreaChart
          data={trendData}
          period={chartPeriod}
          onPeriodChange={setChartPeriod}
          onDayPress={handleTrendDayPress}
        />
      </View>

      <StatsEntriesSheet
        visible={sheetFilter != null}
        title={sheetTitle}
        entries={sheetEntries}
        onClose={closeSheet}
        onUpdated={() => activeBabyId && fetchEntries(activeBabyId)}
      />
    </Screen>
  );
}
