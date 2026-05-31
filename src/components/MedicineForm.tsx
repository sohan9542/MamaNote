import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Bell } from 'lucide-react-native';

import { Button } from './Button';
import { Input } from './Input';
import { OptionChip } from './OptionChip';
import { Text } from './Text';
import { defaultReminderTime, TimePickerField } from './TimePickerField';
import {
  ensureNotificationPermissions,
  devBuildRequiredMessage,
  notificationsSupported,
  requiresDevBuildForNotifications,
} from '@lib/notifications';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useMedicineReminderStore } from '@store/medicineReminderStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { assertCanAddMedicineReminder } from '@lib/freemium';
import { handleFreemiumError } from '@utils/freemiumError';
import { MEDICINE_TIME_PRESETS } from '@app-types/medicineReminder';
import {
  formatMedicineTime,
  toTimeString,
  uniqueTimes,
} from '@utils/medicineTime';
import { medicineNamesMatch } from '@utils/medicineReminder';

interface Props {
  active?: boolean;
  onSaved: () => void;
}

function newReminderId() {
  return `med-${Date.now()}`;
}

export function MedicineForm({ active = true, onSaved }: Props) {
  const user = useAuthStore((s) => s.user);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const addEntry = useBabyStore((s) => s.addEntry);
  const getForBaby = useMedicineReminderStore((s) => s.getForBaby);
  const remindersByBaby = useMedicineReminderStore((s) => s.remindersByBaby);
  const saveReminder = useMedicineReminderStore((s) => s.saveReminder);
  const deleteReminder = useMedicineReminderStore((s) => s.deleteReminder);
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  const existing = activeBabyId ? getForBaby(activeBabyId)[0] : undefined;

  const [medicineName, setMedicineName] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [reminderId, setReminderId] = useState(newReminderId);
  const [customTime, setCustomTime] = useState(defaultReminderTime);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (existing) {
      setMedicineName(existing.medicineName);
      setTimes(existing.times);
      setReminderId(existing.id);
    } else {
      setMedicineName('');
      setTimes([]);
      setReminderId(newReminderId());
    }
    setCustomTime(defaultReminderTime());
  }, [active, existing?.id, existing?.medicineName, existing?.times]);

  const sortedTimes = useMemo(() => uniqueTimes(times), [times]);

  const togglePreset = (time: string) => {
    setTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : uniqueTimes([...prev, time]),
    );
  };

  const addCustomTime = (date: Date) => {
    setCustomTime(date);
    const next = toTimeString(date);
    setTimes((prev) => uniqueTimes([...prev, next]));
  };

  const removeTime = (time: string) => {
    setTimes((prev) => prev.filter((t) => t !== time));
  };

  const validateName = () => {
    const name = medicineName.trim();
    if (!name) {
      Alert.alert('Medicine name', 'Enter the medicine name to continue.');
      return null;
    }
    return name;
  };

  const handleSave = async () => {
    const name = validateName();
    if (!name || !user || !activeBabyId) {
      if (!activeBabyId) Alert.alert('No baby yet', 'Complete baby setup first.');
      return;
    }

    const wantsReminders = sortedTimes.length > 0;

    if (wantsReminders && notificationsSupported) {
      if (requiresDevBuildForNotifications()) {
        Alert.alert('Development build required', devBuildRequiredMessage());
        return;
      }
      const granted = await ensureNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications off',
          'Enable notifications in Settings to receive medicine reminders.',
        );
        return;
      }
    }

    setSaving(true);
    try {
      await addEntry({
        baby_id: activeBabyId,
        user_id: user.id,
        type: 'medication',
        started_at: new Date().toISOString(),
        ended_at: null,
        amount: null,
        unit: null,
        notes: name,
        metadata: { medicineName: name },
      });

      if (wantsReminders) {
        const isUpdatingSame =
          Boolean(existing) && medicineNamesMatch(existing!.medicineName, name);
        assertCanAddMedicineReminder(remindersByBaby, isPremium(), {
          excludeReminderId: isUpdatingSame ? existing!.id : undefined,
          isUpdate: isUpdatingSame,
        });
        await saveReminder({
          id: reminderId,
          babyId: activeBabyId,
          medicineName: name,
          times: sortedTimes,
          enabled: true,
          updatedAt: new Date().toISOString(),
        });
      } else if (existing) {
        await deleteReminder(activeBabyId, existing.id);
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (error) {
      Alert.alert('Could not save', handleFreemiumError(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-5">
      <Input
        label="Medicine name"
        placeholder="e.g. Vitamin D drops"
        value={medicineName}
        onChangeText={setMedicineName}
        autoCapitalize="words"
      />

      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Bell size={16} color="#B45309" />
          <Text variant="caption" className="font-bold text-ink-700 dark:text-ink-100">
            Reminder times (optional)
          </Text>
        </View>
        <Text variant="caption" muted>
          Pick times for daily notifications, or skip to log without reminders.
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {MEDICINE_TIME_PRESETS.map((preset) => (
            <OptionChip
              key={preset.time}
              label={`${preset.label} · ${formatMedicineTime(preset.time)}`}
              selected={times.includes(preset.time)}
              onPress={() => togglePreset(preset.time)}
            />
          ))}
        </View>

        <TimePickerField label="Custom time" value={customTime} onChange={addCustomTime} />

        {sortedTimes.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {sortedTimes.map((time) => (
              <Pressable
                key={time}
                onPress={() => removeTime(time)}
                className="flex-row items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/40 dark:bg-amber-950/30"
              >
                <Text
                  variant="caption"
                  className="font-semibold text-amber-800 dark:text-amber-200"
                >
                  {formatMedicineTime(time)}
                </Text>
                <Text variant="caption" className="text-amber-600 dark:text-amber-400">
                  ×
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <Button onPress={handleSave} loading={saving} size="lg" fullWidth>
        Save
      </Button>
    </View>
  );
}
