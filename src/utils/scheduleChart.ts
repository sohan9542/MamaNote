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

export interface TrendChartPoint {
  label: string;
  dateKey: string;
  sleepHours: number;
  feedCount: number;
  totalCount: number;
}

export type StatsChartPeriod = '7d' | '30d' | 'all';

/** @deprecated use TrendChartPoint */
export type WeeklyLinePoint = TrendChartPoint;

function aggregateDayBlocks(blocks: ChartBlock[]): Omit<TrendChartPoint, 'label' | 'dateKey'> {
  return {
    sleepHours: blocks
      .filter((b) => b.type === 'sleep')
      .reduce((sum, b) => sum + b.durationHours, 0),
    feedCount: blocks.filter((b) => b.type === 'feeding').length,
    totalCount: blocks.length,
  };
}

function buildDailyTrendPoints(entries: LogEntry[], dayCount: number): TrendChartPoint[] {
  const days = buildWeeklyChartData(entries, dayCount);
  return days.map((day) => ({
    label: day.label,
    dateKey: day.dateKey,
    ...aggregateDayBlocks(day.blocks),
  }));
}

function buildDailyTrendInRange(
  entries: LogEntry[],
  start: Date,
  end: Date,
): TrendChartPoint[] {
  const points: TrendChartPoint[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cursor <= endDay) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 1);

    const dayEntries = entries.filter((e) => {
      const t = new Date(e.started_at);
      return t >= cursor && t < next;
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

    const useShort =
      endDay.getTime() - start.getTime() > 14 * 24 * 60 * 60 * 1000;
    const label = useShort
      ? cursor.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : cursor.toLocaleDateString(undefined, { weekday: 'short' });

    points.push({
      label,
      dateKey: localDateKey(cursor),
      ...aggregateDayBlocks(blocks),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return points;
}

function buildWeeklyTrendPoints(entries: LogEntry[]): TrendChartPoint[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  );
  const first = new Date(sorted[0].started_at);
  first.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const daySpan = Math.ceil((now.getTime() - first.getTime()) / 86_400_000);
  if (daySpan <= 45) {
    return buildDailyTrendInRange(entries, first, now);
  }

  const points: TrendChartPoint[] = [];
  const weekStart = new Date(first);
  const dow = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - dow);
  weekStart.setHours(0, 0, 0, 0);

  while (weekStart <= now) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekEntries = entries.filter((e) => {
      const t = new Date(e.started_at);
      return t >= weekStart && t < weekEnd;
    });

    const blocks: ChartBlock[] = weekEntries.map((e) => {
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

    const label = weekStart.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    points.push({
      label,
      dateKey: localDateKey(weekStart),
      ...aggregateDayBlocks(blocks),
    });

    weekStart.setDate(weekStart.getDate() + 7);
  }

  return points;
}

export function buildTrendChartData(
  entries: LogEntry[],
  period: StatsChartPeriod,
): TrendChartPoint[] {
  if (period === '7d') return buildDailyTrendPoints(entries, 7);
  if (period === '30d') return buildDailyTrendPoints(entries, 30);
  return buildWeeklyTrendPoints(entries);
}

export function periodLabel(period: StatsChartPeriod): string {
  if (period === '7d') return '7 days';
  if (period === '30d') return '30 days';
  return 'All time';
}

export function trendUsesWeeklyBuckets(
  period: StatsChartPeriod,
  points: TrendChartPoint[],
): boolean {
  if (period !== 'all' || points.length < 2) return false;
  const a = new Date(`${points[0].dateKey}T12:00:00`);
  const b = new Date(`${points[1].dateKey}T12:00:00`);
  const diffDays = (b.getTime() - a.getTime()) / 86_400_000;
  return diffDays >= 6;
}

export function weekDateKeyEnd(weekStartKey: string): string {
  const d = new Date(`${weekStartKey}T12:00:00`);
  d.setDate(d.getDate() + 6);
  return localDateKey(d);
}

export function buildWeeklyLineChartData(
  entries: LogEntry[],
  dayCount = 7,
): TrendChartPoint[] {
  return buildDailyTrendPoints(entries, dayCount);
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
