import type { LogEntry } from '@app-types/database';
import type { ActivityOption } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';

function entryMeta(entry: LogEntry): LogMetadata {
  return (entry.metadata ?? {}) as LogMetadata;
}

/**
 * Whether a log entry belongs to a home/log activity option.
 * Plain "Notes" matches note rows without a subtype; typed notes
 * (bath, growth, …) match only their own subtype.
 */
export function entryMatchesActivity(entry: LogEntry, activity: ActivityOption): boolean {
  if (entry.type !== activity.type) return false;

  const meta = entryMeta(entry);

  if (activity.id === 'notes') {
    return !meta.subtype;
  }

  if (activity.defaultMetadata?.subtype) {
    return meta.subtype === activity.defaultMetadata.subtype;
  }

  return true;
}
