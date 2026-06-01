import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { MedicineReminder } from '@app-types/medicineReminder';

const MEDICINE_CHANNEL = 'medicine-reminders';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null = null;
let handlerConfigured = false;

/** Local notifications work on iOS/Android dev builds and production apps. */
export const notificationsSupported = Platform.OS === 'ios' || Platform.OS === 'android';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Android Expo Go cannot use expo-notifications (push removed in SDK 53+). */
export function requiresDevBuildForNotifications(): boolean {
  return Platform.OS === 'android' && isExpoGo();
}

export function devBuildRequiredMessage(): string {
  return (
    'Medicine reminders need a development build on Android.\n\n' +
    'Expo Go no longer supports notifications. Run:\n' +
    '  npm run build:dev:android\n\n' +
    'Then install the build on your phone and run npm start.'
  );
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsSupported) return null;
  if (requiresDevBuildForNotifications()) return null;

  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
  }

  if (!handlerConfigured && notificationsModule) {
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    handlerConfigured = true;
  }

  return notificationsModule;
}

async function ensureAndroidChannels(Notifications: NotificationsModule) {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'MamaNote reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F9A8B4',
  });

  await Notifications.setNotificationChannelAsync(MEDICINE_CHANNEL, {
    name: 'Medicine reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: '#B45309',
    sound: 'default',
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (requiresDevBuildForNotifications()) return false;

  const Notifications = await loadNotifications();
  if (!Notifications) return false;

  await ensureAndroidChannels(Notifications);

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export type NotificationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'unsupported';

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!notificationsSupported || requiresDevBuildForNotifications()) {
    return 'unsupported';
  }

  const Notifications = await loadNotifications();
  if (!Notifications) return 'unsupported';

  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export function medicineNotificationId(
  babyId: string,
  reminderId: string,
  hhmm: string,
): string {
  return `medicine-${babyId}-${reminderId}-${hhmm.replace(':', '')}`;
}

function parseTime(hhmm: string): { hour: number; minute: number } {
  const [hour, minute] = hhmm.split(':').map(Number);
  return { hour, minute };
}

export async function cancelMedicineNotifications(babyId: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .map((n) => n.identifier)
    .filter((id) => id.startsWith(`medicine-${babyId}-`));

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

export async function syncMedicineReminders(reminders: MedicineReminder[]) {
  if (requiresDevBuildForNotifications()) {
    console.warn('[MamaNote]', devBuildRequiredMessage());
    return;
  }

  const Notifications = await loadNotifications();
  if (!Notifications) return;

  try {
    await ensureAndroidChannels(Notifications);

    const babyIds = [...new Set(reminders.map((r) => r.babyId))];
    await Promise.all(babyIds.map((id) => cancelMedicineNotifications(id)));

    for (const reminder of reminders) {
      if (!reminder.enabled || reminder.times.length === 0) continue;

      for (const hhmm of reminder.times) {
        const { hour, minute } = parseTime(hhmm);
        await Notifications.scheduleNotificationAsync({
          identifier: medicineNotificationId(reminder.babyId, reminder.id, hhmm),
          content: {
            title: 'Medicine reminder 💊',
            body: `Time for ${reminder.medicineName}`,
            data: {
              type: 'medicine',
              babyId: reminder.babyId,
              reminderId: reminder.id,
            },
            ...(Platform.OS === 'android' ? { channelId: MEDICINE_CHANNEL } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          },
        });
      }
    }
  } catch (error) {
    console.warn('[MamaNote] Failed to sync medicine notifications', error);
  }
}

/** Remote push — not used for medicine reminders; requires dev build on Android. */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (requiresDevBuildForNotifications()) return null;

  const granted = await ensureNotificationPermissions();
  if (!granted) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === 'your-eas-project-id') {
      console.warn('[MamaNote] Set extra.eas.projectId in app.json for push tokens');
      return null;
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn('[MamaNote] Failed to get push token', error);
    return null;
  }
}
