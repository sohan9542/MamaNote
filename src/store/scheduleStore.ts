import { create } from 'zustand';

import { fetchLatestRoutine, generateRoutine, PremiumRequiredError } from '@lib/schedule';
import type { GeneratedRoutine, RoutineMeta } from '@app-types/schedule';

interface ScheduleState {
  routine: GeneratedRoutine | null;
  routineMeta: RoutineMeta | null;
  routineId: string | null;
  routineCreatedAt: string | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
  premiumRequired: boolean;

  fetchLatest: (babyId: string) => Promise<void>;
  generate: (babyId: string, periodDays?: number) => Promise<void>;
  clearPremiumRequired: () => void;
  clear: () => void;
}

export const useScheduleStore = create<ScheduleState>((set) => ({
  routine: null,
  routineMeta: null,
  routineId: null,
  routineCreatedAt: null,
  loading: false,
  generating: false,
  error: null,
  premiumRequired: false,

  fetchLatest: async (babyId) => {
    set({ loading: true, error: null });
    try {
      const saved = await fetchLatestRoutine(babyId);
      set({
        routine: saved?.schedule ?? null,
        routineMeta: saved?.meta ?? null,
        routineId: saved?.id ?? null,
        routineCreatedAt: saved?.createdAt ?? null,
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  generate: async (babyId, periodDays = 7) => {
    set({ generating: true, error: null, premiumRequired: false });
    try {
      const saved = await generateRoutine(babyId, periodDays);
      set({
        routine: saved.schedule,
        routineMeta: saved.meta,
        routineId: saved.id,
        routineCreatedAt: saved.createdAt,
        generating: false,
      });
    } catch (e) {
      const premiumRequired = e instanceof PremiumRequiredError;
      set({
        generating: false,
        error: premiumRequired ? null : (e as Error).message,
        premiumRequired,
      });
      throw e;
    }
  },

  clearPremiumRequired: () => set({ premiumRequired: false }),

  clear: () =>
    set({
      routine: null,
      routineMeta: null,
      routineId: null,
      routineCreatedAt: null,
      error: null,
      premiumRequired: false,
    }),
}));
