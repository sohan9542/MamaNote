import { useMemo } from 'react';

import { getThemeColors } from '@constants/colors';
import { useThemeStore } from '@store/themeStore';

export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const toggle = useThemeStore((s) => s.toggle);

  const colors = useMemo(() => getThemeColors(mode), [mode]);

  return { mode, preference, colors, setPreference, toggle, isDark: mode === 'dark' };
}
