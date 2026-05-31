import type { LogEntry } from '@app-types/database';
import { HOME_ACTIVITIES, getActivityForEntry } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import type { ShareFilterMode } from '@app-types/share';
import { entryDetailLine, entryDisplayTitle } from '@utils/baby';
import { babyAge } from '@utils/date';

export function entryMatchesShareFilter(
  entry: LogEntry,
  filterMode: ShareFilterMode,
  activityIds: string[],
): boolean {
  if (filterMode === 'all') return true;
  const activity = getActivityForEntry(entry.type, entry.metadata as LogMetadata);
  return activity != null && activityIds.includes(activity.id);
}

export function filterEntriesForShare(
  entries: LogEntry[],
  filterMode: ShareFilterMode,
  activityIds: string[],
): LogEntry[] {
  return entries.filter((entry) => entryMatchesShareFilter(entry, filterMode, activityIds));
}

export function shareFilterLabel(
  filterMode: ShareFilterMode,
  activityIds: string[],
): string {
  if (filterMode === 'all') return 'All activities';
  const labels = HOME_ACTIVITIES.filter((a) => activityIds.includes(a.id)).map((a) => a.label);
  if (labels.length === 0) return 'Selected activities';
  if (labels.length <= 3) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
}

export function babyAgeLabel(birthDate: string): string {
  return babyAge(birthDate);
}

export function toSharedEntryRow(entry: LogEntry) {
  return {
    id: entry.id,
    title: entryDisplayTitle(entry),
    detail: entryDetailLine(entry),
    startedAt: entry.started_at,
    type: entry.type,
  };
}
