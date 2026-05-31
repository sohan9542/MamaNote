import { View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { Card } from '@components/Card';
import { Screen } from '@components/Screen';
import { ScreenBackHeader } from '@components/ScreenBackHeader';
import { Text } from '@components/Text';
import { CHANGELOG } from '@constants/changelog';
import { useTheme } from '@hooks/useTheme';

export default function WhatsNewScreen() {
  const { colors } = useTheme();

  return (
    <Screen scroll contentClassName="pb-10">
      <ScreenBackHeader
        title="What's new"
        subtitle="Latest updates in Mamanote"
      />

      <View className="gap-5">
        {CHANGELOG.map((release) => (
          <Card key={release.version} tone="lavender" className="gap-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-ink-600">
                <Sparkles size={20} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text variant="subtitle" className="font-semibold">
                  {release.title}
                </Text>
                <Text muted variant="caption">
                  v{release.version} · {release.date}
                </Text>
              </View>
            </View>

            <View className="gap-3">
              {release.highlights.map((item) => (
                <View key={item} className="flex-row gap-3">
                  <Text className="text-pink-400">•</Text>
                  <Text className="flex-1 leading-6">{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))}
      </View>

      <Text muted variant="caption" className="mt-8 text-center">
        More updates coming soon. Thanks for being an early parent on Mamanote.
      </Text>
    </Screen>
  );
}
