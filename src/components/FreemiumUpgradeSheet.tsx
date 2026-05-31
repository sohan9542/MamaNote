import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Sparkles, X } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
import { FREE_TIER_SUMMARY, PLUS_TIER_SUMMARY } from '@constants/freemium';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export function FreemiumUpgradeSheet({ visible, onClose, onUpgrade }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} />
        <View
          className="max-h-[92%] rounded-t-[28px] bg-white px-5 pt-3 dark:bg-ink-800"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="mb-4 items-center">
            <View className="mb-4 h-1 w-10 rounded-full bg-ink-200 dark:bg-ink-600" />
            <View className="w-full flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 dark:bg-pink-500/20">
                  <Sparkles size={24} color="#FB7185" />
                </View>
                <View className="flex-1 pr-2">
                  <Text variant="subtitle" className="font-bold">
                    You&apos;re on a roll
                  </Text>
                  <Text variant="caption" muted>
                    See what MamaNote Plus unlocks for your family
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
              >
                <X size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </View>

          <Card tone="lavender" className="mb-4 gap-2">
            <Text variant="caption" className="font-semibold uppercase tracking-widest text-lavender-700 dark:text-lavender-300">
              Plus includes
            </Text>
            {PLUS_TIER_SUMMARY.map((feature) => (
              <View key={feature} className="flex-row items-center gap-2">
                <Check size={16} color="#7C3AED" />
                <Text variant="caption">{feature}</Text>
              </View>
            ))}
          </Card>

          <Card className="mb-5 gap-2">
            <Text variant="caption" muted className="font-semibold uppercase tracking-widest">
              Free plan
            </Text>
            {FREE_TIER_SUMMARY.map((feature) => (
              <Text key={feature} variant="caption" muted>
                · {feature}
              </Text>
            ))}
          </Card>

          <Button onPress={onUpgrade} fullWidth size="lg">
            See MamaNote Plus
          </Button>
          <Button variant="ghost" onPress={onClose} fullWidth className="mt-2">
            Not now
          </Button>
        </View>
      </View>
    </Modal>
  );
}
