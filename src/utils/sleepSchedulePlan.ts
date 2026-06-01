import type { SleepScheduleSettings } from '@store/sleepStore';

export type NapSlot = {
  label: string;
  startLabel: string;
  durationMinutes: number;
};

export type GeneratedSleepPlan = {
  wakeLabel: string;
  bedtimeLabel: string;
  naps: NapSlot[];
  wakeWindowMinutes: number;
};

/** Parse "HH:mm" or "H:mm" to minutes from midnight. */
export function parseClockToMinutes(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatMinutesAsClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function generateSleepPlan(
  settings: Pick<
    SleepScheduleSettings,
    'wakeTime' | 'bedtime' | 'targetNaps' | 'napDurationMinutes'
  >,
): GeneratedSleepPlan | { error: string } {
  const wake = parseClockToMinutes(settings.wakeTime);
  const bed = parseClockToMinutes(settings.bedtime);

  if (wake == null || bed == null) {
    return { error: 'Use wake and bedtime as HH:mm (e.g. 07:00 and 19:30).' };
  }

  let daySpan = bed - wake;
  if (daySpan <= 60) {
    return { error: 'Bedtime must be at least 1 hour after wake time.' };
  }

  const naps = settings.targetNaps;
  const napDur = settings.napDurationMinutes;
  const totalNapMinutes = naps * napDur;
  const awakeMinutes = daySpan - totalNapMinutes;

  if (awakeMinutes < naps * 30) {
    return {
      error: 'Not enough time between wake and bed for this many naps. Try fewer naps or a shorter nap length.',
    };
  }

  const wakeWindow = Math.floor(awakeMinutes / (naps + 1));
  const slots: NapSlot[] = [];
  let cursor = wake + wakeWindow;

  for (let i = 0; i < naps; i++) {
    slots.push({
      label: `Nap ${i + 1}`,
      startLabel: formatMinutesAsClock(cursor),
      durationMinutes: napDur,
    });
    cursor += napDur + wakeWindow;
  }

  return {
    wakeLabel: formatMinutesAsClock(wake),
    bedtimeLabel: formatMinutesAsClock(bed),
    naps: slots,
    wakeWindowMinutes: wakeWindow,
  };
}
