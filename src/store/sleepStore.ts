import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import type { GeneratedSleepPlan } from '@utils/sleepSchedulePlan';

export type SleepKind = 'day' | 'night';

export interface ActiveSleepSession {
  babyId: string;
  startedAt: string;
  kind: SleepKind;
}

export interface SleepScheduleSettings {
  babyId: string;
  wakeTime: string;
  bedtime: string;
  targetNaps: number;
  napDurationMinutes: number;
  nightSleepHours: number;
}

const ACTIVE_KEY = '@mamanote/sleep-active';
const SCHEDULE_PREFIX = '@mamanote/sleep-schedule/';
const PLAN_PREFIX = '@mamanote/sleep-plan/';

export const DEFAULT_SCHEDULE: Omit<SleepScheduleSettings, 'babyId'> = {
  wakeTime: '07:00',
  bedtime: '19:30',
  targetNaps: 3,
  napDurationMinutes: 90,
  nightSleepHours: 11,
};

interface SleepState {
  activeSession: ActiveSleepSession | null;
  schedules: Record<string, SleepScheduleSettings>;
  generatedPlans: Record<string, GeneratedSleepPlan>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  startSleep: (babyId: string, kind: SleepKind) => Promise<void>;
  stopSleep: () => Promise<ActiveSleepSession | null>;
  updateSchedule: (
    babyId: string,
    patch: Partial<Omit<SleepScheduleSettings, 'babyId'>>,
  ) => Promise<void>;
  saveGeneratedPlan: (babyId: string, plan: GeneratedSleepPlan) => Promise<void>;
}

async function readActive(): Promise<ActiveSleepSession | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveSleepSession;
  } catch {
    return null;
  }
}

async function readSchedule(babyId: string): Promise<SleepScheduleSettings> {
  const raw = await AsyncStorage.getItem(`${SCHEDULE_PREFIX}${babyId}`);
  if (!raw) return { babyId, ...DEFAULT_SCHEDULE };
  try {
    return JSON.parse(raw) as SleepScheduleSettings;
  } catch {
    return { babyId, ...DEFAULT_SCHEDULE };
  }
}

async function readPlan(babyId: string): Promise<GeneratedSleepPlan | null> {
  const raw = await AsyncStorage.getItem(`${PLAN_PREFIX}${babyId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GeneratedSleepPlan;
  } catch {
    return null;
  }
}

export const useSleepStore = create<SleepState>((set, get) => ({
  activeSession: null,
  schedules: {},
  generatedPlans: {},
  hydrated: false,

  hydrate: async () => {
    const active = await readActive();
    set({ activeSession: active, hydrated: true });
  },

  startSleep: async (babyId, kind) => {
    const session: ActiveSleepSession = {
      babyId,
      startedAt: new Date().toISOString(),
      kind,
    };
    await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(session));
    set({ activeSession: session });
  },

  stopSleep: async () => {
    const session = get().activeSession;
    await AsyncStorage.removeItem(ACTIVE_KEY);
    set({ activeSession: null });
    return session;
  },

  updateSchedule: async (babyId, patch) => {
    const current = get().schedules[babyId] ?? { babyId, ...DEFAULT_SCHEDULE };
    const next = { ...current, ...patch, babyId };
    await AsyncStorage.setItem(`${SCHEDULE_PREFIX}${babyId}`, JSON.stringify(next));
    set((s) => ({ schedules: { ...s.schedules, [babyId]: next } }));
  },

  saveGeneratedPlan: async (babyId, plan) => {
    await AsyncStorage.setItem(`${PLAN_PREFIX}${babyId}`, JSON.stringify(plan));
    set((s) => ({ generatedPlans: { ...s.generatedPlans, [babyId]: plan } }));
  },
}));

export async function loadScheduleForBaby(babyId: string) {
  const [schedule, plan] = await Promise.all([
    readSchedule(babyId),
    readPlan(babyId),
  ]);
  useSleepStore.setState((s) => ({
    schedules: { ...s.schedules, [babyId]: schedule },
    generatedPlans: plan
      ? { ...s.generatedPlans, [babyId]: plan }
      : s.generatedPlans,
  }));
}

export function useActiveSleepSession(babyId: string | null) {
  return useSleepStore((s) => {
    if (!babyId || !s.activeSession || s.activeSession.babyId !== babyId) {
      return null;
    }
    return s.activeSession;
  });
}

export function useBabySchedule(babyId: string | null) {
  return useSleepStore((s) => (babyId ? s.schedules[babyId] : undefined));
}

export function useBabySleepPlan(babyId: string | null) {
  return useSleepStore((s) => (babyId ? s.generatedPlans[babyId] ?? null : null));
}
