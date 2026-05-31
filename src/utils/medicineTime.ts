import { format, parse } from 'date-fns';

/** "HH:mm" → "8:00 AM" */
export function formatMedicineTime(hhmm: string): string {
  const parsed = parse(hhmm, 'HH:mm', new Date());
  return format(parsed, 'h:mm a');
}

export function toTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

export function sortTimes(times: string[]): string[] {
  return [...times].sort((a, b) => a.localeCompare(b));
}

export function uniqueTimes(times: string[]): string[] {
  return sortTimes([...new Set(times)]);
}
