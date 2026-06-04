import type { LogEntry } from '@app-types/database';
import type { ActivityOption } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import { formatTime } from '@utils/date';

const FEED_TYPES = new Set(['feeding', 'pump']);

export function getLastFeedEntry(entries: LogEntry[]): LogEntry | null {
  return entries.find((e) => FEED_TYPES.has(e.type)) ?? null;
}

export function getLastEntryOfType(
  entries: LogEntry[],
  type: LogEntry['type'],
): LogEntry | null {
  return entries.find((e) => e.type === type) ?? null;
}

function entryMeta(entry: LogEntry): LogMetadata {
  return (entry.metadata ?? {}) as LogMetadata;
}

/** Match activity card to the most recent relevant log entry. */
export function getLastEntryForActivity(
  entries: LogEntry[],
  activity: ActivityOption,
): LogEntry | null {
  const meta = activity.defaultMetadata;

  return (
    entries.find((e) => {
      if (e.type !== activity.type) return false;
      if (activity.id === 'notes') {
        return !entryMeta(e).subtype;
      }
      if (meta?.subtype) {
        return entryMeta(e).subtype === meta.subtype;
      }
      return true;
    }) ?? null
  );
}

export function countTodayForActivity(
  entries: LogEntry[],
  activity: ActivityOption,
): number {
  const today = new Date();
  return entries.filter((e) => {
    const d = new Date(e.started_at);
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (!isToday) return false;
    if (e.type !== activity.type) return false;
    if (activity.id === 'notes') {
      return !entryMeta(e).subtype;
    }
    if (activity.defaultMetadata?.subtype) {
      return entryMeta(e).subtype === activity.defaultMetadata.subtype;
    }
    return true;
  }).length;
}

const SUBTYPE_LABELS: Record<string, string> = {
  breastfeeding: 'Breastfeeding',
  bottle: 'Bottle',
  nutrition: 'Nutrition',
  wet: 'Wet',
  dirty: 'Dirty',
  both: 'Wet and Dirty',
  temperature: 'Temperature',
  bath: 'Bath',
  tummy_time: 'Tummy time',
  growth: 'Growth',
  doctor: 'Doctor visit',
  playtime: 'Playtime',
};

const SIDE_LABELS: Record<string, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Both sides',
};

export function entryDisplayTitle(entry: LogEntry): string {
  const meta = entryMeta(entry);
  if (meta.subtype && SUBTYPE_LABELS[meta.subtype]) {
    return SUBTYPE_LABELS[meta.subtype];
  }
  if (entry.type === 'sleep') return 'Sleep';
  if (entry.type === 'pump') return 'Pumping';
  if (entry.type === 'feeding') return 'Feeding';
  if (entry.type === 'diaper') return 'Diaper Change';
  if (entry.type === 'medication') return entry.notes ?? meta.medicineName ?? 'Medicine';
  if (entry.type === 'note') return entry.notes ?? 'Note';
  return entry.type;
}

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr${h === 1 ? '' : 's'}`;
  return `${h} hr ${m} min`;
}

function sleepDetail(entry: LogEntry): string {
  const meta = entryMeta(entry);
  const start = formatTime(entry.started_at);
  if (entry.ended_at) {
    const end = formatTime(entry.ended_at);
    const ms = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
    const mins = Math.round(ms / 60_000);
    return `${start} – ${end} (${formatDurationMinutes(mins)})`;
  }
  if (meta.durationMinutes) {
    return `${start} · ${formatDurationMinutes(meta.durationMinutes)}`;
  }
  return `Started ${start}`;
}

function feedingDetail(entry: LogEntry): string {
  const meta = entryMeta(entry);
  const time = formatTime(entry.started_at);

  if (meta.subtype === 'breastfeeding') {
    if (meta.side) {
      return `${SIDE_LABELS[meta.side]}: ${time}${meta.durationMinutes ? ` · ${meta.durationMinutes}m` : ''}`;
    }
    return `Logged at ${time}`;
  }

  if (entry.amount != null) {
    const unit = entry.unit === 'ml' ? 'ml' : (entry.unit ?? 'ml');
    const label =
      meta.subtype === 'nutrition' ? 'Expressed milk' : 'Amount';
    return `${label}: ${entry.amount} ${unit}`;
  }

  return entry.notes ?? `Logged at ${time}`;
}

export function entryDetailLine(entry: LogEntry): string {
  const meta = entryMeta(entry);

  if (meta.subtype === 'temperature' && meta.temperature != null) {
    return `${meta.temperature} °C`;
  }
  if (meta.subtype === 'growth') {
    const parts: string[] = [];
    if (meta.weightKg != null) parts.push(`${meta.weightKg} kg`);
    if (meta.heightCm != null) parts.push(`${meta.heightCm} cm`);
    if (parts.length) return parts.join(' · ');
  }
  if (meta.durationMinutes && entry.type === 'note') {
    return `${formatDurationMinutes(meta.durationMinutes)}`;
  }
  if (entry.type === 'diaper' && meta.subtype) {
    return SUBTYPE_LABELS[meta.subtype] ?? 'Diaper change';
  }
  if (entry.type === 'sleep') return sleepDetail(entry);
  if (entry.type === 'feeding' || entry.type === 'pump') return feedingDetail(entry);
  if (entry.type === 'medication') return entry.notes ?? 'Medication logged';
  return entry.notes ?? entrySubtitle(entry);
}

/** @deprecated use entryDetailLine */
export function entrySubtitle(entry: LogEntry): string {
  return entryDetailLine(entry);
}
