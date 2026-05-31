import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Moon, Sun } from 'lucide-react-native';
import { useEffect } from 'react';

import { useTheme } from '@hooks/useTheme';

const TRACK_WIDTH = 64;
const TRACK_HEIGHT = 34;
const THUMB_SIZE = 28;

export function ThemeToggle() {
  const { isDark, toggle, colors } = useTheme();
  const offset = useSharedValue(isDark ? TRACK_WIDTH - THUMB_SIZE - 4 : 2);

  useEffect(() => {
    offset.value = withSpring(isDark ? TRACK_WIDTH - THUMB_SIZE - 4 : 2, {
      damping: 14,
      stiffness: 180,
    });
  }, [isDark, offset]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Pressable onPress={toggle} hitSlop={8}>
      <View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          backgroundColor: isDark ? colors.surfaceElevated : colors.primarySoft,
        }}
        className="justify-center rounded-full"
      >
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              backgroundColor: colors.surface,
            },
            thumbStyle,
          ]}
          className="items-center justify-center rounded-full shadow"
        >
          {isDark ? (
            <Moon size={16} color={colors.primary} />
          ) : (
            <Sun size={16} color={colors.primary} />
          )}
        </Animated.View>
      </View>
    </Pressable>
  );
}
