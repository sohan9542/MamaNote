import { useState } from 'react';
import { Alert, Modal, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, X } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Text } from '@components/Text';
import { RATING_PROMPT } from '@constants/ratingPrompt';
import { hasStoreListing, openStoreListing } from '@lib/feedback';
const STAR_COUNT = 5;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function RatingPromptSheet({ visible, onClose }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeAvailable = hasStoreListing();

  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  const handleRateOnStore = async () => {
    if (!storeAvailable) {
      Alert.alert('Coming soon', RATING_PROMPT.storeUnavailable);
      return;
    }
    setLoading(true);
    try {
      await openStoreListing();
      handleClose();
    } catch (error) {
      Alert.alert('Could not open store', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = (value: number) => {
    setRating(value);
    if (value >= 4 && storeAvailable) {
      void handleRateOnStore();
    }
  };

  const handleFeedback = () => {
    handleClose();
    router.push('/feedback');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45" onPress={handleClose} />
        <View
          className="rounded-t-[28px] bg-white px-5 pt-3 dark:bg-ink-800"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-ink-200 dark:bg-ink-600" />
          <View className="mb-4 flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text variant="subtitle" className="font-bold">
                {RATING_PROMPT.title}
              </Text>
              <Text variant="caption" muted className="mt-2 leading-5">
                {storeAvailable ? RATING_PROMPT.message : RATING_PROMPT.storeUnavailable}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-full bg-ink-50 dark:bg-ink-700"
            >
              <X size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          <View className="mb-5 flex-row justify-center gap-2">
            {Array.from({ length: STAR_COUNT }, (_, index) => {
              const value = index + 1;
              const filled = value <= rating;
              return (
                <Pressable
                  key={value}
                  onPress={() => handleStarPress(value)}
                  disabled={loading}
                  className="h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 active:opacity-80 dark:bg-ink-700"
                  accessibilityLabel={`Rate ${value} out of ${STAR_COUNT} stars`}
                >
                  <Star
                    size={28}
                    color={filled ? '#F59E0B' : '#D1C4E9'}
                    fill={filled ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              );
            })}
          </View>

          {storeAvailable ? (
            <Button onPress={handleRateOnStore} loading={loading} fullWidth size="lg">
              {RATING_PROMPT.rateCta}
            </Button>
          ) : null}

          <Button
            variant="secondary"
            onPress={handleFeedback}
            fullWidth
            className="mt-2"
          >
            {RATING_PROMPT.feedbackCta}
          </Button>

          <Button variant="ghost" onPress={handleClose} fullWidth className="mt-2">
            {RATING_PROMPT.dismiss}
          </Button>
        </View>
      </View>
    </Modal>
  );
}
