import type { LogMetadata } from '@constants/logFields';

export type SleepLogMode = 'duration' | 'range';

export interface SleepLogState {
  mode: SleepLogMode;
  durationMinutes: number | null;
  customMinutes: string;
  startTime: Date;
  endTime: Date;
}

function applyTimeToDay(day: Date, time: Date): Date {
  const result = new Date(day);
  result.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return result;
}

export function defaultSleepEndTime(): Date {
  return new Date();
}

export function defaultSleepStartTime(minutesAgo = 60): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d;
}

export function initialSleepLogState(entry?: {
  started_at: string;
  ended_at: string | null;
  metadata?: LogMetadata | null;
}): SleepLogState {
  if (entry?.ended_at) {
    return {
      mode: 'range',
      durationMinutes: null,
      customMinutes: '',
      startTime: new Date(entry.started_at),
      endTime: new Date(entry.ended_at),
    };
  }

  const meta = entry?.metadata ?? {};
  const duration =
    typeof meta.durationMinutes === 'number' && meta.durationMinutes > 0
      ? meta.durationMinutes
      : null;

  if (duration) {
    const end = entry ? new Date(entry.started_at) : defaultSleepEndTime();
    const start = new Date(end);
    start.setMinutes(start.getMinutes() - duration);
    return {
      mode: 'duration',
      durationMinutes: duration,
      customMinutes: '',
      startTime: start,
      endTime: end,
    };
  }

  return {
    mode: 'duration',
    durationMinutes: null,
    customMinutes: '',
    startTime: defaultSleepStartTime(60),
    endTime: defaultSleepEndTime(),
  };
}

export function resolveSleepMinutes(state: SleepLogState): number | null {
  if (state.mode === 'duration') {
    if (state.durationMinutes != null && state.durationMinutes > 0) {
      return state.durationMinutes;
    }
    const parsed = Number.parseInt(state.customMinutes, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const day = new Date();
  let start = applyTimeToDay(day, state.startTime);
  let end = applyTimeToDay(day, state.endTime);
  if (end.getTime() <= start.getTime()) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
  return mins > 0 ? mins : null;
}

export function resolveSleepEntryTimes(
  state: SleepLogState,
  options?: { referenceDay?: Date; endAt?: Date },
):
  | { started_at: string; ended_at: string; durationMinutes: number }
  | { error: string } {
  const referenceDay = options?.referenceDay ?? new Date();

  if (state.mode === 'duration') {
    const minutes = resolveSleepMinutes(state);
    if (!minutes) {
      return { error: 'Enter how long they slept, or switch to start – end times.' };
    }
    const ended = options?.endAt ?? new Date();
    const started = new Date(ended);
    started.setMinutes(started.getMinutes() - minutes);
    return {
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      durationMinutes: minutes,
    };
  }

  let start = applyTimeToDay(referenceDay, state.startTime);
  let end = applyTimeToDay(referenceDay, state.endTime);
  if (end.getTime() <= start.getTime()) {
    end = new Date(end);
    end.setDate(end.getDate() + 1);
  }
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  if (minutes <= 0) {
    return { error: 'End time must be after start time.' };
  }
  return {
    started_at: start.toISOString(),
    ended_at: end.toISOString(),
    durationMinutes: minutes,
  };
}
