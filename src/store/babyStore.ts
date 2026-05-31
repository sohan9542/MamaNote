import { create } from 'zustand';

import { supabase } from '@lib/supabase';
import { assertCanAddBaby, assertCanAddLog } from '@lib/freemium';
import { trackLogSaved } from '@lib/freemiumPrompt';
import { useSubscriptionStore } from '@store/subscriptionStore';
import type {
  Baby,
  Database,
  LogEntry,
  LogEntryType,
} from '@app-types/database';

type LogEntryInsert = Database['public']['Tables']['log_entries']['Insert'];

interface BabyState {
  babies: Baby[];
  activeBabyId: string | null;
  entries: LogEntry[];
  loading: boolean;
  babiesInitialized: boolean;
  error: string | null;

  setActiveBaby: (id: string) => void;
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

  setActiveBaby: (id) => set({ activeBabyId: id }),

  createBaby: async ({ userId, name, birthDate, gender }) => {
    const isPremium = useSubscriptionStore.getState().isPremium();
    assertCanAddBaby(get().babies.length, isPremium);

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
    set({
      babies: [...get().babies, baby],
      activeBabyId: baby.id,
      loading: false,
    });
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
    set({
      babies,
      activeBabyId: get().activeBabyId ?? babies[0]?.id ?? null,
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
    const isPremium = useSubscriptionStore.getState().isPremium();
    await assertCanAddLog(entry.baby_id, isPremium);

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
      await trackLogSaved(isPremium, () => {
        useSubscriptionStore.getState().showUpgradePrompt();
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
