import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { LogActivityForm } from './LogActivityForm';
import { Text } from './Text';
import type { ActivityOption } from '@constants/activities';

interface Props {
  activity: ActivityOption | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function QuickLogSheet({ activity, visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();

  if (!activity) return null;

  const Icon = activity.icon;

  const handleSaved = () => {
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className="rounded-t-[28px] bg-white px-5 pt-3 dark:bg-ink-800"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
        <View className="mb-4 items-center">
          <View className="mb-4 h-1 w-10 rounded-full bg-ink-200 dark:bg-ink-600" />
          <View className="w-full flex-row items-center gap-3">
            <View
              className="h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${activity.iconColor}22` }}
            >
              <Icon size={24} color={activity.iconColor} />
            </View>
            <View className="flex-1">
              <Text variant="subtitle" className="font-bold">
                {activity.label}
              </Text>
              <Text variant="caption" muted>
                {activity.id === 'sleep'
                  ? 'Log sleep'
                  : activity.id === 'notes'
                    ? 'Add a note'
                    : 'Log activity'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
            >
              <X size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        <LogActivityForm activity={activity} onSaved={handleSaved} onCancel={onClose} />
        </View>
      </View>
    </Modal>
  );
}
