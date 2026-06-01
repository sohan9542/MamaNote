import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import { Bell, Pill, Settings } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Screen } from '@components/Screen';
import { ScreenBackHeader } from '@components/ScreenBackHeader';
import { Text } from '@components/Text';
import { useTheme } from '@hooks/useTheme';
import {
  devBuildRequiredMessage,
  ensureNotificationPermissions,
  getNotificationPermissionStatus,
  notificationsSupported,
  requiresDevBuildForNotifications,
  type NotificationPermissionStatus,
} from '@lib/notifications';
import { useBabyStore } from '@store/babyStore';
import { useMedicineReminderStore } from '@store/medicineReminderStore';

const STATUS_LABEL: Record<NotificationPermissionStatus, string> = {
  granted: 'Allowed',
  denied: 'Blocked',
  undetermined: 'Not set',
  unsupported: 'Unavailable',
};

const STATUS_COLOR: Record<NotificationPermissionStatus, string> = {
  granted: '#22C55E',
  denied: '#F43F5E',
  undetermined: '#F59E0B',
  unsupported: '#A89FBE',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const remindersByBaby = useMedicineReminderStore((s) => s.remindersByBaby);
  const hydrateReminders = useMedicineReminderStore((s) => s.hydrate);
  const remindersHydrated = useMedicineReminderStore((s) => s.hydrated);

  const [status, setStatus] = useState<NotificationPermissionStatus>('undetermined');
  const [requesting, setRequesting] = useState(false);

  const refreshStatus = useCallback(async () => {
    setStatus(await getNotificationPermissionStatus());
  }, []);

  useEffect(() => {
    if (!remindersHydrated) {
      void hydrateReminders();
    }
    void refreshStatus();
  }, [hydrateReminders, refreshStatus, remindersHydrated]);

  const { activeReminders, scheduledAlerts } = useMemo(() => {
    const all = Object.values(remindersByBaby).flat();
    const active = all.filter((r) => r.enabled);
    const alerts = active.reduce((sum, r) => sum + r.times.length, 0);
    return { activeReminders: active.length, scheduledAlerts: alerts };
  }, [remindersByBaby]);

  const handleEnable = async () => {
    if (requiresDevBuildForNotifications()) {
      Alert.alert('Development build required', devBuildRequiredMessage());
      return;
    }

    setRequesting(true);
    try {
      const granted = await ensureNotificationPermissions();
      await refreshStatus();
      if (!granted) {
        Alert.alert(
          'Notifications blocked',
          'Enable notifications for MamaNote in your phone Settings to receive medicine reminders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  return (
    <Screen scroll contentClassName="pb-10">
      <ScreenBackHeader
        title="Notifications"
        subtitle="Medicine reminders on your device"
      />

      <Card tone="lavender" className="mb-5 gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-ink-600">
            <Bell size={20} color={colors.accent} />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-semibold">
              What notifications are for
            </Text>
            <Text muted variant="caption">
              Local reminders only — no ads or marketing
            </Text>
          </View>
        </View>
        <Text className="leading-6">
          MamaNote uses notifications for one thing:{' '}
          <Text className="font-semibold">medicine reminders</Text>. When you log a
          medicine and choose reminder times, we schedule daily alerts on your phone
          so you don&apos;t miss a dose.
        </Text>
      </Card>

      <Card className="mb-5 gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="subtitle" className="font-semibold">
            Permission status
          </Text>
          <View className="flex-row items-center gap-2">
            <View
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: STATUS_COLOR[status] }}
            />
            <Text variant="caption" className="font-semibold">
              {STATUS_LABEL[status]}
            </Text>
          </View>
        </View>

        {!notificationsSupported ? (
          <Text muted className="leading-6">
            Notifications are only available on iOS and Android.
          </Text>
        ) : requiresDevBuildForNotifications() ? (
          <Text muted className="leading-6">
            Android Expo Go cannot show notifications. Install a development or production
            build to test medicine reminders.
          </Text>
        ) : (
          <>
            <Text muted className="leading-6">
              {status === 'granted'
                ? 'Reminders can fire at the times you set when logging medicine.'
                : status === 'denied'
                  ? 'Notifications are off. Turn them on in Settings to receive medicine reminders.'
                  : 'Allow notifications so medicine reminders can alert you on time.'}
            </Text>
            {status !== 'granted' ? (
              <Button onPress={handleEnable} loading={requesting} fullWidth>
                Allow notifications
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onPress={handleOpenSettings}
              fullWidth
              leftIcon={<Settings size={18} color={colors.primary} />}
            >
              Open phone settings
            </Button>
          </>
        )}
      </Card>

      <Card tone="beige" className="mb-5 gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-ink-600">
            <Pill size={20} color={colors.warning} />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-semibold">
              Your reminders
            </Text>
            <Text muted variant="caption">
              {activeBabyId ? 'For your active baby profile' : 'No baby selected'}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1 rounded-2xl bg-white/80 px-4 py-3 dark:bg-ink-600">
            <Text variant="caption" muted>
              Active medicines
            </Text>
            <Text variant="title" className="font-bold">
              {activeReminders}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl bg-white/80 px-4 py-3 dark:bg-ink-600">
            <Text variant="caption" muted>
              Daily alerts
            </Text>
            <Text variant="title" className="font-bold">
              {scheduledAlerts}
            </Text>
          </View>
        </View>
        <Text muted variant="caption" className="leading-5">
          Set or change reminders when logging medicine, or edit them from a medicine
          log entry. Reminder schedules are stored on your device.
        </Text>
      </Card>

      <Card className="gap-3">
        <Text variant="subtitle" className="font-semibold">
          What we don&apos;t do
        </Text>
        {[
          'No promotional or marketing push notifications',
          'No remote tracking of when you open the app',
          'No sharing reminder data with third parties',
        ].map((item) => (
          <View key={item} className="flex-row gap-3">
            <Text className="text-mint-400">•</Text>
            <Text muted className="flex-1 leading-6">
              {item}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}
