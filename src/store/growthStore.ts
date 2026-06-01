import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

const PREFIX = '@mamanote/milestones-done/';
const EMPTY_COMPLETED: string[] = [];

interface GrowthState {
  completed: Record<string, string[]>;
  hydrated: boolean;
  hydrateForBaby: (babyId: string) => Promise<void>;
  toggleSkill: (babyId: string, milestoneId: string, skillIndex: number) => Promise<void>;
}

export function skillToken(milestoneId: string, skillIndex: number) {
  return `${milestoneId}:${skillIndex}`;
}

function key(babyId: string) {
  return `${PREFIX}${babyId}`;
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  completed: {},
  hydrated: false,

  hydrateForBaby: async (babyId) => {
    const raw = await AsyncStorage.getItem(key(babyId));
    const ids: string[] = raw ? JSON.parse(raw) : [];
    set((s) => ({
      completed: { ...s.completed, [babyId]: ids },
      hydrated: true,
    }));
  },

  toggleSkill: async (babyId, milestoneId, skillIndex) => {
    const token = skillToken(milestoneId, skillIndex);
    const current = get().completed[babyId] ?? [];
    const next = current.includes(token)
      ? current.filter((t) => t !== token)
      : [...current, token];
    set((s) => ({ completed: { ...s.completed, [babyId]: next } }));
    await AsyncStorage.setItem(key(babyId), JSON.stringify(next));
  },
}));

/** Subscribe to completed skills so toggles re-render the UI. */
export function useCompletedSkills(babyId: string | null) {
  return useGrowthStore((s) =>
    babyId ? (s.completed[babyId] ?? EMPTY_COMPLETED) : EMPTY_COMPLETED,
  );
}

/** O(1) lookups; memoize in the screen with useMemo. */
export function completedSkillsToSet(tokens: string[]): Set<string> {
  return new Set(tokens);
}
