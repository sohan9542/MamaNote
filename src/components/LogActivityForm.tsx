import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Button } from './Button';
import { Input } from './Input';
import { OptionChip } from './OptionChip';
import { Text } from './Text';
import type { ActivityOption } from '@constants/activities';
import type { LogMetadata } from '@constants/logFields';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { handleFreemiumError } from '@utils/freemiumError';
import { cn } from '@utils/cn';
import type { LogEntryType } from '@app-types/database';

const AMOUNT_PRESETS = [60, 90, 120, 150, 180];
const SLEEP_DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '10h', minutes: 600 },
];

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
  /** Hide outer save button area when parent handles it */
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
  const [submitting, setSubmitting] = useState(false);

  const isDiaper = activity.id === 'diaper';
  const isBreast = activity.id === 'breastfeeding';
  const isSleep = activity.id === 'sleep';
  const isTemp = activity.id === 'temperature';
  const showAmount =
    activity.type === 'pump' ||
    metadata.subtype === 'nutrition' ||
    metadata.subtype === 'bottle';

  const save = async (overrideMeta?: Partial<LogMetadata>) => {
    if (!user || !activeBabyId) {
      Alert.alert('No baby yet', 'Complete baby setup first.');
      return;
    }

    const startedAt = new Date().toISOString();
    const finalMeta: LogMetadata = { ...metadata, ...overrideMeta };

    if (temperature) {
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

    setSubmitting(true);
    try {
      await addEntry({
        baby_id: activeBabyId,
        user_id: user.id,
        type: activity.type,
        started_at: startedAt,
        ended_at: buildEndedAt(startedAt, finalMeta.durationMinutes),
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
      Alert.alert('Could not save', handleFreemiumError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const instantDiaperSave = async (subtype: LogMetadata['subtype']) => {
    await save({ subtype });
  };

  const headerHint = useMemo(() => {
    if (isDiaper) return 'Tap to log instantly';
    if (isBreast) return 'Which side?';
    if (isSleep) return 'How long?';
    if (isTemp) return 'Body temperature';
    if (showAmount) return 'Amount (ml)';
    return 'Add details';
  }, [isDiaper, isBreast, isSleep, isTemp, showAmount]);

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

      {isSleep && (
        <View className="flex-row flex-wrap justify-center gap-2">
          {SLEEP_DURATIONS.map((d) => (
            <OptionChip
              key={d.minutes}
              label={d.label}
              selected={metadata.durationMinutes === d.minutes}
              onPress={() => setMetadata((m) => ({ ...m, durationMinutes: d.minutes }))}
            />
          ))}
        </View>
      )}

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

      {!isDiaper && (
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
