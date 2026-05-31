import { format } from 'date-fns';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Clock } from 'lucide-react-native';

import { Text } from './Text';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@utils/cn';

interface TimePickerFieldProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
}

export function TimePickerField({
  label = 'Time',
  value,
  onChange,
  error,
}: TimePickerFieldProps) {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [tempTime, setTempTime] = useState(value);

  const displayValue = format(value, 'h:mm a');

  const openPicker = () => {
    setTempTime(value);
    setOpen(true);
  };

  const confirm = () => {
    onChange(tempTime);
    setOpen(false);
  };

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selected) {
        onChange(selected);
      }
      return;
    }
    if (selected) {
      setTempTime(selected);
    }
  };

  return (
    <View className="w-full">
      {label ? (
        <Text variant="caption" className="mb-2 font-medium text-ink-500 dark:text-ink-200">
          {label}
        </Text>
      ) : null}

      <Pressable
        onPress={openPicker}
        className={cn(
          'flex-row items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 dark:bg-ink-700',
          error ? 'border-pink-500' : 'border-ink-100 dark:border-ink-600',
        )}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${displayValue}. Tap to change.`}
      >
        <Clock size={18} color="#A89FBE" />
        <Text className="flex-1 text-base text-ink-800 dark:text-ink-50">{displayValue}</Text>
      </Pressable>

      {error ? (
        <Text variant="caption" className="mt-1.5 text-pink-500">
          {error}
        </Text>
      ) : null}

      {Platform.OS === 'android' && open ? (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="default"
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' && open ? (
        <Modal visible transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
            <Pressable
              className="rounded-t-3xl bg-white px-4 pb-8 pt-4 dark:bg-ink-700"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text className="font-medium text-ink-400">Cancel</Text>
                </Pressable>
                <Text variant="subtitle" className="font-semibold">
                  {label}
                </Text>
                <Pressable onPress={confirm} hitSlop={12}>
                  <Text className="font-semibold text-pink-500">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={handleChange}
                themeVariant={isDark ? 'dark' : 'light'}
                style={{ height: 220 }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

/** Default picker value: next half-hour slot. */
export function defaultReminderTime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 30 - (d.getMinutes() % 30), 0, 0);
  return d;
}
