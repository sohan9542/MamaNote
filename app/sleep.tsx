import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Moon, Sparkles, Sun } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { Text } from '@components/Text';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { PLUS_MESSAGES, promptPlusUpgrade } from '@utils/plusUpgrade';
import {
  DEFAULT_SCHEDULE,
  loadScheduleForBaby,
  useActiveSleepSession,
  useBabySleepPlan,
  useSleepStore,
  type SleepKind,
} from '@store/sleepStore';
import { formatElapsedTimer, formatTime, localDateKey } from '@utils/date';
import { generateSleepPlan } from '@utils/sleepSchedulePlan';
import { cn } from '@utils/cn';
import type { LogEntry } from '@app-types/database';

const NAP_COUNT_OPTIONS = [2, 3, 4, 5] as const;
const NAP_LENGTH_OPTIONS = [45, 60, 90, 120] as const;

function sleepMinutesToday(entries: LogEntry[]): number {
  const todayKey = localDateKey(new Date());
  return entries
    .filter((e) => e.type === 'sleep' && localDateKey(new Date(e.started_at)) === todayKey)
    .reduce((sum, e) => {
      if (e.ended_at) {
        const ms = new Date(e.ended_at).getTime() - new Date(e.started_at).getTime();
        return sum + Math.round(ms / 60_000);
      }
      const meta = (e.metadata ?? {}) as { durationMinutes?: number };
      return sum + (meta.durationMinutes ?? 0);
    }, 0);
}

function formatTotalMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'min-h-[44px] min-w-[52px] items-center justify-center rounded-2xl border-2 px-4 py-2.5',
        selected
          ? 'border-indigo-500 bg-indigo-500'
          : 'border-ink-200 bg-white active:bg-ink-50 dark:border-ink-500 dark:bg-ink-700 dark:active:bg-ink-600',
      )}
    >
      <Text
        variant="caption"
        className={cn(
          'font-bold',
          selected ? 'text-white' : 'text-ink-700 dark:text-ink-100',
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function SleepScreen() {
  const router = useRouter();
  const subscriptionLoading = useSubscriptionStore((s) => s.loading);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (subscriptionLoading) return;
    if (!isPremium()) {
      promptPlusUpgrade(PLUS_MESSAGES.sleepHub);
      router.back();
    }
  }, [subscriptionLoading, isPremium, router]);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const entries = useBabyStore((s) => s.entries);
  const addEntry = useBabyStore((s) => s.addEntry);
  const fetchEntries = useBabyStore((s) => s.fetchEntries);

  const hydrate = useSleepStore((s) => s.hydrate);
  const startSleep = useSleepStore((s) => s.startSleep);
  const stopSleep = useSleepStore((s) => s.stopSleep);
  const updateSchedule = useSleepStore((s) => s.updateSchedule);
  const saveGeneratedPlan = useSleepStore((s) => s.saveGeneratedPlan);

  const activeSession = useActiveSleepSession(activeBabyId);
  const savedPlan = useBabySleepPlan(activeBabyId);

  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [wakeTime, setWakeTime] = useState(DEFAULT_SCHEDULE.wakeTime);
  const [bedtime, setBedtime] = useState(DEFAULT_SCHEDULE.bedtime);
  const [targetNaps, setTargetNaps] = useState(DEFAULT_SCHEDULE.targetNaps);
  const [napDurationMinutes, setNapDurationMinutes] = useState(
    DEFAULT_SCHEDULE.napDurationMinutes,
  );

  const todaySleepMins = sleepMinutesToday(entries);
  const isDaySession = activeSession?.kind === 'day';

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!activeBabyId) return;
    let cancelled = false;
    void (async () => {
      await loadScheduleForBaby(activeBabyId);
      if (cancelled) return;
      const schedule = useSleepStore.getState().schedules[activeBabyId];
      const values = schedule ?? { ...DEFAULT_SCHEDULE };
      setWakeTime(values.wakeTime);
      setBedtime(values.bedtime);
      setTargetNaps(values.targetNaps);
      setNapDurationMinutes(values.napDurationMinutes);
      setPlanError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBabyId]);

  useEffect(() => {
    if (!activeSession) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeSession]);

  const timerLabel = activeSession
    ? formatElapsedTimer(activeSession.startedAt)
    : '00:00:00';

  void tick;

  const handleStart = async (kind: SleepKind) => {
    if (!activeBabyId) {
      Alert.alert('No baby', 'Add your baby profile first.');
      return;
    }
    if (activeSession) {
      Alert.alert(
        'Timer already running',
        `You are tracking ${activeSession.kind === 'day' ? 'a day nap' : 'night sleep'}. Tap Stop first.`,
      );
      return;
    }
    await startSleep(activeBabyId, kind);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleStop = useCallback(async () => {
    if (!user || !activeBabyId || !activeSession) return;
    setSaving(true);
    try {
      const session = await stopSleep();
      if (!session || session.babyId !== activeBabyId) return;

      const startedAt = session.startedAt;
      const endedAt = new Date().toISOString();
      const mins = Math.max(
        1,
        Math.round(
          (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000,
        ),
      );

      await addEntry({
        baby_id: activeBabyId,
        user_id: user.id,
        type: 'sleep',
        started_at: startedAt,
        ended_at: endedAt,
        amount: null,
        unit: null,
        notes: session.kind === 'night' ? 'Night sleep' : 'Day nap',
        metadata: { durationMinutes: mins, sleepKind: session.kind },
      });
      await fetchEntries(activeBabyId);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Could not save sleep', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [user, activeBabyId, activeSession, stopSleep, addEntry, fetchEntries]);

  const handleGeneratePlan = async () => {
    if (!activeBabyId) return;
    setPlanError(null);
    setGenerating(true);
    try {
      const result = generateSleepPlan({
        wakeTime,
        bedtime,
        targetNaps,
        napDurationMinutes,
      });
      if ('error' in result) {
        setPlanError(result.error);
        return;
      }
      await updateSchedule(activeBabyId, {
        wakeTime,
        bedtime,
        targetNaps,
        napDurationMinutes,
      });
      await saveGeneratedPlan(activeBabyId, result);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View className="flex-1 bg-indigo-50 dark:bg-ink-900">
      <ScrollView
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* —— Timer (track sleep) —— */}
        <View
          className={cn(
            'px-5 pb-8 pt-14',
            activeSession
              ? isDaySession
                ? 'bg-amber-500 dark:bg-amber-600'
                : 'bg-indigo-700 dark:bg-indigo-900'
              : 'bg-indigo-500 dark:bg-indigo-700',
          )}
        >
          <Pressable
            onPress={() => router.back()}
            className="mb-4 flex-row items-center gap-2"
          >
            <ChevronLeft size={24} color="#fff" />
            <Text className="text-white/90">Back</Text>
          </Pressable>

          <Text variant="caption" className="text-center uppercase tracking-widest text-white/80">
            Track sleep
          </Text>

          {activeSession ? (
            <View className="mt-2 items-center">
              <View
                className={cn(
                  'mb-3 flex-row items-center gap-2 rounded-full px-4 py-1.5',
                  isDaySession ? 'bg-white/25' : 'bg-indigo-900/40',
                )}
              >
                {isDaySession ? (
                  <Sun size={16} color="#fff" />
                ) : (
                  <Moon size={16} color="#E0E7FF" />
                )}
                <Text className="text-sm font-bold text-white">
                  {isDaySession ? 'Day nap in progress' : 'Night sleep in progress'}
                </Text>
              </View>
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-white/20">
                {isDaySession ? (
                  <Sun size={44} color="#fff" />
                ) : (
                  <Moon size={44} color="#E0E7FF" />
                )}
              </View>
              <Text className="font-mono text-5xl font-bold tracking-wider text-white">
                {timerLabel}
              </Text>
              <Text variant="caption" className="mt-2 text-white/80">
                Started {formatTime(activeSession.startedAt)}
              </Text>
              <Button
                className="mt-8 w-full"
                size="lg"
                loading={saving}
                onPress={() => void handleStop()}
              >
                Stop & save
              </Button>
            </View>
          ) : (
            <View className="mt-4">
              <View className="items-center">
                <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-white/15">
                  <Moon size={36} color="#E0E7FF" />
                </View>
                <Text className="font-mono text-4xl font-bold text-white/50">00:00:00</Text>
                <Text variant="caption" className="mt-2 text-indigo-100">
                  Today logged: {formatTotalMinutes(todaySleepMins)}
                </Text>
              </View>
              <Text variant="caption" className="mt-6 text-center text-white/90">
                Choose one — only one timer runs at a time
              </Text>
              <View className="mt-4 gap-3">
                <Pressable
                  onPress={() => void handleStart('day')}
                  className="flex-row items-center gap-4 rounded-2xl border-2 border-amber-200 bg-white px-4 py-4 active:opacity-90 dark:border-amber-400/70 dark:bg-amber-500/30"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-400/25">
                    <Sun size={26} color="#FBBF24" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-amber-900 dark:text-amber-50">
                      Start day nap
                    </Text>
                    <Text variant="caption" className="text-amber-800/90 dark:text-amber-100/85">
                      For naps during the day
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => void handleStart('night')}
                  className="flex-row items-center gap-4 rounded-2xl border-2 border-indigo-300 bg-indigo-900 px-4 py-4 active:opacity-90"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-800">
                    <Moon size={26} color="#C7D2FE" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white">Start night sleep</Text>
                    <Text variant="caption" className="text-white">
                      For bedtime / overnight
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* —— Schedule builder (separate section, no overlap) —— */}
        <View className="mx-5 mt-6 rounded-3xl bg-white p-5 shadow-md dark:bg-ink-800">
          <Text variant="subtitle" className="font-bold">
            Sleep schedule
          </Text>
          <Text variant="caption" muted className="mt-1 mb-5">
            Set preferences, then tap Generate to build today&apos;s nap times
          </Text>

          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <Input
                label="Wake time"
                value={wakeTime}
                onChangeText={setWakeTime}
                placeholder="07:00"
              />
            </View>
            <View className="flex-1">
              <Input
                label="Bedtime"
                value={bedtime}
                onChangeText={setBedtime}
                placeholder="19:30"
              />
            </View>
          </View>

          <Text variant="caption" className="mb-2 font-semibold text-ink-700 dark:text-ink-100">
            Naps per day
          </Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {NAP_COUNT_OPTIONS.map((n) => (
              <SelectChip
                key={n}
                label={String(n)}
                selected={targetNaps === n}
                onPress={() => setTargetNaps(n)}
              />
            ))}
          </View>

          <Text variant="caption" className="mb-2 font-semibold text-ink-700 dark:text-ink-100">
            Typical nap length
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {NAP_LENGTH_OPTIONS.map((min) => (
              <SelectChip
                key={min}
                label={`${min}m`}
                selected={napDurationMinutes === min}
                onPress={() => setNapDurationMinutes(min)}
              />
            ))}
          </View>

          {planError ? (
            <Text variant="caption" className="mb-3 text-pink-600 dark:text-pink-300">
              {planError}
            </Text>
          ) : null}

          <Button
            size="lg"
            fullWidth
            loading={generating}
            leftIcon={<Sparkles size={18} color="#fff" />}
            onPress={() => void handleGeneratePlan()}
          >
            Generate nap schedule
          </Button>

          {savedPlan ? (
            <View className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/50">
              <Text variant="caption" className="font-bold text-indigo-800 dark:text-indigo-200">
                Your plan
              </Text>
              <Text variant="caption" muted className="mt-1">
                Wake {savedPlan.wakeLabel} · Bed {savedPlan.bedtimeLabel} · ~
                {savedPlan.wakeWindowMinutes}m awake between sleeps
              </Text>
              <View className="mt-3 gap-2">
                {savedPlan.naps.map((nap) => (
                  <View
                    key={nap.label}
                    className="flex-row items-center justify-between rounded-xl bg-white px-3 py-2.5 dark:bg-ink-800"
                  >
                    <Text variant="caption" className="font-semibold">
                      {nap.label}
                    </Text>
                    <Text variant="caption" muted>
                      {nap.startLabel} · {nap.durationMinutes}m
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text variant="caption" muted className="mt-4 text-center">
              No plan yet — pick options above and tap Generate
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
