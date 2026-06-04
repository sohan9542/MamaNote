import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Button } from './Button';
import { Input } from './Input';
import { OptionChip } from './OptionChip';
import { SleepLogFields } from './SleepLogFields';
import { Text } from './Text';
import type { ActivityOption } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { handleFreemiumError } from '@utils/freemiumError';
import { initialSleepLogState, resolveSleepEntryTimes, type SleepLogState } from '@utils/sleepLog';
import { cn } from '@utils/cn';

const AMOUNT_PRESETS = [60, 90, 120, 150, 180];

const DIAPER_OPTIONS: { label: string; subtype: LogMetadata['subtype'] }[] = [
  { label: 'Wet', subtype: 'wet' },
  { label: 'Dirty', subtype: 'dirty' },
  { label: 'Wet & Dirty', subtype: 'both' },
];

function buildEndedAt(startedAt: string, durationMinutes?: number): string | null {
  if (!durationMinutes) return null;
  const end = new Date(startedAt);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end.toISOString();
}

interface Props {
  activity: ActivityOption;
  onSaved?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function LogActivityForm({
  activity,
  onSaved,
  onCancel,
  showActions = true,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const addEntry = useBabyStore((s) => s.addEntry);

  const [metadata, setMetadata] = useState<LogMetadata>({
    ...activity.defaultMetadata,
  });
  const [amount, setAmount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notes, setNotes] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [sleepLog, setSleepLog] = useState<SleepLogState>(() => initialSleepLogState());
  const [submitting, setSubmitting] = useState(false);

  const isDiaper = activity.id === 'diaper';
  const isGeneralNote = activity.id === 'notes';
  const isBreast = activity.id === 'breastfeeding';
  const isSleep = activity.id === 'sleep';
  const isTemp = activity.id === 'temperature';
  const isGrowth = activity.id === 'growth';
  const isTimedNote = ['bath', 'tummy_time', 'doctor', 'playtime'].includes(activity.id);
  const showAmount =
    activity.type === 'pump' ||
    activity.id === 'bottle' ||
    metadata.subtype === 'nutrition' ||
    metadata.subtype === 'bottle';

  useEffect(() => {
    setMetadata({ ...activity.defaultMetadata });
    setAmount('');
    setTemperature('');
    setNotes('');
    setWeightKg('');
    setHeightCm('');
    if (activity.id === 'sleep') {
      setSleepLog(initialSleepLogState());
    }
  }, [activity.id]);

  const save = async (overrideMeta?: Partial<LogMetadata>) => {
    if (!user || !activeBabyId) {
      Alert.alert('No baby yet', 'Complete baby setup first.');
      return;
    }

    const finalMeta: LogMetadata = { ...metadata, ...overrideMeta };
    let startedAt = new Date().toISOString();
    let endedAt: string | null = null;

    if (isSleep) {
      const resolved = resolveSleepEntryTimes(sleepLog);
      if ('error' in resolved) {
        Alert.alert('Sleep log', resolved.error);
        return;
      }
      startedAt = resolved.started_at;
      endedAt = resolved.ended_at;
      finalMeta.durationMinutes = resolved.durationMinutes;
    } else {
      endedAt = buildEndedAt(startedAt, finalMeta.durationMinutes);
    }

    if (temperature) {
      finalMeta.temperature = Number(temperature);
      finalMeta.subtype = 'temperature';
    }

    if (weightKg) finalMeta.weightKg = Number(weightKg);
    if (heightCm) finalMeta.heightCm = Number(heightCm);

    if (isDiaper && !finalMeta.subtype) {
      Alert.alert('Pick a type', 'Select wet, dirty, or both.');
      return;
    }

    if (isBreast && !finalMeta.side) {
      Alert.alert('Pick a side', 'Select left, right, or both.');
      return;
    }

    if (isGeneralNote && !notes.trim()) {
      Alert.alert('Add a note', 'Write something before saving.');
      return;
    }

    setSubmitting(true);
    try {
      await addEntry({
        baby_id: activeBabyId,
        user_id: user.id,
        type: activity.type,
        started_at: startedAt,
        ended_at: endedAt,
        amount: amount ? Number(amount) : null,
        unit: showAmount ? 'ml' : null,
        notes: notes || null,
        metadata:
          Object.keys(finalMeta).length > 0
            ? (finalMeta as Record<string, string | number | undefined>)
            : null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.();
    } catch (error) {
      if (handleFreemiumError(error)) return;
      Alert.alert('Could not save', (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const instantDiaperSave = async (subtype: LogMetadata['subtype']) => {
    await save({ subtype });
  };

  const headerHint = useMemo(() => {
    if (isDiaper) return 'Tap to log instantly';
    if (isGeneralNote) return 'Jot down anything about your day';
    if (isBreast) return 'Which side?';
    if (isSleep) return 'How long, or from what time to what time?';
    if (isTemp) return 'Body temperature';
    if (isGrowth) return 'Weight & height';
    if (isTimedNote) return 'How long?';
    if (showAmount) return 'Amount (ml)';
    return 'Add details';
  }, [isDiaper, isGeneralNote, isBreast, isSleep, isTemp, isGrowth, isTimedNote, showAmount]);

  return (
    <View className="gap-5">
      <Text variant="caption" muted className="text-center">
        {headerHint}
      </Text>

      {isDiaper && (
        <View className="gap-3">
          {DIAPER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.subtype}
              onPress={() => instantDiaperSave(opt.subtype)}
              disabled={submitting}
              className="items-center rounded-2xl border border-green-200 bg-green-50 py-5 active:opacity-80 dark:border-green-900/40 dark:bg-green-950/30"
            >
              <Text variant="subtitle" className="font-bold text-green-800 dark:text-green-200">
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {isBreast && (
        <>
          <View className="flex-row flex-wrap justify-center gap-2">
            {(['left', 'right', 'both'] as const).map((side) => (
              <OptionChip
                key={side}
                label={side === 'both' ? 'Both' : side.charAt(0).toUpperCase() + side.slice(1)}
                selected={metadata.side === side}
                onPress={() => setMetadata((m) => ({ ...m, side, subtype: 'breastfeeding' }))}
                className="min-w-[28%]"
              />
            ))}
          </View>
          <View className="flex-row flex-wrap justify-center gap-2">
            {[5, 10, 15, 20, 30].map((min) => (
              <OptionChip
                key={min}
                label={`${min}m`}
                selected={metadata.durationMinutes === min}
                onPress={() => setMetadata((m) => ({ ...m, durationMinutes: min }))}
              />
            ))}
          </View>
        </>
      )}

      {isSleep && <SleepLogFields value={sleepLog} onChange={setSleepLog} />}

      {showAmount && (
        <>
          <View className="flex-row flex-wrap justify-center gap-2">
            {AMOUNT_PRESETS.map((ml) => (
              <OptionChip
                key={ml}
                label={`${ml}`}
                selected={amount === String(ml)}
                onPress={() => setAmount(String(ml))}
              />
            ))}
          </View>
          <Input
            label="Custom amount (ml)"
            value={amount}
            onChangeText={setAmount}
            placeholder="120"
            keyboardType="numeric"
          />
        </>
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

      {isGrowth && (
        <View className="gap-3">
          <Input
            label="Weight (kg)"
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="6.2"
            keyboardType="decimal-pad"
          />
          <Input
            label="Height (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            placeholder="62"
            keyboardType="numeric"
          />
        </View>
      )}

      {isTimedNote && (
        <View className="flex-row flex-wrap justify-center gap-2">
          {[5, 10, 15, 20, 30, 45].map((min) => (
            <OptionChip
              key={min}
              label={`${min}m`}
              selected={metadata.durationMinutes === min}
              onPress={() => setMetadata((m) => ({ ...m, durationMinutes: min }))}
            />
          ))}
        </View>
      )}

      {isGeneralNote && (
        <Input
          label="Note"
          value={notes}
          onChangeText={setNotes}
          placeholder="What would you like to remember?"
          multiline
          numberOfLines={4}
        />
      )}

      {!isDiaper && !isGeneralNote && (
        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything to remember?"
          multiline
          numberOfLines={2}
        />
      )}

      {showActions && !isDiaper && (
        <View className="flex-row gap-3">
          {onCancel ? (
            <Button variant="ghost" className="flex-1" onPress={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button
            className={cn(onCancel ? 'flex-1' : 'w-full')}
            fullWidth={!onCancel}
            loading={submitting}
            onPress={() => save()}
            size="lg"
          >
            Save
          </Button>
        </View>
      )}
    </View>
  );
}
