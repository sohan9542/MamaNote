import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { PasswordInput } from '@components/PasswordInput';
import { Logo } from '@components/Logo';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { normalizeEmail, signInWithEmail } from '@lib/auth';
import { useAuthStore } from '@store/authStore';

export default function SignInScreen() {
  const router = useRouter();
  const setPendingVerificationEmail = useAuthStore((s) => s.setPendingVerificationEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmail(email, password);
    } catch (error) {
      const err = error as Error & { email?: string };
      if (err.message === 'EMAIL_NOT_CONFIRMED') {
        const normalized = normalizeEmail(err.email ?? email);
        setPendingVerificationEmail(normalized);
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: normalized },
        });
        return;
      }
      Alert.alert('Sign in failed', err.message);
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
            Mamanote
          </Text>
          <Text muted className="text-center">
            Gentle tracking for your little one.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl bg-white p-6 dark:bg-ink-700">
          <Text variant="title">Welcome back</Text>
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
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            autoComplete="password"
          />
          <View className="items-end">
            <Link href="/(auth)/forgot-password">
              <Text variant="caption" className="font-semibold text-pink-500">
                Forgot password?
              </Text>
            </Link>
          </View>
          <Button onPress={handleSubmit} loading={loading} size="lg" fullWidth>
            Sign in
          </Button>
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text muted>New to Mamanote?</Text>
          <Link href="/(auth)/sign-up">
            <Text className="font-semibold text-pink-500">Create account</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
