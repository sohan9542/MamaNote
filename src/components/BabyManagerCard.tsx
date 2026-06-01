import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';

import { Card } from '@components/Card';
import { Text } from '@components/Text';
import { FREE_BABY_LIMIT } from '@constants/freemium';
import { useBabyStore } from '@store/babyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { babyAge } from '@utils/date';
import { PLUS_MESSAGES, promptPlusUpgrade } from '@utils/plusUpgrade';
import { useTheme } from '@hooks/useTheme';

export function BabyManagerCard() {
  const router = useRouter();
  const { colors } = useTheme();
  const babies = useBabyStore((s) => s.babies);
  const activeBabyId = useBabyStore((s) => s.activeBabyId);
  const selectBaby = useBabyStore((s) => s.selectBaby);
  const isPremium = useSubscriptionStore((s) => s.isPremium);

  const handleAdd = () => {
    if (!isPremium() && babies.length >= FREE_BABY_LIMIT) {
      promptPlusUpgrade(PLUS_MESSAGES.addBaby);
      return;
    }
    router.push('/add-baby');
  };

  return (
    <Card className="mb-6 gap-1 p-2">
      {babies.map((baby) => {
        const active = baby.id === activeBabyId;
        return (
          <Pressable
            key={baby.id}
            onPress={() => selectBaby(baby.id)}
            className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-pink-50 dark:active:bg-ink-600"
          >
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-pink-50 dark:bg-ink-600">
              <Text>{active ? '👶' : '🍼'}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-medium">{baby.name}</Text>
              <Text variant="caption" muted>
                {babyAge(baby.birth_date)} old
              </Text>
            </View>
            {active ? <Check size={18} color={colors.primary} /> : null}
          </Pressable>
        );
      })}

      <Pressable
        onPress={handleAdd}
        className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-pink-50 dark:active:bg-ink-600"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-lavender-100 dark:bg-ink-600">
          <Plus size={18} color={colors.accent} />
        </View>
        <View className="flex-1">
          <Text className="font-medium">Add another baby</Text>
          <Text variant="caption" muted>
            {isPremium() ? 'Included with Plus' : 'Requires MamaNote Plus'}
          </Text>
        </View>
      </Pressable>
    </Card>
  );
}
