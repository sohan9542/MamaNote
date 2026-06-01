import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Share2 } from 'lucide-react-native';

import { ActivityCard } from '@components/ActivityCard';
import { BabyProfileCard } from '@components/BabyProfileCard';
import { BabySwitcher } from '@components/BabySwitcher';
import { LogEntryDetailSheet } from '@components/LogEntryDetailSheet';
import { LogEntryRow } from '@components/LogEntryRow';
import { MedicineSheet } from '@components/MedicineSheet';
import { RoutinePreviewCard } from '@components/RoutinePreviewCard';
import { QuickLogSheet } from '@components/QuickLogSheet';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { HOME_ACTIVITIES, type ActivityOption } from '@constants/activities';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useScheduleStore } from '@store/scheduleStore';
import {
  countTodayForActivity,
  getLastEntryForActivity,
  getLastFeedEntry,
} from '@utils/baby';
import { formatHeaderDate } from '@utils/date';
import type { LogEntry } from '@app-types/database';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const entries = useBabyStore((s) => s.entries);
  const fetchBabies = useBabyStore((s) => s.fetchBabies);
  const fetchEntries = useBabyStore((s) => s.fetchEntries);
  const routine = useScheduleStore((s) => s.routine);
  const fetchLatestRoutine = useScheduleStore((s) => s.fetchLatest);

  const [sheetActivity, setSheetActivity] = useState<ActivityOption | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LogEntry | null>(null);

  const activeBaby = babies.find((b) => b.id === activeBabyId) ?? babies[0] ?? null;
  const lastFeed = getLastFeedEntry(entries);

  const load = useCallback(async () => {
    await fetchBabies();
  }, [fetchBabies]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeBabyId) {
      fetchEntries(activeBabyId);
      fetchLatestRoutine(activeBabyId);
    }
  }, [activeBabyId, fetchEntries, fetchLatestRoutine]);

  const openActivity = (activity: ActivityOption) => {
    setSheetActivity(activity);
  };

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0] ??
    user?.email?.split('@')[0] ??
    'mama';

  return (
    <Screen scroll contentClassName="pb-28">
      <View className="mb-4 mt-2">
        <Text variant="caption" muted>
          {formatHeaderDate()}
        </Text>
          <View className="mt-1 flex-row items-end justify-between">
          <Text variant="display" className="font-display">
            {firstName}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/share')}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-600"
            >
              <Share2 size={20} color="#7C3AED" />
            </Pressable>
            <View className="h-11 w-11 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-600">
              <Bell size={20} color="#FB7185" />
            </View>
          </View>
        </View>
      </View>

      {activeBaby ? (
        <>
          <BabySwitcher />
          <BabyProfileCard baby={activeBaby} lastFeedAt={lastFeed?.started_at ?? null} />
        </>
      ) : (
        <View className="mb-6 rounded-3xl border border-dashed border-pink-200 bg-pink-50 p-6 dark:border-ink-600 dark:bg-ink-700">
          <Text variant="subtitle">Add your baby</Text>
          <Text muted variant="caption" className="mt-1">
            Complete setup to see age and activity tracking.
          </Text>
        </View>
      )}

      {routine ? (
        <View className="mb-6">
          <RoutinePreviewCard
            routine={routine}
            onPress={() => router.push('/routine')}
          />
        </View>
      ) : null}

      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Activities
        </Text>
        <Pressable onPress={() => router.push('/(tabs)/log')} hitSlop={8}>
          <Text variant="caption" className="font-semibold text-pink-500 dark:text-pink-300">
            View all
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerClassName="gap-0 pr-4"
      >
        {HOME_ACTIVITIES.map((activity) => {
          const last = getLastEntryForActivity(entries, activity);
          const todayCount = countTodayForActivity(entries, activity);
          return (
            <ActivityCard
              key={activity.id}
              label={activity.label}
              icon={activity.icon}
              bg={activity.bg}
              iconColor={activity.iconColor}
              lastAt={last?.started_at}
              todayCount={todayCount}
              onPress={() => openActivity(activity)}
            />
          );
        })}
      </ScrollView>

      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Recent activities
        </Text>
        <Text variant="caption" muted>
          {entries.length} total
        </Text>
      </View>

      <View className="gap-3">
        {entries.length === 0 ? (
          <View className="items-center rounded-3xl border border-ink-100/60 bg-white py-12 dark:border-ink-600 dark:bg-ink-700">
            <Text className="text-3xl">🌼</Text>
            <Text variant="subtitle" className="mt-2">
              No activities yet
            </Text>
            <Text muted variant="caption" className="mt-1 px-6 text-center">
              Tap an activity above — most logs take just one or two taps.
            </Text>
          </View>
        ) : (
          entries.slice(0, 10).map((entry) => (
            <LogEntryRow
              key={entry.id}
              entry={entry}
              onPress={() => setSelectedEntry(entry)}
            />
          ))
        )}
      </View>

      <LogEntryDetailSheet
        entry={selectedEntry}
        visible={selectedEntry != null}
        onClose={() => setSelectedEntry(null)}
        onUpdated={() => activeBabyId && fetchEntries(activeBabyId)}
      />

      {sheetActivity?.id === 'medicine' ? (
        <MedicineSheet
          activity={sheetActivity}
          visible={sheetActivity != null}
          onClose={() => setSheetActivity(null)}
          onSaved={() => activeBabyId && fetchEntries(activeBabyId)}
        />
      ) : (
        <QuickLogSheet
          activity={sheetActivity}
          visible={sheetActivity != null}
          onClose={() => setSheetActivity(null)}
          onSaved={() => activeBabyId && fetchEntries(activeBabyId)}
        />
      )}
    </Screen>
  );
}
