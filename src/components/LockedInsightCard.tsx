import { Pressable, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Text } from '@components/Text';

interface Props {
  title: string;
  description: string;
  onUpgrade: () => void;
}

export function LockedInsightCard({ title, description, onUpgrade }: Props) {
  return (
    <Pressable onPress={onUpgrade}>
      <Card tone="beige" className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-ink-600">
            <Lock size={18} color="#B45309" />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-bold">
              {title}
            </Text>
            <Text variant="caption" muted className="mt-1 leading-5">
              {description}
            </Text>
          </View>
        </View>
        <Button variant="secondary" size="sm" onPress={onUpgrade} fullWidth>
          Unlock with Plus
        </Button>
      </Card>
    </Pressable>
  );
}
