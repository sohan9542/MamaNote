/**
 * Tiny classnames helper for NativeWind className strings.
 * Filters falsy values so you can do: cn('p-4', isActive && 'bg-pink-200')
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}
