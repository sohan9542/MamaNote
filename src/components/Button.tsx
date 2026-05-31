import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { cn } from '@utils/cn';
import { FontFamily } from '@constants/fonts';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const CONTAINER: Record<Variant, string> = {
  primary:
    'bg-pink-400 active:bg-pink-500 dark:bg-pink-300 dark:active:bg-pink-400',
  secondary:
    'bg-lavender-200 active:bg-lavender-300 dark:bg-ink-600 dark:active:bg-ink-500',
  ghost:
    'bg-transparent active:bg-pink-100 dark:active:bg-ink-700',
  danger: 'bg-pink-500 active:bg-pink-600',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink-800 dark:text-ink-50',
  ghost: 'text-ink-800 dark:text-ink-50',
  danger: 'text-white',
};

const SIZE: Record<Size, string> = {
  sm: 'h-10 px-4 rounded-2xl',
  md: 'h-12 px-5 rounded-2xl',
  lg: 'h-14 px-6 rounded-3xl',
};

const LABEL_SIZE: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center gap-2',
        CONTAINER[variant],
        SIZE[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-60',
        className as string,
      )}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : '#322C44'} />
      ) : (
        <>
          {leftIcon}
          <Text
            className={cn(LABEL[variant], LABEL_SIZE[size])}
            style={{ fontFamily: FontFamily.semiBold }}
          >
            {children}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
});
