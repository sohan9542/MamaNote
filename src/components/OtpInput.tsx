import { useRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { Text } from './Text';
import { cn } from '@utils/cn';

const LENGTH = 6;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, error, disabled }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, LENGTH);
    onChange(cleaned);
  };

  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        disabled={disabled}
        className="flex-row justify-between gap-2"
      >
        {digits.map((digit, index) => {
          const filled = digit.trim() !== '';
          const active = index === value.length;
          return (
            <View
              key={index}
              className={cn(
                'h-14 flex-1 items-center justify-center rounded-2xl border-2 bg-white dark:bg-ink-700',
                error
                  ? 'border-pink-500'
                  : active
                    ? 'border-pink-400 dark:border-pink-300'
                    : filled
                      ? 'border-lavender-300 dark:border-lavender-400'
                      : 'border-ink-100 dark:border-ink-600',
              )}
            >
              <Text variant="title" className="text-2xl font-semibold">
                {filled ? digit : ''}
              </Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={LENGTH}
        editable={!disabled}
        caretHidden
        className="absolute h-0 w-0 opacity-0"
        accessibilityLabel="6-digit verification code"
      />

      {error ? (
        <Text variant="caption" className="mt-2 text-center text-pink-500">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
