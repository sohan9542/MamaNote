import '../global.css';
import 'react-native-gesture-handler';

import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';

import { ThemeBridge } from '@components/ThemeBridge';
import { FreemiumUpgradeSheet } from '@components/FreemiumUpgradeSheet';
import { PaywallSheet } from '@components/PaywallSheet';
import { useAppFonts } from '@hooks/useAppFonts';
import { isEmailConfirmed } from '@lib/auth';
import {
  isCheckoutSuccessUrl,
  subscribeToAppState,
  subscribeToDeepLinks,
} from '@lib/subscription';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useSubscriptionStore } from '@store/subscriptionStore';
import { useMedicineReminderStore } from '@store/medicineReminderStore';
import { useThemeStore } from '@store/themeStore';
import { useTheme } from '@hooks/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* noop */
});

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const initialized = useAuthStore((s) => s.initialized);
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateAuth(), hydrateTheme()]);
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    })();
  }, [hydrateAuth, hydrateTheme, fontsLoaded]);

  if (!initialized || !fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedShell() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const pendingVerificationEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const pendingPasswordResetEmail = useAuthStore((s) => s.pendingPasswordResetEmail);
  const babies = useBabyStore((s) => s.babies);
  const babiesInitialized = useBabyStore((s) => s.babiesInitialized);
  const fetchBabies = useBabyStore((s) => s.fetchBabies);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);
  const hydrateMedicineReminders = useMedicineReminderStore((s) => s.hydrate);
  const medicineRemindersHydrated = useMedicineReminderStore((s) => s.hydrated);
  const initialized = useAuthStore((s) => s.initialized);
  const { isDark, colors } = useTheme();
  const paywallVisible = useSubscriptionStore((s) => s.paywallVisible);
  const upgradePromptVisible = useSubscriptionStore((s) => s.upgradePromptVisible);
  const hidePaywall = useSubscriptionStore((s) => s.hidePaywall);
  const hideUpgradePrompt = useSubscriptionStore((s) => s.hideUpgradePrompt);
  const showPaywall = useSubscriptionStore((s) => s.showPaywall);

  const onVerifyScreen = pathname.includes('verify-email');
  const onVerifyResetScreen = pathname.includes('verify-reset-password');
  const onResetPasswordScreen =
    pathname.includes('reset-password') && !pathname.includes('verify-reset');
  const onForgotPasswordScreen = pathname.includes('forgot-password');
  const onPasswordResetFlow =
    onForgotPasswordScreen || onVerifyResetScreen || onResetPasswordScreen;
  const onOnboarding = pathname.includes('onboarding');
  const onAuthScreen = pathname.includes('(auth)') || pathname.startsWith('/sign-');
  const isPublicShareView = /^\/share\/[^/]+$/.test(pathname);
  const emailConfirmed = isEmailConfirmed(user);
  const verifyEmail = pendingVerificationEmail ?? user?.email ?? '';

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  useEffect(() => {
    if (session && emailConfirmed) {
      fetchBabies();
      fetchSubscription();
      if (!medicineRemindersHydrated) {
        hydrateMedicineReminders();
      }
    }
  }, [
    session,
    emailConfirmed,
    fetchBabies,
    fetchSubscription,
    hydrateMedicineReminders,
    medicineRemindersHydrated,
  ]);

  useEffect(() => {
    if (!session || !emailConfirmed) return;

    const refreshEntitlement = () => {
      fetchSubscription();
    };

    const unsubDeepLink = subscribeToDeepLinks((url) => {
      if (isCheckoutSuccessUrl(url)) refreshEntitlement();
    });
    const unsubAppState = subscribeToAppState(refreshEntitlement);

    return () => {
      unsubDeepLink();
      unsubAppState();
    };
  }, [session, emailConfirmed, fetchSubscription]);

  useEffect(() => {
    if (!initialized) return;

    // Awaiting OTP after sign-up (no session yet)
    if (!session && pendingVerificationEmail && !onVerifyScreen) {
      router.replace(
        `/(auth)/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}` as const,
      );
      return;
    }

    // Password reset: awaiting recovery OTP
    if (
      pendingPasswordResetEmail &&
      !session &&
      !onVerifyResetScreen &&
      !onForgotPasswordScreen
    ) {
      router.replace(
        `/(auth)/verify-reset-password?email=${encodeURIComponent(pendingPasswordResetEmail)}` as const,
      );
      return;
    }

    // Password reset: OTP verified, must set new password
    if (
      pendingPasswordResetEmail &&
      session &&
      emailConfirmed &&
      !onResetPasswordScreen
    ) {
      router.replace(
        `/(auth)/reset-password?email=${encodeURIComponent(pendingPasswordResetEmail)}` as const,
      );
      return;
    }

    // Signed in but email not verified
    if (session && user && !emailConfirmed && !onVerifyScreen) {
      router.replace(
        `/(auth)/verify-email?email=${encodeURIComponent(verifyEmail)}` as const,
      );
      return;
    }

    // Not signed in and not on any auth / verify / public share screen
    if (
      !session &&
      !onAuthScreen &&
      !onVerifyScreen &&
      !onPasswordResetFlow &&
      !pendingVerificationEmail &&
      !pendingPasswordResetEmail &&
      !isPublicShareView
    ) {
      router.replace('/(auth)/sign-in');
      return;
    }

    // Verified user should leave auth screens (except password reset)
    if (session && emailConfirmed && onAuthScreen && !onPasswordResetFlow) {
      router.replace('/(tabs)');
      return;
    }

    // No baby profile yet → onboarding
    if (
      session &&
      emailConfirmed &&
      babiesInitialized &&
      babies.length === 0 &&
      !onOnboarding &&
      !onAuthScreen
    ) {
      router.replace('/onboarding');
      return;
    }

    if (session && emailConfirmed && babies.length > 0 && onOnboarding) {
      router.replace('/(tabs)');
    }
  }, [
    session,
    user,
    pendingVerificationEmail,
    pendingPasswordResetEmail,
    initialized,
    pathname,
    onVerifyScreen,
    onVerifyResetScreen,
    onResetPasswordScreen,
    onForgotPasswordScreen,
    onPasswordResetFlow,
    onAuthScreen,
    emailConfirmed,
    verifyEmail,
    babies,
    babiesInitialized,
    onOnboarding,
    isPublicShareView,
    router,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeBridge />
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="routine" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="share" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="whats-new" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="feedback" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="add-baby" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
      </Stack>
      <PaywallSheet
        visible={paywallVisible}
        onClose={hidePaywall}
        onSubscribed={fetchSubscription}
      />
      <FreemiumUpgradeSheet
        visible={upgradePromptVisible}
        onClose={hideUpgradePrompt}
        onUpgrade={() => {
          hideUpgradePrompt();
          showPaywall();
        }}
      />
    </View>
  );
}
