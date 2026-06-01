import { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Trash2, X } from 'lucide-react-native';

import { Button } from './Button';
import { Input } from './Input';
import { OptionChip } from './OptionChip';
import { SleepLogFields } from './SleepLogFields';
import { Text } from './Text';
import { getActivityForEntry } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import {
  ensureNotificationPermissions,
  devBuildRequiredMessage,
  notificationsSupported,
  requiresDevBuildForNotifications,
} from '@lib/notifications';
import { useBabyStore } from '@store/babyStore';
import { useMedicineReminderStore } from '@store/medicineReminderStore';
import { entryDetailLine, entryDisplayTitle } from '@utils/baby';
import { formatDate, formatTime } from '@utils/date';
import { initialSleepLogState, resolveSleepEntryTimes, type SleepLogState } from '@utils/sleepLog';
import { formatMedicineTime } from '@utils/medicineTime';
import {
  findMatchingRemindersForMedicine,
  medicineNameFromEntry,
} from '@utils/medicineReminder';
import type { LogEntry } from '@app-types/database';
import type { MedicineReminder } from '@app-types/medicineReminder';

const EMPTY_REMINDERS: MedicineReminder[] = [];

const DIAPER_OPTIONS: { label: string; subtype: LogMetadata['subtype'] }[] = [
  { label: 'Wet', subtype: 'wet' },
  { label: 'Dirty', subtype: 'dirty' },
  { label: 'Wet & Dirty', subtype: 'both' },
];

