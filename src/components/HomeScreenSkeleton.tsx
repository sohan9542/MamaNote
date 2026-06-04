import { ScrollView, View } from 'react-native';

import { Skeleton } from '@components/Skeleton';
import { Text } from '@components/Text';
import { HOME_ACTIVITIES } from '@constants/activities';

export function TrialBannerSkeleton() {
  return <Skeleton className="mb-4 h-[72px] w-full rounded-2xl" />;
}

export function HomeScreenSkeleton() {
  return (
    <View>
      <Skeleton className="mb-3 h-10 w-32 rounded-full" />
      <Skeleton className="mb-6 h-[120px] w-full rounded-3xl" />

      <View className="mb-6 flex-row gap-3">
        <Skeleton className="h-[108px] flex-1 rounded-3xl" />
        <Skeleton className="h-[108px] flex-1 rounded-3xl" />
      </View>

      <View className="mb-3 flex-row items-center justify-between">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-4 w-14 rounded-md" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerClassName="gap-0 pr-4"
      >
        {HOME_ACTIVITIES.map((activity) => (
          <Skeleton
            key={activity.id}
            className="mr-3 h-[124px] w-[108px] rounded-3xl"
          />
        ))}
      </ScrollView>

      <View className="mb-3 flex-row items-center justify-between">
        <Text variant="subtitle" className="font-bold">
          Recent activities
        </Text>
        <Skeleton className="h-4 w-12 rounded-md" />
      </View>

      <View className="gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-3xl" />
        ))}
      </View>
    </View>
  );
}
