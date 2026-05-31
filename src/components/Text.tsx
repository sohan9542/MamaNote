import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { FontFamily, type FontWeightKey } from '@constants/fonts';
import { cn } from '@utils/cn';

type Variant = 'display' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

const VARIANTS: Record<Variant, string> = {
  display: 'text-4xl tracking-tight',
  title: 'text-2xl tracking-tight',
  subtitle: 'text-lg',
  body: 'text-base leading-6',
  caption: 'text-sm leading-5',
  label: 'text-xs uppercase tracking-widest',
};

const VARIANT_FONT: Record<Variant, string> = {
  display: FontFamily.bold,
  title: FontFamily.semiBold,
  subtitle: FontFamily.medium,
  body: FontFamily.regular,
  caption: FontFamily.regular,
  label: FontFamily.medium,
};

interface TextProps extends RNTextProps {
  variant?: Variant;
  weight?: FontWeightKey;
  muted?: boolean;
}

export function Text({
  variant = 'body',
  weight,
  muted,
  className,
  style,
  ...rest
}: TextProps) {
  const fontFamily = weight ? FontFamily[weight] : VARIANT_FONT[variant];

  return (
    <RNText
      className={cn(
        VARIANTS[variant],
        muted ? 'text-ink-400 dark:text-ink-300' : 'text-ink-800 dark:text-ink-50',
        className,
      )}
      style={[{ fontFamily }, style as TextStyle]}
      {...rest}
    />
  );
}
