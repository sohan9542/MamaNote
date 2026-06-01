import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { supabase } from '@lib/supabase';
import { assertCanAddBaby, assertCanAddLog } from '@lib/freemium';
import { trackLogSavedForRating } from '@lib/ratingPrompt';
import { useRatingPromptStore } from '@store/ratingPromptStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import type {
  Baby,
  Database,
  LogEntry,
  LogEntryType,
} from '@app-types/database';

type LogEntryInsert = Database['public']['Tables']['log_entries']['Insert'];

const ACTIVE_BABY_KEY = '@mamanote/active-baby-id';

async function readActiveBabyId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_BABY_KEY);
}

async function writeActiveBabyId(id: string | null) {
  if (id) await AsyncStorage.setItem(ACTIVE_BABY_KEY, id);
  else await AsyncStorage.removeItem(ACTIVE_BABY_KEY);
}

function resolveActiveBabyId(
  babies: Baby[],
  preferredId: string | null | undefined,
): string | null {
  if (preferredId && babies.some((baby) => baby.id === preferredId)) {
    return preferredId;
  }
  return babies[0]?.id ?? null;
}

interface BabyState {
  babies: Baby[];
  activeBabyId: string | null;
  entries: LogEntry[];
  loading: boolean;
  babiesInitialized: boolean;
  error: string | null;

  setActiveBaby: (id: string) => void;
  selectBaby: (id: string) => Promise<void>;
  fetchBabies: () => Promise<void>;
  createBaby: (payload: {
    userId: string;
    name: string;
    birthDate: string;
    gender?: 'girl' | 'boy' | 'other' | null;
  }) => Promise<Baby>;
  fetchEntries: (babyId: string) => Promise<void>;
  addEntry: (entry: Omit<LogEntryInsert, 'id' | 'created_at'>) => Promise<void>;
  updateEntry: (
    id: string,
    updates: Database['public']['Tables']['log_entries']['Update'],
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useBabyStore = create<BabyState>((set, get) => ({
  babies: [],
  activeBabyId: null,
  entries: [],
  loading: false,
  babiesInitialized: false,
  error: null,

  setActiveBaby: (id) => {
    void writeActiveBabyId(id);
    set({ activeBabyId: id });
  },

  selectBaby: async (id) => {
    const { babies, activeBabyId } = get();
    if (!babies.some((baby) => baby.id === id) || activeBabyId === id) return;

    void writeActiveBabyId(id);
    set({ activeBabyId: id, entries: [] });
    await get().fetchEntries(id);
  },

  createBaby: async ({ userId, name, birthDate, gender }) => {
    const access = useSubscriptionStore.getState().getFreemiumAccess();
    assertCanAddBaby(get().babies.length, access);

    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('babies')
      .insert({
        user_id: userId,
        name: name.trim(),
        birth_date: birthDate,
        gender: gender ?? null,
      })
      .select()
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      throw new Error(error.message);
    }

    const baby = data as Baby;
    await writeActiveBabyId(baby.id);
    set({
      babies: [...get().babies, baby],
      activeBabyId: baby.id,
      entries: [],
      loading: false,
    });
    await get().fetchEntries(baby.id);
    return baby;
  },

  fetchBabies: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      set({ loading: false, babiesInitialized: true, error: error.message });
      return;
    }

    const babies = (data ?? []) as Baby[];
    const storedActiveId = await readActiveBabyId();
    const activeBabyId = resolveActiveBabyId(
      babies,
      storedActiveId ?? get().activeBabyId,
    );

    if (activeBabyId !== storedActiveId) {
      await writeActiveBabyId(activeBabyId);
    }

    set({
      babies,
      activeBabyId,
      loading: false,
      babiesInitialized: true,
    });
  },

  fetchEntries: async (babyId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('log_entries')
      .select('*')
      .eq('baby_id', babyId)
      .order('started_at', { ascending: false })
      .limit(200);

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ entries: data ?? [], loading: false });
  },

  addEntry: async (entry) => {
    const access = useSubscriptionStore.getState().getFreemiumAccess();
    await assertCanAddLog(entry.baby_id, access);

    const { data, error } = await supabase
      .from('log_entries')
      .insert([entry])
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    if (data) {
      set({ entries: [data, ...get().entries] });
      await trackLogSavedForRating(entry.user_id, () => {
        useRatingPromptStore.getState().show();
      });
    }
  },

  updateEntry: async (id, updates) => {
    const { data, error } = await supabase
      .from('log_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      throw new Error(error.message);
    }
    if (data) {
      set({
        entries: get().entries.map((e) => (e.id === id ? (data as LogEntry) : e)),
      });
    }
  },

  deleteEntry: async (id) => {
    const { error } = await supabase.from('log_entries').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
}));

export const LOG_TYPES: { type: LogEntryType; label: string; emoji: string }[] = [
  { type: 'feeding', label: 'Feeding', emoji: '🍼' },
  { type: 'sleep', label: 'Sleep', emoji: '🌙' },
  { type: 'diaper', label: 'Diaper', emoji: '👶' },
  { type: 'pump', label: 'Pump', emoji: '💧' },
  { type: 'medication', label: 'Medicine', emoji: '💊' },
  { type: 'note', label: 'Note', emoji: '📝' },
];
