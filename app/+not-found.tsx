import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@components/Text';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <View className="flex-1 items-center justify-center gap-4 bg-pink-50 px-6 dark:bg-ink-800">
        <Text variant="title">This page doesn’t exist.</Text>
        <Link href="/" className="text-pink-500 underline">
          Go home
        </Link>
      </View>
    </>
  );
}
