import { Pressable, View } from 'react-native';
import { ChevronRight, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Text } from './Text';
import { useTheme } from '@hooks/useTheme';
import { PLUS_MESSAGES, requirePlus } from '@utils/plusUpgrade';

export function FeatureHubCards() {
  const router = useRouter();
  const { isDark } = useTheme();

  const openGrowth = () => {
    if (!requirePlus(PLUS_MESSAGES.growthSkills)) return;
    router.push('/growth-skills');
  };

  const openSleep = () => {
    if (!requirePlus(PLUS_MESSAGES.sleepHub)) return;
    router.push('/sleep');
  };

  return (
    <View className="mb-6 flex-row gap-3">
      <Pressable
        onPress={openGrowth}
        className="flex-1 overflow-hidden rounded-3xl active:opacity-90"
        style={{
          backgroundColor: isDark ? '#6D28D9' : '#8B5CF6',
          minHeight: 108,
        }}
      >
        <Text className="absolute right-3 top-3 text-lg opacity-25">✨</Text>
        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Text className="text-xl">🧸</Text>
            </View>
            <ChevronRight size={18} color="#EDE9FE" />
          </View>
          <View className="mt-4">
            <Text className="text-base font-bold leading-5 text-white">Growth & Skills</Text>
            <Text className="text-sm leading-4 text-violet-100">Superpowers</Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={openSleep}
        className="flex-1 overflow-hidden rounded-3xl active:opacity-90"
        style={{
          backgroundColor: isDark ? '#312E81' : '#6366F1',
          minHeight: 108,
        }}
      >
        <Text className="absolute right-3 top-3 text-lg opacity-25">💤</Text>
        <View className="flex-1 p-4">
          <View className="flex-row items-center justify-between">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Moon size={24} color="#E0E7FF" />
            </View>
            <ChevronRight size={18} color="#E0E7FF" />
          </View>
          <View className="mt-4">
            <Text className="text-base font-bold leading-5 text-white">Sleep</Text>
            <Text className="text-sm font-medium leading-4 text-white">Timer & schedule</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
