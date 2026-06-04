import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from './Text';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@utils/cn';
import { timeSinceLabel } from '@utils/date';

interface Props {
  label: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  lastAt?: string | null;
  todayCount?: number;
  onPress?: () => void;
  /** `grid` = two columns on home; `scroll` = horizontal carousel (default). */
  layout?: 'scroll' | 'grid';
}

export function ActivityCard({
  label,
  icon: Icon,
  bg,
  iconColor,
  lastAt,
  todayCount = 0,
  onPress,
  layout = 'scroll',
}: Props) {
  const { isDark } = useTheme();
  const ago = timeSinceLabel(lastAt);

  return (
    <Pressable
      onPress={onPress}
      style={
        isDark
          ? {
              backgroundColor: `${iconColor}18`,
              borderColor: `${iconColor}35`,
              borderWidth: 1,
            }
          : { backgroundColor: bg }
      }
      className={cn(
        'min-h-[125px] items-center justify-between rounded-3xl px-2.5 pb-3.5 pt-3 active:opacity-85',
        layout === 'scroll' && 'mr-3 w-[112px]',
        layout === 'grid' && 'min-w-[47%] flex-1',
        !isDark && 'border border-transparent',
      )}
    >
      <View className="relative">
        <View
          className={cn(
            'h-14 w-14 items-center justify-center rounded-2xl',
            isDark ? 'bg-ink-800/90' : 'bg-white/90',
          )}
        >
          <Icon size={28} color={iconColor} strokeWidth={2} />
        </View>
        {todayCount > 0 ? (
          <View
            className={cn(
              'absolute -right-1 -top-1 min-h-[18px] min-w-[18px] items-center justify-center rounded-full px-1',
              isDark ? 'border border-ink-600 bg-ink-700' : 'bg-white',
            )}
          >
            <Text className="text-[10px] font-bold" style={{ color: iconColor }}>
              {todayCount}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="w-full items-center -top-3 px-0.5">
        <Text
          variant="caption"
          weight="semiBold"
          className="text-center text-[12px] leading-[16px] text-ink-800 dark:text-ink-50"
          numberOfLines={2}
        >
          {label}
        </Text>
        {ago ? (
          <Text
            variant="caption"
            className="mt-1 text-center text-[10px] leading-[14px] text-ink-500 dark:text-ink-300"
            numberOfLines={2}
          >
            {ago}
          </Text>
        ) : (
          <Text
            variant="caption"
            className="mt-1 text-center text-[10px] leading-[14px] text-ink-400 dark:text-ink-400"
          >
            No log
          </Text>
        )}
      </View>
    </Pressable>
  );
}
