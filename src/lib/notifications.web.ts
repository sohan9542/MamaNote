import type { MedicineReminder } from '@app-types/medicineReminder';

/** Local notifications are iOS/Android only — not supported on web. */
export const notificationsSupported = false;

export function isExpoGo(): boolean {
  return false;
}

export function requiresDevBuildForNotifications(): boolean {
  return false;
}

export function devBuildRequiredMessage(): string {
  return 'Medicine reminders are only available in the mobile app.';
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  return false;
}

export function medicineNotificationId(
  babyId: string,
  reminderId: string,
  hhmm: string,
): string {
  return `medicine-${babyId}-${reminderId}-${hhmm.replace(':', '')}`;
}

export async function cancelMedicineNotifications(_babyId: string) {}

export async function syncMedicineReminders(_reminders: MedicineReminder[]) {}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  return null;
}