interface Props {
  entry: LogEntry | null;
  visible: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function buildEndedAt(startedAt: string, durationMinutes?: number): string | null {
  if (!durationMinutes) return null;
  const end = new Date(startedAt);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end.toISOString();
}

export function LogEntryDetailSheet({ entry, visible, onClose, onUpdated }: Props) {
  const insets = useSafeAreaInsets();
  const updateEntry = useBabyStore((s) => s.updateEntry);
  const deleteEntry = useBabyStore((s) => s.deleteEntry);
  const babyId = entry?.baby_id;
  const babyReminders = useMedicineReminderStore((s) =>
    babyId ? (s.remindersByBaby[babyId] ?? EMPTY_REMINDERS) : EMPTY_REMINDERS,
  );
  const deleteRemindersForMedicine = useMedicineReminderStore(
    (s) => s.deleteRemindersForMedicine,
  );
  const saveReminder = useMedicineReminderStore((s) => s.saveReminder);

  const [metadata, setMetadata] = useState<LogMetadata>({});
  const [amount, setAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [sleepLog, setSleepLog] = useState<SleepLogState>(() => initialSleepLogState());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingReminder, setTogglingReminder] = useState(false);

  useEffect(() => {
    if (!entry) return;
    const meta = (entry.metadata ?? {}) as LogMetadata;
    setMetadata(meta);
    setAmount(entry.amount != null ? String(entry.amount) : '');
    setTemperature(meta.temperature != null ? String(meta.temperature) : '');
    setNotes(entry.notes ?? '');
    setMedicineName(entry.notes ?? meta.medicineName ?? '');
    if (entry.type === 'sleep') {
      setSleepLog(
        initialSleepLogState({
          started_at: entry.started_at,
          ended_at: entry.ended_at,
          metadata: meta,
        }),
      );
    }
  }, [entry?.id]);

  const activity = entry ? getActivityForEntry(entry.type, entry.metadata as LogMetadata) : null;
  const Icon = activity?.icon;
  const iconColor = activity?.iconColor ?? '#FB7185';
  const bg = activity?.bg ?? '#FDF2F8';

  const isDiaper = entry?.type === 'diaper';
  const isBreast = entry?.type === 'feeding' && metadata.subtype === 'breastfeeding';
  const isSleep = entry?.type === 'sleep';
  const isTemp = entry?.type === 'note' && metadata.subtype === 'temperature';
  const isMedicine = entry?.type === 'medication';
  const showAmount =
    entry?.type === 'pump' ||
    metadata.subtype === 'nutrition' ||
    metadata.subtype === 'bottle';

  const matchingReminders = useMemo(() => {
    if (!isMedicine || !entry) return EMPTY_REMINDERS;
    const name = medicineNameFromEntry(entry.notes, entry.metadata as LogMetadata);
    return findMatchingRemindersForMedicine(babyReminders, name);
  }, [babyReminders, entry, isMedicine]);

  const reminderEnabled = matchingReminders.some((r) => r.enabled);

  const reminderTimesLabel = useMemo(
    () => matchingReminders.flatMap((r) => r.times).map(formatMedicineTime).join(', '),
    [matchingReminders],
  );

  const detailSummary = useMemo(() => (entry ? entryDetailLine(entry) : ''), [entry]);

  const handleSave = async () => {
    if (!entry) return;

    const finalMeta: LogMetadata = { ...metadata };

    if (isTemp && temperature) {
      finalMeta.temperature = Number(temperature);
      finalMeta.subtype = 'temperature';
    }

    if (isDiaper && !finalMeta.subtype) {
      Alert.alert('Pick a type', 'Select wet, dirty, or both.');
      return;
    }

    if (isBreast && !finalMeta.side) {
      Alert.alert('Pick a side', 'Select left, right, or both.');
      return;
    }

    if (isMedicine && !medicineName.trim()) {
      Alert.alert('Medicine name', 'Enter the medicine name.');
      return;
    }

    let startedAt = entry.started_at;
    let endedAt: string | null = buildEndedAt(entry.started_at, finalMeta.durationMinutes);

    if (isSleep) {
      const resolved = resolveSleepEntryTimes(sleepLog, {
        referenceDay: new Date(entry.started_at),
        endAt: entry.ended_at ? new Date(entry.ended_at) : undefined,
      });
      if ('error' in resolved) {
        Alert.alert('Sleep log', resolved.error);
        return;
      }
      startedAt = resolved.started_at;
      endedAt = resolved.ended_at;
      finalMeta.durationMinutes = resolved.durationMinutes;
    }

    setSaving(true);
    try {
      await updateEntry(entry.id, {
        amount: amount ? Number(amount) : null,
        unit: showAmount && amount ? 'ml' : entry.unit,
        notes: isMedicine ? medicineName.trim() : notes || null,
        started_at: startedAt,
        ended_at: endedAt,
        metadata:
          Object.keys(finalMeta).length > 0
            ? ({
                ...finalMeta,
                ...(isMedicine ? { medicineName: medicineName.trim() } : {}),
              } as Record<string, string | number | undefined>)
            : isMedicine
              ? { medicineName: medicineName.trim() }
              : null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Could not save', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!entry) return;
    const hasReminder = isMedicine && matchingReminders.length > 0;
    Alert.alert(
      'Delete activity?',
      hasReminder
        ? 'This will remove the activity and stop its medicine reminders.'
        : 'This cannot be undone.',
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            if (hasReminder) {
              const name = medicineNameFromEntry(entry.notes, entry.metadata as LogMetadata);
              await deleteRemindersForMedicine(entry.baby_id, name);
            }
            await deleteEntry(entry.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onUpdated();
            onClose();
          } catch (error) {
            Alert.alert('Could not delete', (error as Error).message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ],
    );
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (!entry || matchingReminders.length === 0) return;

    if (enabled && notificationsSupported) {
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

    setTogglingReminder(true);
    try {
      await Promise.all(
        matchingReminders.map((reminder) =>
          saveReminder({
            ...reminder,
            enabled,
            updatedAt: new Date().toISOString(),
          }),
        ),
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdated();
    } catch (error) {
      Alert.alert('Could not update reminder', (error as Error).message);
    } finally {
      setTogglingReminder(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className="max-h-[92%] rounded-t-[28px] bg-white pt-3 dark:bg-ink-800"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="mb-4 items-center px-5">
            <View className="mb-4 h-1 w-10 rounded-full bg-ink-200 dark:bg-ink-600" />
            <View className="w-full flex-row items-center gap-3">
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: bg }}
              >
                {Icon ? <Icon size={24} color={iconColor} /> : null}
              </View>
              <View className="flex-1">
                <Text variant="subtitle" className="font-bold">
                  {entryDisplayTitle(entry)}
                </Text>
                <Text variant="caption" muted>
                  {formatDate(entry.started_at)} · {formatTime(entry.started_at)}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
              >
                <X size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </View>

          <ScrollView className="px-5" keyboardShouldPersistTaps="handled">
            <View className="mb-4 rounded-2xl bg-ink-50/80 px-4 py-3 dark:bg-ink-700/50">
              <Text variant="caption" muted>
                Logged
              </Text>
              <Text variant="subtitle" className="mt-0.5 font-semibold">
                {detailSummary}
              </Text>
            </View>

            <View className="gap-5 pb-4">
              {isMedicine && matchingReminders.length > 0 && (
                <View className="rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                  <Text variant="caption" className="font-semibold text-amber-900 dark:text-amber-100">
                    {reminderEnabled ? 'Reminder active' : 'Reminder paused'}
                  </Text>
                  <Text variant="caption" muted className="mt-1">
                    Daily at {reminderTimesLabel}
                  </Text>
                </View>
              )}

              {isMedicine && (
                <Input
                  label="Medicine name"
                  value={medicineName}
                  onChangeText={setMedicineName}
                  autoCapitalize="words"
                />
              )}

              {isDiaper && (
                <View className="gap-2">
                  <Text variant="caption" className="font-medium">
                    Type
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {DIAPER_OPTIONS.map((opt) => (
                      <OptionChip
                        key={opt.subtype}
                        label={opt.label}
                        selected={metadata.subtype === opt.subtype}
                        onPress={() => setMetadata((m) => ({ ...m, subtype: opt.subtype }))}
                      />
                    ))}
                  </View>
                </View>
              )}

              {isBreast && (
                <>
                  <View className="gap-2">
                    <Text variant="caption" className="font-medium">
                      Side
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(['left', 'right', 'both'] as const).map((side) => (
                        <OptionChip
                          key={side}
                          label={side === 'both' ? 'Both' : side.charAt(0).toUpperCase() + side.slice(1)}
                          selected={metadata.side === side}
                          onPress={() =>
                            setMetadata((m) => ({ ...m, side, subtype: 'breastfeeding' }))
                          }
                        />
                      ))}
                    </View>
                  </View>
                  <View className="gap-2">
                    <Text variant="caption" className="font-medium">
                      Duration
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[5, 10, 15, 20, 30].map((min) => (
                        <OptionChip
                          key={min}
                          label={`${min}m`}
                          selected={metadata.durationMinutes === min}
                          onPress={() => setMetadata((m) => ({ ...m, durationMinutes: min }))}
                        />
                      ))}
                    </View>
                  </View>
                </>
              )}

              {isSleep && <SleepLogFields value={sleepLog} onChange={setSleepLog} />}

              {showAmount && (
                <Input
                  label="Amount (ml)"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="120"
                  keyboardType="numeric"
                />
              )}

              {isTemp && (
                <Input
                  label="Temperature (°C)"
                  value={temperature}
                  onChangeText={setTemperature}
                  placeholder="36.6"
                  keyboardType="decimal-pad"
                />
              )}

              {!isDiaper && !isMedicine && (
                <Input
                  label="Notes"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Anything to remember?"
                  multiline
                  numberOfLines={2}
                />
              )}
            </View>
          </ScrollView>

          <View className="gap-3 border-t border-ink-100/60 px-5 pt-4 dark:border-ink-600">
            <Button onPress={handleSave} loading={saving} size="lg" fullWidth>
              Save changes
            </Button>
            {isMedicine && matchingReminders.length > 0 ? (
              <View className="flex-row items-center gap-3">
                <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-ink-100/80 bg-ink-50 px-4 py-3 dark:border-ink-600 dark:bg-ink-700">
                  <Text variant="caption" className="font-semibold text-ink-800 dark:text-ink-50">
                    Daily reminder
                  </Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={handleToggleReminder}
                    disabled={togglingReminder}
                    trackColor={{ false: '#D1D5DB', true: '#FBBF24' }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
                <Button
                  variant="ghost"
                  onPress={handleDelete}
                  loading={deleting}
                  leftIcon={<Trash2 size={16} color="#F43F5E" />}
                  className="px-4"
                >
                  Delete
                </Button>
              </View>
            ) : (
              <Button
                variant="ghost"
                onPress={handleDelete}
                loading={deleting}
                fullWidth
                leftIcon={<Trash2 size={16} color="#F43F5E" />}
              >
                Delete activity
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
