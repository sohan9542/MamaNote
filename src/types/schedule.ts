import type { LogEntryType } from '@app-types/database';

export interface RoutineBlock {
  startTime: string; // HH:mm 24h
  endTime: string;
  type: LogEntryType;
  label: string;
  note?: string;
}

export type RoutineSource = 'claude' | 'mock' | 'unknown';

export interface RoutineMeta {
  source?: RoutineSource;
  model?: string;
  generatedAt?: string;
  activityCount?: number;
}

export interface GeneratedRoutine {
  summary: string;
  typicalDay: RoutineBlock[];
  weeklyInsights: string[];
  recommendations: string[];
  nextFeedWindow?: string;
  nextSleepWindow?: string;
}

export interface BabyRoutineRow {
  id: string;
  baby_id: string;
  user_id: string;
  period_days: number;
  summary: string | null;
  schedule: GeneratedRoutine;
  created_at: string;
}

export function parseGeneratedRoutine(raw: unknown): GeneratedRoutine | null {
  if (!raw || typeof raw !== 'object') return null;
  const copy = { ...(raw as Record<string, unknown>) };
  delete copy._meta;
  const o = copy as unknown as GeneratedRoutine;
  if (!Array.isArray(o.typicalDay)) return null;
  return o;
}

export function getRoutineMeta(raw: unknown): RoutineMeta {
  if (!raw || typeof raw !== 'object') return { source: 'unknown' };
  const meta = (raw as { _meta?: RoutineMeta })._meta;
  if (!meta?.source) {
    // Older saves before _meta — likely mock placeholder
    return { source: 'mock' };
  }
  return meta;
}
