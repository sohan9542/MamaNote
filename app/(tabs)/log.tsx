import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { LogActivityForm } from '@components/LogActivityForm';
import { MedicineForm } from '@components/MedicineForm';
import { Screen } from '@components/Screen';
import { Text } from '@components/Text';
import {
  HOME_ACTIVITIES,
  getActivitySurfaceStyle,
  resolveActivityFromParams,
  type ActivityOption,
} from '@constants/activities';
import { useTheme } from '@hooks/useTheme';
import { cn } from '@utils/cn';

export default function LogScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const params = useLocalSearchParams<{ type?: string; note?: string; activityId?: string }>();

  const initialActivity =
    (params.activityId
      ? HOME_ACTIVITIES.find((a) => a.id === params.activityId)
      : undefined) ??
    resolveActivityFromParams(params.type, params.note);

  const [selected, setSelected] = useState<ActivityOption | null>(
    params.type || params.note || params.activityId ? initialActivity : null,
  );

  useEffect(() => {
    if (params.activityId) {
      const a = HOME_ACTIVITIES.find((x) => x.id === params.activityId);
      if (a) setSelected(a);
    } else if (params.type || params.note) {
      setSelected(resolveActivityFromParams(params.type, params.note));
    }
  }, [params.type, params.note, params.activityId]);

  const handleSaved = () => {
    Alert.alert('Saved', 'Activity logged.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!selected) {
    return (
      <Screen scroll contentClassName="pb-28">
        <Text variant="display" className="mb-2 mt-2 font-display">
          Log activity
        </Text>
        <Text muted className="mb-6">
          Pick what you want to track — same quick flows as home.
        </Text>

        <View className="flex-row flex-wrap gap-3">
          {HOME_ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            return (
              <Pressable
                key={activity.id}
                onPress={() => setSelected(activity)}
                style={getActivitySurfaceStyle(activity, isDark)}
                className={cn(
                  'w-[47%] items-center rounded-3xl px-3 py-6 active:opacity-85',
                  !isDark && 'border border-transparent',
                )}
              >
                <View
                  className={cn(
                    'mb-3 h-14 w-14 items-center justify-center rounded-2xl',
                    isDark ? 'bg-ink-800/90' : 'bg-white/90',
                  )}
                >
                  <Icon size={28} color={activity.iconColor} strokeWidth={2} />
                </View>
                <Text
                  variant="caption"
                  className="text-center font-bold text-ink-800 dark:text-ink-50"
                >
                  {activity.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Screen>
    );
  }

  const Icon = selected.icon;

  return (
    <Screen scroll contentClassName="pb-28">
      <Pressable
        onPress={() => setSelected(null)}
        className="mb-4 mt-2 flex-row items-center gap-1 self-start"
      >
        <ChevronLeft size={20} color={colors.primary} />
        <Text variant="caption" className="font-semibold text-pink-500 dark:text-pink-300">
          All activities
        </Text>
      </Pressable>

      <View
        className={cn(
          'mb-6 flex-row items-center gap-4 rounded-3xl p-5',
          !isDark && 'border border-transparent',
        )}
        style={getActivitySurfaceStyle(selected, isDark)}
      >
        <View
          className={cn(
            'h-16 w-16 items-center justify-center rounded-2xl',
            isDark ? 'bg-ink-800/90' : 'bg-white/90',
          )}
        >
          <Icon size={32} color={selected.iconColor} strokeWidth={2} />
        </View>
        <View className="flex-1">
          <Text variant="title" className="font-bold text-ink-800 dark:text-ink-50">
            {selected.label}
          </Text>
          <Text variant="caption" className="text-ink-600 dark:text-ink-300">
            {selected.id === 'diaper'
              ? 'One tap to log'
              : selected.id === 'medicine'
                ? 'Log a dose — add times for daily reminders'
                : selected.id === 'notes'
                  ? 'Write your note below'
                  : 'Fill in details below'}
          </Text>
        </View>
      </View>

      {selected.id === 'medicine' ? (
        <MedicineForm onSaved={handleSaved} />
      ) : (
        <LogActivityForm
          activity={selected}
          onSaved={handleSaved}
          onCancel={() => setSelected(null)}
        />
      )}
    </Screen>
  );
}
