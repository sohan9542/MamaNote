import type { LogEntry } from '@app-types/database';
import { HOME_ACTIVITIES, type ActivityOption } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import { entryOnLocalDate } from '@utils/date';

export interface StatsFilter {
  activityId?: string;
  dateKey?: string;
  entryId?: string;
  /** When set with activityId, limits to the last N local calendar days. */
  dayCount?: number;
}

export function entryMatchesActivity(entry: LogEntry, activity: ActivityOption): boolean {
  if (entry.type !== activity.type) return false;
  const meta = (entry.metadata ?? {}) as LogMetadata;
  if (activity.defaultMetadata?.subtype) {
    return meta.subtype === activity.defaultMetadata.subtype;
  }
  return true;
}

export function filterEntriesForStats(entries: LogEntry[], filter: StatsFilter): LogEntry[] {
  let result = entries;

  if (filter.entryId) {
    return result.filter((e) => e.id === filter.entryId);
  }

  if (filter.dateKey) {
    result = result.filter((e) => entryOnLocalDate(e.started_at, filter.dateKey!));
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

  return result.sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
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
    const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return `${activity.label} · ${dayLabel}`;
  }

  if (activity) return `${activity.label} · 7 days`;
  if (filter.dateKey) return 'Activities';

  return 'Activities';
}
