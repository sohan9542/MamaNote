import { describe, expect, it } from 'vitest';

import {
  initialSleepLogState,
  resolveSleepEntryTimes,
  resolveSleepMinutes,
  type SleepLogState,
} from './sleepLog';

describe('resolveSleepMinutes', () => {
  it('uses preset duration minutes', () => {
    const state: SleepLogState = {
      mode: 'duration',
      durationMinutes: 45,
      customMinutes: '',
      startTime: new Date(2026, 3, 10, 10, 0),
      endTime: new Date(2026, 3, 10, 11, 0),
    };
    expect(resolveSleepMinutes(state)).toBe(45);
  });

  it('parses custom duration minutes', () => {
    const state: SleepLogState = {
      mode: 'duration',
      durationMinutes: null,
      customMinutes: '90',
      startTime: new Date(2026, 3, 10, 10, 0),
      endTime: new Date(2026, 3, 10, 11, 0),
    };
    expect(resolveSleepMinutes(state)).toBe(90);
  });

  it('computes range duration and overnight wrap', () => {
    const state: SleepLogState = {
      mode: 'range',
      durationMinutes: null,
      customMinutes: '',
      startTime: new Date(2026, 3, 10, 22, 0),
      endTime: new Date(2026, 3, 10, 6, 0),
    };
    expect(resolveSleepMinutes(state)).toBe(480);
  });
});

describe('resolveSleepEntryTimes', () => {
  it('builds ISO start/end from a duration', () => {
    const state: SleepLogState = {
      mode: 'duration',
      durationMinutes: 30,
      customMinutes: '',
      startTime: new Date(2026, 3, 10, 10, 0),
      endTime: new Date(2026, 3, 10, 11, 0),
    };
    const endAt = new Date('2026-04-10T15:00:00.000Z');
    const result = resolveSleepEntryTimes(state, { endAt });
    expect(result).toEqual({
      started_at: '2026-04-10T14:30:00.000Z',
      ended_at: '2026-04-10T15:00:00.000Z',
      durationMinutes: 30,
    });
  });

  it('returns an error when duration is missing', () => {
    const state = initialSleepLogState();
    state.durationMinutes = null;
    state.customMinutes = '';
    expect(resolveSleepEntryTimes(state)).toEqual({
      error: 'Enter how long they slept, or switch to start – end times.',
    });
  });
});
