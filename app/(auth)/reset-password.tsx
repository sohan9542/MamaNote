import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { Button } from '@components/Button';
import { PasswordInput } from '@components/PasswordInput';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { normalizeEmail, updatePassword } from '@lib/auth';
import { useAuthStore } from '@store/authStore';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const session = useAuthStore((s) => s.session);
  const pendingEmail = useAuthStore((s) => s.pendingPasswordResetEmail);
  const setPendingPasswordResetEmail = useAuthStore((s) => s.setPendingPasswordResetEmail);
  const signOut = useAuthStore((s) => s.signOut);

  const email = normalizeEmail(
    (typeof params.email === 'string' ? params.email : '') || pendingEmail || '',
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session || !pendingEmail) {
      router.replace('/(auth)/forgot-password');
    }
  }, [session, pendingEmail, router]);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Missing info', 'Please enter and confirm your new password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Make sure both fields match.');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(password);
      setPendingPasswordResetEmail(null);
      await signOut();
      Alert.alert('Password updated', 'You can now sign in with your new password.', [
        {
          text: 'Sign in',
          onPress: () => router.replace('/(auth)/sign-in'),
        },
      ]);
    } catch (error) {
      Alert.alert('Could not update password', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!session || !pendingEmail) {
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
            <Lock size={32} color="#FB7185" />
          </View>
          <Text variant="display" className="text-center font-display">
            New password
          </Text>
          <Text muted className="text-center leading-6">
            Choose a new password for{'\n'}
            <Text className="font-semibold text-ink-800 dark:text-ink-50">{email}</Text>
          </Text>
        </View>

        <View className="gap-4 rounded-3xl bg-white p-6 dark:bg-ink-700">
          <PasswordInput
            label="New password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm password"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoComplete="new-password"
          />
          <Button onPress={handleSubmit} loading={loading} size="lg" fullWidth>
            Save new password
          </Button>
        </View>

        <View className="mt-6 flex-row items-center justify-center gap-1">
          <Text muted>Back to</Text>
          <Link href="/(auth)/sign-in" replace>
            <Text className="font-semibold text-pink-500">Sign in</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
