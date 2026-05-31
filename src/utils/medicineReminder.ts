import type { MedicineReminder } from '@app-types/medicineReminder';

export function normalizeMedicineName(name: string): string {
  return name.trim().toLowerCase();
}

export function medicineNamesMatch(a: string, b: string): boolean {
  return normalizeMedicineName(a) === normalizeMedicineName(b);
}

export function isActiveReminder(reminder: MedicineReminder): boolean {
  return reminder.enabled && reminder.times.length > 0;
}

export function findMatchingRemindersForMedicine(
  reminders: MedicineReminder[],
  medicineName: string,
): MedicineReminder[] {
  return reminders.filter(
    (r) => medicineNamesMatch(r.medicineName, medicineName) && r.times.length > 0,
  );
}

export function findRemindersForMedicine(
  reminders: MedicineReminder[],
  medicineName: string,
): MedicineReminder[] {
  return findMatchingRemindersForMedicine(reminders, medicineName).filter(isActiveReminder);
}

export function medicineNameFromEntry(
  notes: string | null | undefined,
  metadata?: { medicineName?: string | number } | null,
): string {
  const fromMeta = metadata?.medicineName;
  if (typeof fromMeta === 'string' && fromMeta.trim()) return fromMeta.trim();
  return notes?.trim() ?? '';
}
