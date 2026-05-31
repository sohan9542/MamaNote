import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { MedicineForm } from './MedicineForm';
import { Text } from './Text';
import type { ActivityOption } from '@constants/activities';

interface Props {
  activity: ActivityOption;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function MedicineSheet({ activity, visible, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
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
          className="max-h-[92%] rounded-t-[28px] bg-white px-5 pt-3 dark:bg-ink-800"
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
                  Medicine
                </Text>
                <Text variant="caption" muted>
                  Log a dose — add times for daily reminders
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

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-2"
          >
            <MedicineForm active={visible} onSaved={handleSaved} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
