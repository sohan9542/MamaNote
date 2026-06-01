import { Pressable, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Text } from './Text';
import { COMPLIMENTARY_PLUS_DAYS, POST_TRIAL_DAILY_LOG_LIMIT } from '@constants/freemium';
import { useSubscriptionStore } from '@store/subscriptionStore';

export function TrialStatusBanner() {
  const isComplimentaryPremium = useSubscriptionStore((s) => s.isComplimentaryPremium);
  const isLimitedFree = useSubscriptionStore((s) => s.isLimitedFree);
  const daysLeft = useSubscriptionStore((s) => s.complimentaryDaysRemaining);
  const showPaywall = useSubscriptionStore((s) => s.showPaywall);

  if (!isComplimentaryPremium() && !isLimitedFree()) return null;

  if (isComplimentaryPremium()) {
    const days = daysLeft() ?? 0;
    return (
      <Pressable
        onPress={showPaywall}
        className="mb-4 flex-row gap-3 rounded-2xl bg-lavender-200 px-4 py-3 active:opacity-90 dark:bg-lavender-200/15"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-ink-700">
          <Sparkles size={18} color="#7C3AED" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center  gap-2">
            <Text variant="caption" className="shrink font-semibold">
              Your {COMPLIMENTARY_PLUS_DAYS}-day Plus trial
            </Text>
            <Text variant="caption" className="font-bold text-red-500 dark:text-red-400">
              Subscribe now
            </Text>
          </View>
          <Text variant="caption" muted className="mt-0.5">
            {days > 0
              ? `${days} day${days === 1 ? '' : 's'} left — full access, no card required`
              : 'Ends today — subscribe to keep Plus'}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={showPaywall}
      className="mb-4 rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 active:opacity-90 dark:border-ink-600 dark:bg-ink-700"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text variant="caption" className="shrink font-semibold">
          Your Plus trial has ended
        </Text>
        <Text variant="caption" className="font-bold text-red-500 dark:text-red-400">
          Upgrade now
        </Text>
      </View>
      <Text variant="caption" muted className="mt-0.5">
        View all past logs · {POST_TRIAL_DAILY_LOG_LIMIT} new logs per day · upgrade for everything
        else
      </Text>
    </Pressable>
  );
}
