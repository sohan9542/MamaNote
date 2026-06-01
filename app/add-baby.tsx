import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AddBabyForm } from '@components/AddBabyForm';
import { Screen } from '@components/Screen';
import { ScreenBackHeader } from '@components/ScreenBackHeader';
import { Text } from '@components/Text';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { handleFreemiumError } from '@utils/freemiumError';

export default function AddBabyScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createBaby = useBabyStore((s) => s.createBaby);
  const babies = useBabyStore((s) => s.babies);

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
      Alert.alert(
        'Baby added',
        `${name} is now active. All logs and stats will show for this profile.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      if (handleFreemiumError(error)) return;
      Alert.alert('Could not add baby', (error as Error).message);
    }
  };

  return (
    <Screen scroll contentClassName="pb-10">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScreenBackHeader
          title="Add baby"
          subtitle={
            babies.length === 0
              ? 'Create your first baby profile'
              : 'MamaNote Plus supports multiple profiles'
          }
        />

        <View className="rounded-3xl border border-ink-100/60 bg-white p-6 dark:border-ink-600 dark:bg-ink-700">
          <AddBabyForm submitLabel="Add baby" onSubmit={handleSubmit} />
        </View>

        <Text muted variant="caption" className="mt-6 text-center leading-5">
          Switch between babies anytime from Home or Profile. Each baby has separate logs,
          stats, and reminders.
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}
