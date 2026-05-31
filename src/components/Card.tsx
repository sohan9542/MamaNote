import { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@utils/cn';

interface CardProps extends ViewProps {
  children: ReactNode;
  tone?: 'default' | 'pink' | 'mint' | 'lavender' | 'beige';
}

const TONES: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-white dark:bg-ink-700',
  pink: 'bg-pink-100 dark:bg-ink-700',
  mint: 'bg-mint-100 dark:bg-ink-700',
  lavender: 'bg-lavender-100 dark:bg-ink-700',
  beige: 'bg-beige-100 dark:bg-ink-700',
};

export function Card({ children, tone = 'default', className, ...rest }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-3xl p-5 border border-ink-100/40 dark:border-ink-600/60',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
