import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { Heart, Mail, Star } from 'lucide-react-native';

import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Screen } from '@components/Screen';
import { ScreenBackHeader } from '@components/ScreenBackHeader';
import { Text } from '@components/Text';
import { FontFamily } from '@constants/fonts';
import { useTheme } from '@hooks/useTheme';
import { hasFeedbackEmail, hasStoreListing, openStoreListing, sendFeedback } from '@lib/feedback';
import { useAuthStore } from '@store/authStore';

const STAR_COUNT = 5;

export default function FeedbackScreen() {
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const storeAvailable = hasStoreListing();

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleRate = async () => {
    if (!storeAvailable) {
      Alert.alert(
        'Coming soon',
        'Store ratings will open once Mamanote is published on the Play Store and App Store.',
      );
      return;
    }

    setRatingLoading(true);
    try {
      await openStoreListing();
    } catch (error) {
      Alert.alert('Could not open store', (error as Error).message);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleStarPress = (value: number) => {
    setRating(value);
    if (value >= 4 && storeAvailable) {
      void handleRate();
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const method = await sendFeedback(message, user?.email ?? undefined);
      setMessage('');

      if (method === 'email') {
        Alert.alert('Thanks!', 'Your email app should open with your message ready to send.');
        return;
      }
      if (method === 'clipboard') {
        Alert.alert('Thanks!', 'Your feedback was copied. Paste it anywhere to share with us.');
        return;
      }
      Alert.alert('Thanks!', 'Use the share sheet to send your feedback to us.');
    } catch (error) {
      Alert.alert('Could not send', (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll contentClassName="pb-10">
      <ScreenBackHeader
        title="Send feedback"
        subtitle="Rate us or tell us how we're doing"
      />

      <Card tone="pink" className="mb-5 gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-ink-600">
            <Star size={20} color={colors.warning} fill={colors.warning} />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-semibold">
              Enjoying Mamanote?
            </Text>
            <Text muted variant="caption">
              {storeAvailable
                ? 'Tap the stars to open the store and leave a rating.'
                : 'Store ratings will be available after launch. Stars still help us know how you feel.'}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-center gap-2">
          {Array.from({ length: STAR_COUNT }, (_, index) => {
            const value = index + 1;
            const filled = value <= rating;
            return (
              <Pressable
                key={value}
                onPress={() => handleStarPress(value)}
                disabled={ratingLoading}
                className="h-12 w-12 items-center justify-center rounded-2xl bg-white/80 active:opacity-80 dark:bg-ink-600"
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
          <Button
            variant="secondary"
            onPress={handleRate}
            loading={ratingLoading}
            fullWidth
            leftIcon={<Heart size={18} color={colors.primary} />}
          >
            Rate on store
          </Button>
        ) : null}
      </Card>

      <Card className="gap-4">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 dark:bg-ink-600">
            <Mail size={20} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text variant="subtitle" className="font-semibold">
              Send a message
            </Text>
            <Text muted variant="caption">
              {hasFeedbackEmail()
                ? 'Bug reports, ideas, or anything we can improve.'
                : 'Your message will be copied so you can share it with us.'}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-ink-100 bg-white px-4 py-3 dark:border-ink-600 dark:bg-ink-700">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us what you think..."
            placeholderTextColor="#A89FBE"
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 140,
              fontFamily: FontFamily.regular,
              fontSize: 16,
              color: colors.text,
            }}
          />
        </View>

        <Button
          onPress={handleSend}
          loading={sending}
          fullWidth
          leftIcon={<Mail size={18} color="#FFFFFF" />}
        >
          {hasFeedbackEmail() ? 'Send feedback' : 'Copy feedback'}
        </Button>
      </Card>

      <Text muted variant="caption" className="mt-6 text-center leading-5">
        {rating > 0 && rating < 4
          ? 'Thanks for the honest rating. A message below helps us improve.'
          : 'Your feedback helps us build a better app for parents everywhere.'}
      </Text>
    </Screen>
  );
}
