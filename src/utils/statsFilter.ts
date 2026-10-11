import type { LogEntry } from '@app-types/database';
import { HOME_ACTIVITIES, type ActivityOption } from '@constants/activities';
import { entryMatchesActivity } from '@utils/activityMatch';
import { entryOnLocalDate, localDateKey } from '@utils/date';

export interface StatsFilter {
  activityId?: string;
  dateKey?: string;
  /** Inclusive end date (local) when filtering a date range, e.g. a chart week. */
  dateKeyEnd?: string;
  entryId?: string;
  /** When set with activityId, limits to the last N local calendar days. */
  dayCount?: number;
}

export { entryMatchesActivity };

export function filterEntriesForStats(entries: LogEntry[], filter: StatsFilter): LogEntry[] {
  let result = entries;

  if (filter.entryId) {
    return result.filter((e) => e.id === filter.entryId);
  }

  if (filter.dateKey) {
    if (filter.dateKeyEnd) {
      result = result.filter((e) => {
        const key = localDateKey(new Date(e.started_at));
        return key >= filter.dateKey! && key <= filter.dateKeyEnd!;
      });
    } else {
      result = result.filter((e) => entryOnLocalDate(e.started_at, filter.dateKey!));
    }
  }

  if (filter.activityId) {
    const activity = HOME_ACTIVITIES.find((a) => a.id === filter.activityId);
    if (activity) {
      result = result.filter((e) => entryMatchesActivity(e, activity));
    }
  }

  if (filter.dayCount && filter.activityId && !filter.dateKey && !filter.entryId) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (filter.dayCount - 1));
    start.setHours(0, 0, 0, 0);
    result = result.filter((e) => {
      const t = new Date(e.started_at);
      return t >= start;
    });
  }

  return result.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function countForActivityOnDate(
  entries: LogEntry[],
  activity: ActivityOption,
  dateKey: string,
): number {
  return entries.filter(
    (e) => entryOnLocalDate(e.started_at, dateKey) && entryMatchesActivity(e, activity),
  ).length;
}

export function statsFilterTitle(filter: StatsFilter): string {
  if (filter.entryId) return 'Activity';

  const activity = filter.activityId
    ? HOME_ACTIVITIES.find((a) => a.id === filter.activityId)
    : undefined;

  if (filter.dateKey && activity) {
    const day = new Date(`${filter.dateKey}T12:00:00`);
    const dayLabel = day.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `${activity.label} · ${dayLabel}`;
  }

  if (activity) return `${activity.label} · 7 days`;

  if (filter.dateKey && filter.dateKeyEnd) {
    const start = new Date(`${filter.dateKey}T12:00:00`);
    const end = new Date(`${filter.dateKeyEnd}T12:00:00`);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `Activities · ${fmt(start)} – ${fmt(end)}`;
  }

  if (filter.dateKey) {
    const day = new Date(`${filter.dateKey}T12:00:00`);
    const dayLabel = day.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    return `Activities · ${dayLabel}`;
  }

  return 'Activities';
}
