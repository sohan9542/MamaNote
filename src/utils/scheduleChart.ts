import type { LogEntry, LogEntryType } from '@app-types/database';
import { getActivityForEntry, HOME_ACTIVITIES } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import { ACTIVITY_CHART_COLORS } from '@constants/logFields';
import { localDateKey } from '@utils/date';

export interface ChartBlock {
  entryId: string;
  activityId: string | null;
  type: LogEntryType;
  startHour: number; // 0–24 fractional
  durationHours: number;
  color: string;
}

export interface DayChartData {
  label: string;
  dateKey: string;
  blocks: ChartBlock[];
}

const DEFAULT_DURATION_MIN: Record<LogEntryType, number> = {
  sleep: 60,
  feeding: 25,
  diaper: 5,
  pump: 15,
  medication: 5,
  note: 5,
};

function entryDurationHours(entry: LogEntry): number {
  if (entry.ended_at) {
    const ms = new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime();
    return Math.max(ms / 3_600_000, 0.05);
  }
  const meta = entry.metadata as { durationMinutes?: number } | null;
  if (meta?.durationMinutes) return meta.durationMinutes / 60;
  return DEFAULT_DURATION_MIN[entry.type] / 60;
}

function startHourFraction(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

export function buildWeeklyChartData(entries: LogEntry[], dayCount = 7): DayChartData[] {
  const days: DayChartData[] = [];
  const now = new Date();

  for (let i = dayCount - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);

    const next = new Date(day);
    next.setDate(day.getDate() + 1);

    const label = day.toLocaleDateString(undefined, { weekday: 'short' });
    const dateKey = localDateKey(day);

    const dayEntries = entries.filter((e) => {
      const t = new Date(e.started_at);
      return t >= day && t < next;
    });

    const blocks: ChartBlock[] = dayEntries.map((e) => {
      const activity = getActivityForEntry(e.type, e.metadata as LogMetadata);
      return {
        entryId: e.id,
        activityId: activity?.id ?? null,
        type: e.type,
        startHour: startHourFraction(e.started_at),
        durationHours: entryDurationHours(e),
        color: activity?.iconColor ?? ACTIVITY_CHART_COLORS[e.type],
      };
    });

    days.push({ label, dateKey, blocks });
  }

  return days;
}

export interface ActivityDayCount {
  activityId: string;
  type: LogEntryType;
  label: string;
  color: string;
  counts: number[]; // per day, same order as weekly chart
}

export function buildActivityMiniCharts(
  entries: LogEntry[],
  dayCount = 7,
): ActivityDayCount[] {
  const weekly = buildWeeklyChartData(entries, dayCount);

  return HOME_ACTIVITIES.map((activity) => ({
    activityId: activity.id,
    type: activity.type,
    label: activity.label,
    color: activity.iconColor,
    counts: weekly.map((day) =>
      day.blocks.filter((block) => block.activityId === activity.id).length,
    ),
  }));
}

/** Compact summary sent to Claude */
export function summarizeEntriesForAi(entries: LogEntry[], babyName: string, ageLabel: string) {
  const recent = [...entries]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 80);

  return recent.map((e) => {
    const start = new Date(e.started_at);
    const meta = (e.metadata ?? {}) as Record<string, unknown>;
    const dur = entryDurationHours(e);
    return {
      type: e.type,
      day: start.toLocaleDateString(undefined, { weekday: 'short' }),
      time: start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: Math.round(dur * 60),
      amount: e.amount,
      unit: e.unit,
      notes: e.notes,
      metadata: meta,
    };
  });
}

export function formatEntriesContext(
  entries: LogEntry[],
  babyName: string,
  ageLabel: string,
): string {
  const summary = summarizeEntriesForAi(entries, babyName, ageLabel);
  if (summary.length === 0) return 'No activity logs yet.';

  return JSON.stringify({ babyName, age: ageLabel, activities: summary }, null, 2);
}
