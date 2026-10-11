import { describe, expect, it } from 'vitest';

import type { LogEntry } from '@app-types/database';
import type { ActivityOption } from '@constants/activities';

import { entryMatchesActivity } from './activityMatch';

function entry(partial: Partial<LogEntry> & Pick<LogEntry, 'type'>): LogEntry {
  return {
    id: '1',
    baby_id: 'b1',
    user_id: 'u1',
    started_at: '2026-04-10T12:00:00.000Z',
    ended_at: null,
    amount: null,
    unit: null,
    notes: null,
    metadata: {},
    created_at: '2026-04-10T12:00:00.000Z',
    ...partial,
  };
}

const breastfeeding = {
  id: 'breastfeeding',
  type: 'feeding',
  label: 'Breastfeeding',
  defaultMetadata: { subtype: 'breastfeeding' },
} as ActivityOption;

const notes = {
  id: 'notes',
  type: 'note',
  label: 'Notes',
} as ActivityOption;

const bath = {
  id: 'bath',
  type: 'note',
  label: 'Bath',
  defaultMetadata: { subtype: 'bath' },
} as ActivityOption;

describe('entryMatchesActivity', () => {
  it('matches breastfeeding by subtype', () => {
    expect(
      entryMatchesActivity(
        entry({ type: 'feeding', metadata: { subtype: 'breastfeeding' } }),
        breastfeeding,
      ),
    ).toBe(true);
    expect(
      entryMatchesActivity(
        entry({ type: 'feeding', metadata: { subtype: 'bottle' } }),
        breastfeeding,
      ),
    ).toBe(false);
  });

  it('keeps plain notes separate from typed note subtypes', () => {
    expect(entryMatchesActivity(entry({ type: 'note', metadata: {} }), notes)).toBe(true);
    expect(
      entryMatchesActivity(entry({ type: 'note', metadata: { subtype: 'bath' } }), notes),
    ).toBe(false);
    expect(entryMatchesActivity(entry({ type: 'note', metadata: { subtype: 'bath' } }), bath)).toBe(
      true,
    );
  });
});
