import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Sparkles } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { usePlusActivationPoll } from '@hooks/usePlusActivationPoll';
import { isEmailConfirmed } from '@lib/auth';
import { useAuthStore } from '@store/authStore';
import { useSubscriptionStore } from '@store/subscriptionStore';

export default function SubscribeSuccessScreen() {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const initialized = useAuthStore((s) => s.initialized);
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const emailConfirmed = isEmailConfirmed(user);
  const canPoll = Boolean(session && emailConfirmed);
  const { phase, refresh } = usePlusActivationPoll(canPoll);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!session) {
      router.replace('/(auth)/sign-in');
    }
  }, [initialized, session, router]);

  const handleContinue = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const title =
    phase === 'active'
      ? 'Plus is active'
      : phase === 'timeout'
        ? 'Still processing'
        : 'Payment successful';

  const subtitle =
    phase === 'active'
      ? 'Thank you for subscribing to MamaNote Plus.'
      : phase === 'timeout'
        ? 'Your payment went through. Plus may take a minute to activate — pull down to refresh.'
        : 'Payment successful — activating Plus…';

  return (
    <Screen
      scroll
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={phase === 'timeout' || phase === 'active'}
          />
        ),
      }}
      contentClassName="flex-grow justify-center pb-16"
    >
      <View className="items-center py-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-lavender-200 dark:bg-lavender-200/20">
          {phase === 'active' ? (
            <Check size={40} color="#7C3AED" />
          ) : (
            <Sparkles size={40} color="#7C3AED" />
          )}
        </View>

        <Text variant="display" className="mb-2 text-center font-bold">
          {title}
        </Text>
        <Text variant="body" muted className="mb-8 max-w-sm text-center leading-6">
          {subtitle}
        </Text>

        {phase === 'activating' ? (
          <ActivityIndicator size="large" color="#7C3AED" className="mb-8" />
        ) : null}

        {phase === 'active' || phase === 'timeout' ? (
          <Button fullWidth size="lg" onPress={handleContinue}>
            Continue
          </Button>
        ) : null}
      </View>

      {transactionId && __DEV__ ? (
        <Text variant="caption" muted className="mt-8 text-center text-xs">
          txn: {transactionId}
        </Text>
      ) : null}
    </Screen>
  );
}
