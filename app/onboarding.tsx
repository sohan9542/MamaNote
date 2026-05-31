import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@components/Button';
import { Logo } from '@components/Logo';
import {
  DatePickerField,
  defaultBabyBirthDate,
  toBirthDateString,
} from '@components/DatePickerField';
import { Input } from '@components/Input';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { useAuthStore } from '@store/authStore';
import { handleFreemiumError } from '@utils/freemiumError';
import { useBabyStore } from '@store/babyStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const createBaby = useBabyStore((s) => s.createBaby);

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(defaultBabyBirthDate);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.replace('/(auth)/sign-in');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Baby name', 'What should we call your little one?');
      return;
    }
    if (birthDate > new Date()) {
      Alert.alert('Date of birth', 'Birth date cannot be in the future.');
      return;
    }

    try {
      setLoading(true);
      await createBaby({
        userId: user.id,
        name: name.trim(),
        birthDate: toBirthDateString(birthDate),
      });
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Could not save', handleFreemiumError(error));
    } finally {
      setLoading(false);
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
          <Input
            label="Baby's name"
            placeholder="Olivia"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <DatePickerField
            label="Date of birth"
            value={birthDate}
            onChange={setBirthDate}
            maximumDate={new Date()}
          />
          <Text variant="caption" muted>
            Tap the date to open the calendar picker.
          </Text>
          <Button onPress={handleSubmit} loading={loading} size="lg" fullWidth>
            Continue to home
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
