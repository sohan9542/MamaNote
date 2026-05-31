import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';

import { useThemeStore } from '@store/themeStore';

/** Syncs Zustand theme mode → NativeWind so `dark:` classes apply correctly. */
export function ThemeBridge() {
  const mode = useThemeStore((s) => s.mode);
  const preference = useThemeStore((s) => s.preference);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (preference === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(mode);
    }
  }, [mode, preference, setColorScheme]);

  return null;
}
