import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  babyAge,
  babyAgeInMonths,
  entryOnLocalDate,
  formatElapsedTimer,
  lastFeedLabel,
  localDateKey,
  timeSinceLabel,
} from './date';

describe('localDateKey', () => {
  it('formats a local calendar date as YYYY-MM-DD', () => {
    expect(localDateKey(new Date(2026, 2, 5, 23, 30))).toBe('2026-03-05');
  });
});

describe('entryOnLocalDate', () => {
  it('matches entries on the same local day', () => {
    const iso = new Date(2026, 2, 5, 8, 0).toISOString();
    expect(entryOnLocalDate(iso, '2026-03-05')).toBe(true);
    expect(entryOnLocalDate(iso, '2026-03-06')).toBe(false);
  });
});

describe('babyAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 10, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports days under one week', () => {
    expect(babyAge(new Date(2026, 3, 7).toISOString())).toBe('3 days');
  });

  it('reports weeks under one month', () => {
    expect(babyAge(new Date(2026, 2, 20).toISOString())).toBe('3 weeks');
  });

  it('reports months when at least one month old', () => {
    expect(babyAge(new Date(2025, 11, 10).toISOString())).toBe('4 months');
  });
});

describe('babyAgeInMonths', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 10, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns whole months since birth', () => {
    expect(babyAgeInMonths(new Date(2025, 11, 10).toISOString())).toBe(4);
  });
});

describe('formatElapsedTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:01:05.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats elapsed HH:MM:SS from a start timestamp', () => {
    expect(formatElapsedTimer('2026-04-10T12:00:00.000Z')).toBe('00:01:05');
  });
});

describe('lastFeedLabel / timeSinceLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('handles missing feed timestamps', () => {
    expect(lastFeedLabel(null)).toBe('No feeds logged yet');
    expect(timeSinceLabel(null)).toBeNull();
  });

  it('formats recent relative times', () => {
    expect(lastFeedLabel('2026-04-10T11:45:00.000Z')).toBe('Last fed 15m ago');
    expect(timeSinceLabel('2026-04-10T10:30:00.000Z')).toBe('1 hr 30 min ago');
  });
});
