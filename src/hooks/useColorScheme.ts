import { useThemeStore } from '@store/themeStore';

/**
 * Use this anywhere you need to know the resolved color scheme (light | dark),
 * including in `className`-based dark variants via the `colorScheme` prop on
 * `<View>` when relevant. The mode is kept in sync with system changes by the
 * themeStore.
 */
export function useColorScheme() {
  return useThemeStore((s) => s.mode);
}
