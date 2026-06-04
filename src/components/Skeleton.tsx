import { useEffect, useRef } from 'react';
import { Animated, type ViewStyle } from 'react-native';

import { cn } from '@utils/cn';

interface Props {
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ className, style }: Props) {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={cn('rounded-2xl bg-ink-100 dark:bg-ink-600', className)}
      style={[{ opacity }, style]}
    />
  );
}
