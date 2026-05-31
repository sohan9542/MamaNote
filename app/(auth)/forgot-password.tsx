import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { Logo } from '@components/Logo';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { normalizeEmail, resetPassword } from '@lib/auth';
import { useAuthStore } from '@store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const setPendingPasswordResetEmail = useAuthStore((s) => s.setPendingPasswordResetEmail);

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Enter the email for your account.');
      return;
    }
    const normalized = normalizeEmail(email);
    try {
      setLoading(true);
      await resetPassword(normalized);
      setPendingPasswordResetEmail(normalized);
      router.replace({
        pathname: '/(auth)/verify-reset-password',
        params: { email: normalized },
      });
    } catch (error) {
      Alert.alert('Could not send code', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentClassName="pt-12">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="mb-8 items-center gap-2">
          <Logo size={96} className="rounded-[20px]" />
          <Text variant="display" className="font-display">
            Forgot password
          </Text>
          <Text muted className="text-center">
            Enter your email and we&apos;ll send a 6-digit code to reset your password.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl bg-white p-6 dark:bg-ink-700">
          <Input
            label="Email"
            placeholder="hello@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={18} color="#A89FBE" />}
          />
          <Button onPress={handleSubmit} loading={loading} size="lg" fullWidth>
            Send reset code
          </Button>
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text muted>Remember your password?</Text>
          <Link href="/(auth)/sign-in" replace>
            <Text className="font-semibold text-pink-500">Sign in</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
