import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  format,
  formatDistanceToNow,
} from 'date-fns';

export const formatTime = (iso: string) => format(new Date(iso), 'h:mm a');
export const formatDate = (iso: string) => format(new Date(iso), 'MMM d, yyyy');
export const formatRelative = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true });

export function formatHeaderDate(date = new Date()) {
  return format(date, 'EEEE, d MMMM yyyy');
}

export function babyAge(birthDateIso: string): string {
  const birth = new Date(birthDateIso);
  const now = new Date();
  const months = differenceInMonths(now, birth);
  if (months >= 1) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const days = differenceInDays(now, birth);
  if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function lastFeedLabel(startedAtIso: string | null): string {
  if (!startedAtIso) return 'No feeds logged yet';

  const then = new Date(startedAtIso);
  const now = new Date();
  const minutes = differenceInMinutes(now, then);
  const hours = differenceInHours(now, then);
  const days = differenceInDays(now, then);

  if (minutes < 1) return 'Last fed just now';
  if (minutes < 60) return `Last fed ${minutes}m ago`;
  if (hours < 24) return `Last fed ${hours}h ${minutes % 60}m ago`;
  if (days === 1) return 'Last fed yesterday';
  return `Last fed ${days} days ago`;
}

export function activityTimeLabel(startedAtIso: string): string {
  const then = new Date(startedAtIso);
  const now = new Date();

  const thenKey = localDateKey(then);
  const todayKey = localDateKey(now);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (thenKey === todayKey) return `Today, ${format(then, 'HH:mm')}`;
  if (thenKey === localDateKey(yesterday)) return `Yesterday, ${format(then, 'HH:mm')}`;
  return format(then, 'MMM d, HH:mm');
}

/** Competitor-style "1 hr 30 min ago" for activity cards */
export function timeSinceLabel(startedAtIso: string | null | undefined): string | null {
  if (!startedAtIso) return null;

  const then = new Date(startedAtIso);
  const now = new Date();
  const minutes = differenceInMinutes(now, then);
  const hours = differenceInHours(now, then);
  const days = differenceInDays(now, then);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) {
    const rem = minutes % 60;
    if (rem === 0) return `${hours} hr ago`;
    return `${hours} hr ${rem} min ago`;
  }
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** Local calendar date as YYYY-MM-DD (avoids UTC mismatch with ISO timestamps). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function entryOnLocalDate(startedAtIso: string, dateKey: string): boolean {
  return localDateKey(new Date(startedAtIso)) === dateKey;
}

export function isWithinLocalDayRange(
  startedAtIso: string,
  start: Date,
  endExclusive: Date,
): boolean {
  const t = new Date(startedAtIso);
  return t >= start && t < endExclusive;
}
