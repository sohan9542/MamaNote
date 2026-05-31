import { Pressable, View } from 'react-native';

import { Text } from './Text';
import { HOME_ACTIVITIES } from '@constants/activities';
import { cn } from '@utils/cn';

interface Props {
  allSelected: boolean;
  selectedIds: string[];
  onSelectAll: () => void;
  onToggleCategory: (id: string) => void;
}

export function ShareCategoryPicker({
  allSelected,
  selectedIds,
  onSelectAll,
  onToggleCategory,
}: Props) {
  return (
    <View className="gap-4">
      <Pressable
        onPress={onSelectAll}
        className={cn(
          'rounded-3xl border-2 p-5',
          allSelected
            ? 'border-pink-300 bg-pink-50 dark:border-pink-400/50 dark:bg-pink-950/20'
            : 'border-ink-100/80 bg-white dark:border-ink-600 dark:bg-ink-700',
        )}
      >
        <Text variant="subtitle" className="font-bold">
          All activities
        </Text>
        <Text variant="caption" muted className="mt-1">
          Share your complete activity history
        </Text>
      </Pressable>

      <View>
        <Text variant="caption" className="mb-3 font-semibold text-ink-700 dark:text-ink-100">
          Or choose categories
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {HOME_ACTIVITIES.map((activity) => {
            const Icon = activity.icon;
            const selected = !allSelected && selectedIds.includes(activity.id);
            return (
              <Pressable
                key={activity.id}
                onPress={() => onToggleCategory(activity.id)}
                className={cn(
                  'min-w-[47%] flex-1 flex-row items-center gap-3 rounded-2xl border px-4 py-3',
                  selected
                    ? 'border-lavender-400 bg-lavender-100 dark:border-lavender-300 dark:bg-lavender-200/15'
                    : 'border-ink-100/60 bg-white dark:border-ink-600 dark:bg-ink-700',
                  allSelected && 'opacity-50',
                )}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: activity.bg }}
                >
                  <Icon size={18} color={activity.iconColor} strokeWidth={2} />
                </View>
                <Text variant="caption" className="flex-1 font-semibold">
                  {activity.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
