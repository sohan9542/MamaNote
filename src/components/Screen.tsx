import { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@utils/cn';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  contentClassName?: string;
}

export function Screen({
  children,
  scroll = false,
  className,
  contentClassName,
  scrollProps,
  ...rest
}: ScreenProps) {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className={cn('flex-1 bg-white dark:bg-ink-800', className)}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName={cn('px-5 pb-12 pt-2', contentClassName)}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={cn('flex-1 px-5 pt-2', contentClassName)} {...rest}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
