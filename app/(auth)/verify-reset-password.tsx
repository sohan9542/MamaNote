import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';

import { Button } from '@components/Button';
import { OtpInput } from '@components/OtpInput';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { normalizeEmail, resendRecoveryOtp, verifyRecoveryOtp } from '@lib/auth';
import { useAuthStore } from '@store/authStore';

const RESEND_COOLDOWN_SEC = 60;

export default function VerifyResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const pendingEmail = useAuthStore((s) => s.pendingPasswordResetEmail);
  const setPendingPasswordResetEmail = useAuthStore((s) => s.setPendingPasswordResetEmail);

  const email = normalizeEmail(
    (typeof params.email === 'string' ? params.email : '') || pendingEmail || '',
  );

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = useCallback(async () => {
    if (!email) return;
    if (code.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const { session } = await verifyRecoveryOtp(email, code);
      if (session) {
        setSession(session);
        setPendingPasswordResetEmail(email);
        router.replace({
          pathname: '/(auth)/reset-password',
          params: { email },
        });
      } else {
        setError('Verification succeeded but no session was returned. Try again.');
      }
    } catch (err) {
      const message = (err as Error).message;
      if (message.toLowerCase().includes('expired')) {
        setError('Code expired. Tap resend for a new one.');
      } else if (message.toLowerCase().includes('invalid')) {
        setError('Invalid code. Check your email and try again.');
      } else {
        setError(message);
      }
    } finally {
      setVerifying(false);
    }
  }, [code, email, router, setPendingPasswordResetEmail, setSession]);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setError('');
    try {
      await resendRecoveryOtp(email);
      setCooldown(RESEND_COOLDOWN_SEC);
      Alert.alert('Code sent', `A new 6-digit code was sent to ${email}.`);
    } catch (err) {
      Alert.alert('Could not resend', (err as Error).message);
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <Screen scroll contentClassName="pt-12">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="mb-8 items-center gap-2">
          <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-pink-100 dark:bg-ink-600">
            <Mail size={32} color="#FB7185" />
          </View>
          <Text variant="display" className="text-center font-display">
            Check your email
          </Text>
          <Text muted className="text-center leading-6">
            We sent a 6-digit reset code to{'\n'}
            <Text className="font-semibold text-ink-800 dark:text-ink-50">{email}</Text>
          </Text>
        </View>

        <View className="gap-6 rounded-3xl bg-white p-6 dark:bg-ink-700">
          <Text variant="subtitle" className="text-center">
            Enter reset code
          </Text>

          <OtpInput value={code} onChange={setCode} error={error} disabled={verifying} />

          <Button onPress={handleVerify} loading={verifying} size="lg" fullWidth>
            Verify code
          </Button>

          <View className="items-center gap-2">
            <Text variant="caption" muted>
              Didn&apos;t get the code?
            </Text>
            <Pressable
              onPress={handleResend}
              disabled={resending || cooldown > 0}
              className="active:opacity-70"
            >
              <Text
                variant="caption"
                className={
                  cooldown > 0
                    ? 'text-ink-400'
                    : 'font-semibold text-pink-500 dark:text-pink-300'
                }
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text muted>Wrong email?</Text>
          <Link href="/(auth)/forgot-password" replace>
            <Text className="font-semibold text-pink-500">Try again</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
