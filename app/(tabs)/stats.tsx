import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
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
import { countTodayLogsFromEntries } from '@lib/freemium';
import { PremiumRequiredError } from '@lib/schedule';
import { useTheme } from '@hooks/useTheme';
import { useBabyStore } from '@store/babyStore';
import { useScheduleStore } from '@store/scheduleStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { cn } from '@utils/cn';
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

export type StatsActivityPeriod = 'weekly' | 'monthly';

const STATS_PERIODS: { id: StatsActivityPeriod; label: string; days: number; caption: string }[] =
  [
    { id: 'weekly', label: 'Weekly', days: 7, caption: 'this week' },
    { id: 'monthly', label: 'Monthly', days: 30, caption: 'this month' },
  ];

export default function StatsScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
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
  const isLimitedFree = useSubscriptionStore((s) => s.isLimitedFree);
  const getDailyLogLimit = useSubscriptionStore((s) => s.getDailyLogLimit);
  const canGenerateAi = useSubscriptionStore((s) => s.canGenerateAi);

  const [chartPeriod, setChartPeriod] = useState<StatsChartPeriod>('7d');
  const [statsPeriod, setStatsPeriod] = useState<StatsActivityPeriod>('weekly');
  const [sheetFilter, setSheetFilter] = useState<StatsFilter | null>(null);

  const statsPeriodConfig =
    STATS_PERIODS.find((p) => p.id === statsPeriod) ?? STATS_PERIODS[0];
  const statsPeriodDays = statsPeriodConfig.days;

  const routinePeriodDays = 7;

  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;

  const trendData = useMemo(
    () => buildTrendChartData(entries, chartPeriod),
    [entries, chartPeriod],
  );

  const activityCharts = useMemo(
    () => buildActivityMiniCharts(entries, statsPeriodDays),
    [entries, statsPeriodDays],
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
      await generate(activeBabyId, routinePeriodDays);
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
    openSheet({ activityId, dayCount: statsPeriodDays });
  };

  return (
    <Screen scroll contentClassName="pb-28">
      <Text variant="display" className="mb-2 mt-2 font-display">
        Insights
      </Text>
      <Text muted className="mb-6">
        {isPremium()
          ? 'Tap any chart to see the activities behind it.'
          : isLimitedFree()
            ? 'View your history and daily counts — drill-downs and AI need MamaNote Plus.'
            : 'Explore everything — some features need MamaNote Plus.'}
      </Text>

      <Card tone="lavender" className="mb-6 gap-3">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-lavender-200 dark:bg-lavender-500/25">
            <Sparkles size={20} color={isDark ? colors.accent : '#7C3AED'} />
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
          {routine && isPremium() ? 'Regenerate' : ' Generate'}
        </Button>

        {routineError ? (
          <Text variant="caption" className="text-pink-500">
            {routineError}
          </Text>
        ) : null}
      </Card>

      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Statistics
        </Text>
        {!isPremium() && activeBabyId ? (
          <Text variant="caption" muted>
            {todayLogCount}/
            {Number.isFinite(getDailyLogLimit()) ? getDailyLogLimit() : '∞'} logs today
          </Text>
        ) : null}
      </View>

      <View className="mb-4 flex-row gap-2">
        {STATS_PERIODS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setStatsPeriod(p.id)}
            className={cn(
              'flex-1 items-center rounded-xl py-2',
              statsPeriod === p.id
                ? 'bg-lavender-500 dark:bg-lavender-400'
                : 'bg-ink-50 dark:bg-ink-600',
            )}
          >
            <Text
              variant="caption"
              className={cn(
                'font-semibold',
                statsPeriod === p.id ? 'text-white' : 'text-ink-600 dark:text-ink-200',
              )}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mb-6 flex-row flex-wrap gap-3">
        {activityCharts.map((chart) => (
          <ActivityMiniChart
            key={chart.activityId}
            data={chart}
            periodLabel={statsPeriodConfig.caption}
            onPress={handleChartPress}
          />
        ))}
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
