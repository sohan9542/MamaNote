import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button } from './Button';
import {
  DatePickerField,
  defaultBabyBirthDate,
  toBirthDateString,
} from './DatePickerField';
import { Input } from './Input';
import { Text } from './Text';

interface AddBabyFormProps {
  submitLabel?: string;
  onSubmit: (payload: { name: string; birthDate: string }) => Promise<void>;
}

export function AddBabyForm({
  submitLabel = 'Save baby',
  onSubmit,
}: AddBabyFormProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(defaultBabyBirthDate);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
      await onSubmit({
        name: name.trim(),
        birthDate: toBirthDateString(birthDate),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-4">
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
        {submitLabel}
      </Button>
    </View>
  );
}
