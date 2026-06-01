import { View } from 'react-native';

import { Input } from './Input';
import { OptionChip } from './OptionChip';
import { Text } from './Text';
import { TimePickerField } from './TimePickerField';
import { SLEEP_DURATION_PRESETS } from '@constants/sleepLog';
import type { SleepLogMode, SleepLogState } from '@utils/sleepLog';

interface Props {
  value: SleepLogState;
  onChange: (next: SleepLogState) => void;
}

export function SleepLogFields({ value, onChange }: Props) {
  const setMode = (mode: SleepLogMode) => onChange({ ...value, mode });

  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        <OptionChip
          label="Minutes"
          selected={value.mode === 'duration'}
          onPress={() => setMode('duration')}
          className="flex-1"
        />
        <OptionChip
          label="Start – end"
          selected={value.mode === 'range'}
          onPress={() => setMode('range')}
          className="flex-1"
        />
      </View>

      {value.mode === 'duration' ? (
        <>
          <View className="flex-row flex-wrap justify-center gap-2">
            {SLEEP_DURATION_PRESETS.map((d) => (
              <OptionChip
                key={d.minutes}
                label={d.label}
                selected={value.durationMinutes === d.minutes}
                onPress={() =>
                  onChange({
                    ...value,
                    durationMinutes: d.minutes,
                    customMinutes: '',
                  })
                }
              />
            ))}
          </View>
          <Input
            label="Or enter minutes"
            value={value.customMinutes}
            onChangeText={(customMinutes) =>
              onChange({
                ...value,
                customMinutes,
                durationMinutes: null,
              })
            }
            placeholder="e.g. 45"
            keyboardType="number-pad"
          />
          <Text variant="caption" muted className="text-center">
            Logged as ending now — use start – end for an earlier nap or night sleep.
          </Text>
        </>
      ) : (
        <>
          <TimePickerField
            label="From"
            value={value.startTime}
            onChange={(startTime) => onChange({ ...value, startTime })}
          />
          <TimePickerField
            label="To"
            value={value.endTime}
            onChange={(endTime) => onChange({ ...value, endTime })}
          />
        </>
      )}
    </View>
  );
}
