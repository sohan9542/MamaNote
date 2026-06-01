import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CreditCard,
  HeartHandshake,
  LogOut,
  Moon,
  Shield,
  Sparkles,
} from 'lucide-react-native';

import { BabyManagerCard } from '@components/BabyManagerCard';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { PaywallSheet } from '@components/PaywallSheet';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { ThemeToggle } from '@components/ThemeToggle';
import { planLabel, statusLabel } from '@constants/subscription';
import { openBillingPortal } from '@lib/subscription';
import { useAuthStore } from '@store/authStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useTheme } from '@hooks/useTheme';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { colors } = useTheme();

  const entitlement = useSubscriptionStore((s) => s.entitlement);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const paywallVisible = useSubscriptionStore((s) => s.paywallVisible);
  const showPaywall = useSubscriptionStore((s) => s.showPaywall);
  const hidePaywall = useSubscriptionStore((s) => s.hidePaywall);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);

  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ?? 'MamaNote user';

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (e) {
      Alert.alert('Billing', (e as Error).message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text variant="display" className="mb-6 mt-2 font-display">
        Profile
      </Text>

      <Card tone="lavender" className="mb-6 flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-white">
          <Text className="text-2xl">👩‍🍼</Text>
        </View>
        <View className="flex-1">
          <Text variant="subtitle" className="font-semibold capitalize">
            {fullName}
          </Text>
          <Text muted variant="caption">
            {user?.email}
          </Text>
        </View>
      </Card>

      <Text variant="caption" muted className="mb-2 uppercase tracking-widest">
        Subscription
      </Text>
      <Card className="mb-6 gap-1 p-2">
        <Row
          icon={<Sparkles size={18} color={colors.warning} />}
          label="MamaNote Plus"
          right={
            <Text variant="caption" muted>
              {isPremium()
                ? `${statusLabel(entitlement?.status ?? 'free')} · ${planLabel(entitlement?.plan)}`
                : 'Free'}
            </Text>
          }
          onPress={isPremium() ? undefined : showPaywall}
        />
        {isPremium() ? (
          <Row
            icon={<CreditCard size={18} color={colors.primary} />}
            label={portalLoading ? 'Opening portal…' : 'Manage subscription'}
            onPress={portalLoading ? undefined : handleManageBilling}
          />
        ) : (
          <Pressable
            onPress={showPaywall}
            className="mx-3 mb-2 mt-1 rounded-2xl bg-lavender-200 px-4 py-3 dark:bg-lavender-200/15"
          >
            <Text variant="caption" className="font-semibold">
              Upgrade — unlimited logs, sharing & insights
            </Text>
            <Text variant="caption" muted className="mt-0.5">
              $39.99/yr with 7-day free trial
            </Text>
          </Pressable>
        )}
      </Card>

      <Text variant="caption" muted className="mb-2 uppercase tracking-widest">
        Your babies
      </Text>
      <BabyManagerCard />

      <Text variant="caption" muted className="mb-2 uppercase tracking-widest">
        Preferences
      </Text>
      <Card className="mb-6 gap-1 p-2">
        <Row
          icon={<Moon size={18} color={colors.primary} />}
          label="Dark mode"
          right={<ThemeToggle />}
        />
        <Row
          icon={<Bell size={18} color={colors.accent} />}
          label="Notifications"
          onPress={() => router.push('/notifications')}
        />
        <Row
          icon={<Shield size={18} color={colors.success} />}
          label="Privacy"
          onPress={() => router.push('/privacy')}
        />
      </Card>

      <Text variant="caption" muted className="mb-2 uppercase tracking-widest">
        About
      </Text>
      <Card className="mb-6 gap-1 p-2">
        <Row
          icon={<Sparkles size={18} color={colors.warning} />}
          label="What's new"
          onPress={() => router.push('/whats-new')}
        />
        <Row
          icon={<HeartHandshake size={18} color={colors.primary} />}
          label="Send feedback"
          onPress={() => router.push('/feedback')}
        />
      </Card>

      <Button
        variant="ghost"
        onPress={signOut}
        leftIcon={<LogOut size={18} color={colors.danger} />}
        className="mb-5 border border-pink-200 dark:border-ink-600"
      >
        Sign out
      </Button>

      <Text muted variant="caption" className="mt-6 text-center">
        MamaNote · v1.0.0
      </Text>

      <PaywallSheet
        visible={paywallVisible}
        onClose={hidePaywall}
        onSubscribed={fetchSubscription}
      />
    </Screen>
  );
}

function Row({
  icon,
  label,
  right,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:bg-pink-50 dark:active:bg-ink-600"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-pink-50 dark:bg-ink-600">
        {icon}
      </View>
      <Text className="flex-1 font-medium">{label}</Text>
      {right ?? <ChevronRight size={18} color="#A89FBE" />}
    </Pressable>
  );
}
