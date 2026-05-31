import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';

import type { ThemeMode } from '@constants/colors';

const STORAGE_KEY = 'mamanote:theme';

type ThemePreference = ThemeMode | 'system';

interface ThemeState {
  preference: ThemePreference;
  mode: ThemeMode;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggle: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const resolveMode = (preference: ThemePreference): ThemeMode => {
  if (preference === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return preference;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  mode: resolveMode('system'),
  setPreference: async (preference) => {
    set({ preference, mode: resolveMode(preference) });
    await AsyncStorage.setItem(STORAGE_KEY, preference);
  },
  toggle: async () => {
    const next: ThemePreference = get().mode === 'dark' ? 'light' : 'dark';
    await get().setPreference(next);
  },
  hydrate: async () => {
    const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as ThemePreference | null;
    const preference: ThemePreference = saved ?? 'system';
    set({ preference, mode: resolveMode(preference) });

    Appearance.addChangeListener(() => {
      if (get().preference === 'system') {
        set({ mode: resolveMode('system') });
      }
    });
  },
}));
