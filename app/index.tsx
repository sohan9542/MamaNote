import { Redirect } from 'expo-router';

import { isEmailConfirmed } from '@lib/auth';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const pendingVerificationEmail = useAuthStore((s) => s.pendingVerificationEmail);
  const pendingPasswordResetEmail = useAuthStore((s) => s.pendingPasswordResetEmail);
  const babies = useBabyStore((s) => s.babies);
  const babiesInitialized = useBabyStore((s) => s.babiesInitialized);

  if (session && user && isEmailConfirmed(user)) {
    if (babiesInitialized && babies.length === 0) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(tabs)" />;
  }

  if (session && user && !isEmailConfirmed(user)) {
    return (
      <Redirect
        href={`/(auth)/verify-email?email=${encodeURIComponent(user.email ?? '')}`}
      />
    );
  }

  if (pendingVerificationEmail) {
    return (
      <Redirect
        href={`/(auth)/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}`}
      />
    );
  }

  if (pendingPasswordResetEmail) {
    if (session) {
      return (
        <Redirect
          href={`/(auth)/reset-password?email=${encodeURIComponent(pendingPasswordResetEmail)}`}
        />
      );
    }
    return (
      <Redirect
        href={`/(auth)/verify-reset-password?email=${encodeURIComponent(pendingPasswordResetEmail)}`}
      />
    );
  }

  return <Redirect href="/(auth)/sign-in" />;
}
