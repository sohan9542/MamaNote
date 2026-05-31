import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Text } from './Text';

interface ScreenBackHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenBackHeader({ title, subtitle }: ScreenBackHeaderProps) {
  const router = useRouter();

  return (
    <View className="mb-6 flex-row items-center gap-3">
      <Pressable
        onPress={() => router.back()}
        className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
        accessibilityLabel="Go back"
      >
        <ChevronLeft size={22} color="#FB7185" />
      </Pressable>
      <View className="flex-1">
        <Text variant="display" className="font-display">
          {title}
        </Text>
        {subtitle ? (
          <Text muted variant="caption">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
