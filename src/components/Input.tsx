import { forwardRef, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { FontFamily } from '@constants/fonts';
import { cn } from '@utils/cn';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, leftIcon, rightIcon, containerClassName, className, ...rest },
  ref,
) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text variant="caption" weight="medium" className="mb-2 text-ink-500 dark:text-ink-200">
          {label}
        </Text>
      )}
      <View
        className={cn(
          'flex-row items-center gap-2 rounded-2xl border bg-white px-4 dark:bg-ink-700',
          error
            ? 'border-pink-500'
            : 'border-ink-100 dark:border-ink-600',
        )}
      >
        {leftIcon}
        <TextInput
          ref={ref}
          placeholderTextColor="#A89FBE"
          className={cn(
            'flex-1 py-3.5 text-base text-ink-800 dark:text-ink-50',
            className as string,
          )}
          style={{ fontFamily: FontFamily.regular }}
          {...rest}
        />
        {rightIcon}
      </View>
      {error && (
        <Text variant="caption" className="mt-1.5 text-pink-500">
          {error}
        </Text>
      )}
    </View>
  );
});
