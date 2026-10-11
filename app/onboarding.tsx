import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AddBabyForm } from '@components/AddBabyForm';
import { Logo } from '@components/Logo';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { handleFreemiumError } from '@utils/plusUpgrade';

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createBaby = useBabyStore((s) => s.createBaby);

  const handleSubmit = async ({ name, birthDate }: { name: string; birthDate: string }) => {
    if (!user) {
      router.replace('/(auth)/sign-in');
      return;
    }

    try {
      await createBaby({
        userId: user.id,
        name,
        birthDate,
      });
      router.replace('/(tabs)');
    } catch (error) {
      if (handleFreemiumError(error)) return;
      Alert.alert('Could not save', (error as Error).message);
    }
  };

  return (
    <Screen scroll contentClassName="pt-10">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="mb-8 items-center gap-3">
          <Logo size={80} />
          <Text variant="display" className="text-center font-display">
            Meet your baby
          </Text>
          <Text muted className="max-w-xs text-center leading-6">
            Add your baby&apos;s name and birthday so we can track age and activities for you.
          </Text>
        </View>

        <View className="gap-4 rounded-3xl border border-ink-100/60 bg-white p-6 dark:border-ink-600 dark:bg-ink-700">
          <AddBabyForm submitLabel="Continue to home" onSubmit={handleSubmit} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
