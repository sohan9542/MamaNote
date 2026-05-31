import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@hooks/useTheme';
import { FontFamily } from '@constants/fonts';

/** Visible tabs left → right. Log is hidden; FAB sits in the center slot. */
const TAB_ORDER = ['index', 'stats', 'profile'] as const;

const FAB_SIZE = 48;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const bottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  const navigateTo = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const renderTab = (routeName: (typeof TAB_ORDER)[number]) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return <View style={{ flex: 1 }} />;

    const index = state.routes.indexOf(route);
    const { options } = descriptors[route.key];
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : (options.title ?? route.name);
    const isFocused = state.index === index;
    const color = isFocused ? colors.tabBarActive : colors.tabBarInactive;
    const Icon = options.tabBarIcon;

    return (
      <Pressable
        onPress={() => navigateTo(routeName)}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={label}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 6,
        }}
      >
        {Icon ? Icon({ focused: isFocused, color, size: 24 }) : null}
        <Text
          style={{ fontSize: 11, fontWeight: '600', color, marginTop: 4, fontFamily: FontFamily.medium }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom,
        height: 68,
        borderRadius: 28,
        backgroundColor: colors.tabBar,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
        overflow: 'visible',
      }}
    >
      {renderTab('index')}

      {/* Center slot — FAB only, equal width to other tabs */}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.push('/(tabs)/log')}
          accessibilityRole="button"
          accessibilityLabel="Add log"
          style={{
            position: 'absolute',
            top: -(FAB_SIZE / 2) + 4,
            width: FAB_SIZE,
            height: FAB_SIZE,
            borderRadius: FAB_SIZE / 2,
            backgroundColor: colors.tabBarActive,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#FB7185',
            shadowOpacity: 0.45,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <Plus size={22} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      {renderTab('stats')}
      {renderTab('profile')}
    </View>
  );
}
