import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail, User } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Input } from '@components/Input';
import { PasswordInput } from '@components/PasswordInput';
import { Logo } from '@components/Logo';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { isEmailConfirmed, normalizeEmail, signUpWithEmail } from '@lib/auth';
import { useAuthStore } from '@store/authStore';

export default function SignUpScreen() {
  const router = useRouter();
  const setPendingVerificationEmail = useAuthStore((s) => s.setPendingVerificationEmail);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const goToVerify = (normalized: string) => {
    setPendingVerificationEmail(normalized);
    router.replace(
      `/(auth)/verify-email?email=${encodeURIComponent(normalized)}` as const,
    );
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please complete the form to continue.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      const normalized = normalizeEmail(email);

      // Set before signUp sign-out so the root guard knows we're in the OTP flow
      setPendingVerificationEmail(normalized);

      const { user, needsEmailVerification } = await signUpWithEmail(
        normalized,
        password,
        name,
      );

      if (!needsEmailVerification && isEmailConfirmed(user)) {
        setPendingVerificationEmail(null);
        Alert.alert(
          'Account ready',
          'Your email is already confirmed. You can sign in now.',
        );
        router.replace('/(auth)/sign-in');
        return;
      }

      goToVerify(normalized);
    } catch (error) {
      useAuthStore.getState().setPendingVerificationEmail(null);
      Alert.alert('Sign up failed', (error as Error).message);
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
            Create account
          </Text>
          <Text muted className="text-center">
            Track every precious moment, beautifully.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl bg-white p-6 dark:bg-ink-700">
          <Input
            label="Your name"
            placeholder="Maria"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={18} color="#A89FBE" />}
          />
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
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />
          <Button onPress={handleSubmit} loading={loading} size="lg" fullWidth>
            Create account
          </Button>
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text muted>Already with us?</Text>
          <Link href="/(auth)/sign-in">
            <Text className="font-semibold text-pink-500">Sign in</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
