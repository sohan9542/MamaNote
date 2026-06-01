import { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Sparkles, X } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Text } from '@components/Text';
import {
  PLANS,
  PLUS_FEATURES,
  planCheckoutCta,
  planCheckoutFootnote,
  type SubscriptionPlan,
} from '@constants/subscription';
import {
  openCheckout,
  requiresExternalPurchaseDisclosure,
} from '@lib/subscription';
import { cn } from '@utils/cn';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubscribed?: () => void;
}

export function PaywallSheet({ visible, onClose, onSubscribed }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');
  const [loading, setLoading] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setError(null);
    if (requiresExternalPurchaseDisclosure() && !showDisclosure) {
      setShowDisclosure(true);
      return;
    }
    setLoading(true);
    try {
      const completed = await openCheckout(selectedPlan);
      if (completed) {
        onSubscribed?.();
        onClose();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

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
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-lavender-200 dark:bg-lavender-200/20">
                  <Sparkles size={24} color="#7C3AED" />
                </View>
                <View>
                  <Text variant="subtitle" className="font-bold">
                    MamaNote Plus
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

          <View className="mb-4 gap-2">
            {PLUS_FEATURES.map((feature) => (
              <View key={feature} className="flex-row items-center gap-2">
                <Check size={16} color="#7C3AED" />
                <Text variant="caption">{feature}</Text>
              </View>
            ))}
          </View>

          <View className="mb-4 gap-2">
            {PLANS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <Pressable key={plan.id} onPress={() => setSelectedPlan(plan.id)}>
                  <Card
                    tone={selected ? 'lavender' : 'default'}
                    className={cn(
                      'flex-row items-center justify-between py-4',
                      selected && 'border-lavender-400',
                    )}
                  >
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold">{plan.label}</Text>
                        {plan.badge ? (
                          <View className="rounded-full bg-lavender-300/50 px-2 py-0.5">
                            <Text variant="caption" className="text-xs font-semibold text-lavender-700">
                              {plan.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="caption" muted>
                        {plan.sublabel}
                      </Text>
                    </View>
                    <Text className="font-bold">{plan.price}</Text>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          {showDisclosure && Platform.OS === 'ios' ? (
            <Card tone="beige" className="mb-4">
              <Text variant="caption" muted className="leading-5">
                You are about to leave the app to complete your purchase on our
                website. Apple is not responsible for the privacy or security of
                payments made on external websites.
              </Text>
            </Card>
          ) : null}

          {error ? (
            <Text variant="caption" className="mb-3 text-pink-500">
              {error}
            </Text>
          ) : null}

          <Button onPress={handleSubscribe} loading={loading} fullWidth size="lg">
            {planCheckoutCta(selectedPlan)}
          </Button>

          <Text variant="caption" muted className="mt-3 text-center leading-5">
            {planCheckoutFootnote(selectedPlan)}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
