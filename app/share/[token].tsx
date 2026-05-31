import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Share2 } from 'lucide-react-native';
import { format, formatDistanceToNow } from 'date-fns';

import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import { getActivityById } from '@constants/activities';
import { fetchSharedActivities } from '@lib/share';
import type { SharedActivityPayload } from '@app-types/share';
import { formatDate, formatTime } from '@utils/date';

export default function SharedActivitiesScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [payload, setPayload] = useState<SharedActivityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || typeof token !== 'string') {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSharedActivities(token);
      setPayload(data);
    } catch (err) {
      setPayload(null);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen scroll contentClassName="pb-10">
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(auth)/sign-in')
          }
          className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
        >
          <ChevronLeft size={22} color="#9CA3AF" />
        </Pressable>
        <View className="flex-1">
          <Text variant="subtitle" className="font-bold">
            Shared activity log
          </Text>
          <Text variant="caption" muted>
            Read-only view
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-pink-50 dark:bg-ink-600">
          <Share2 size={18} color="#FB7185" />
        </View>
      </View>

      {loading ? (
        <View className="items-center py-20">
          <ActivityIndicator size="large" color="#FB7185" />
          <Text variant="caption" muted className="mt-4">
            Loading shared activities…
          </Text>
        </View>
      ) : error ? (
        <View className="items-center rounded-3xl border border-dashed border-pink-200 bg-pink-50 px-6 py-12 dark:border-ink-600 dark:bg-ink-700">
          <Text className="text-3xl">🔗</Text>
          <Text variant="subtitle" className="mt-3 text-center">
            Link unavailable
          </Text>
          <Text variant="caption" muted className="mt-2 text-center leading-6">
            {error}
          </Text>
        </View>
      ) : payload ? (
        <>
          <View className="mb-6 rounded-3xl border border-ink-100/60 bg-white p-5 dark:border-ink-600 dark:bg-ink-700">
            <Text variant="title" className="text-xl font-bold">
              {payload.babyName}
            </Text>
            <Text variant="caption" className="mt-1 text-pink-500 dark:text-pink-300">
              {payload.babyAge} old
            </Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full bg-lavender-200 px-3 py-1 dark:bg-lavender-200/20">
                <Text variant="caption" className="font-semibold">
                  {payload.filterLabel}
                </Text>
              </View>
              <View className="rounded-full bg-ink-50 px-3 py-1 dark:bg-ink-600">
                <Text variant="caption" muted>
                  {payload.entryCount} activities
                </Text>
              </View>
            </View>
            <Text variant="caption" muted className="mt-3">
              Shared {format(new Date(payload.sharedAt), 'MMM d, yyyy')} · Expires{' '}
              {formatDistanceToNow(new Date(payload.expiresAt), { addSuffix: true })}
            </Text>
          </View>

          <View className="gap-3">
            {payload.entries.length === 0 ? (
              <View className="items-center rounded-3xl border border-ink-100/60 bg-white py-12 dark:border-ink-600 dark:bg-ink-700">
                <Text muted variant="caption">
                  No activities in this share yet.
                </Text>
              </View>
            ) : (
              payload.entries.map((entry) => {
                const activity = entry.activityId
                  ? getActivityById(entry.activityId)
                  : undefined;
                const Icon = activity?.icon;
                const iconColor = activity?.iconColor ?? '#FB7185';
                const bg = activity?.bg ?? '#FDF2F8';

                return (
                  <View
                    key={entry.id}
                    className="flex-row items-center gap-3 rounded-3xl border border-ink-100/60 bg-white p-4 dark:border-ink-600 dark:bg-ink-700"
                  >
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: bg }}
                    >
                      {Icon ? <Icon size={20} color={iconColor} strokeWidth={2} /> : null}
                    </View>
                    <View className="flex-1">
                      <Text variant="subtitle" className="font-semibold">
                        {entry.title}
                      </Text>
                      <Text variant="caption" muted className="mt-0.5">
                        {entry.detail}
                      </Text>
                      <Text variant="caption" muted className="mt-1">
                        {formatDate(entry.startedAt)} · {formatTime(entry.startedAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
