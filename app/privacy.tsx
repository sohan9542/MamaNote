import { View } from 'react-native';

import { Card } from '@components/Card';
import { Screen } from '@components/Screen';
import { ScreenBackHeader } from '@components/ScreenBackHeader';
import { Text } from '@components/Text';
import { APP_VERSION } from '@constants/changelog';

type PrivacySection = {
  title: string;
  body: string[];
};

const SECTIONS: PrivacySection[] = [
  {
    title: 'Overview',
    body: [
      'MamaNote helps you track your baby\'s daily care. We take privacy seriously and only collect what is needed to run the app.',
      'This policy describes what we store, where it lives, and the choices you have.',
    ],
  },
  {
    title: 'Information we collect',
    body: [
      'Account details — your email address and name when you sign up.',
      'Baby profile — your baby\'s name, birth date, and optional gender.',
      'Activity logs — sleep, feeding, diapers, medicine, pumping, nutrition, and notes you record.',
      'Subscription status — whether you have MamaNote Plus, managed through Paddle.',
      'Share links — if you create a share link, selected activities can be viewed by anyone with that link until you revoke it.',
    ],
  },
  {
    title: 'Information stored on your device',
    body: [
      'Medicine reminder schedules are saved locally on your phone and used to trigger reminder notifications.',
      'Theme preference (light/dark mode) is stored on your device.',
    ],
  },
  {
    title: 'How we use your data',
    body: [
      'To sync your logs and baby profile across your signed-in sessions.',
      'To generate AI daily rhythm suggestions based on recent activity (Plus feature).',
      'To process subscriptions and restore premium access.',
      'We do not sell your personal data or use it for advertising.',
    ],
  },
  {
    title: 'Third-party services',
    body: [
      'Supabase — authentication and secure database storage.',
      'Paddle — subscription billing and payment processing.',
      'Anthropic (via Supabase Edge Functions) — AI schedule generation when you request a daily rhythm.',
    ],
  },
  {
    title: 'Notifications',
    body: [
      'MamaNote uses local notifications on your device for medicine reminders only.',
      'We do not send marketing push notifications.',
      'You can turn notifications off anytime in your phone\'s Settings.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'You can edit or delete activity logs inside the app.',
      'You can revoke share links at any time.',
      'You can sign out or delete your account by contacting us — we will remove your data from our servers.',
      'Medicine reminders can be turned off per medicine or disabled in device Settings.',
    ],
  },
  {
    title: 'Security',
    body: [
      'Your data is protected by row-level security in Supabase so only you can access your account\'s records.',
      'Share links use unguessable tokens and only expose the categories you choose.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'Questions about privacy? Use Profile → Send feedback to reach us.',
      'We may update this policy as the app grows. Continued use after changes means you accept the updated policy.',
    ],
  },
];

export default function PrivacyScreen() {
  return (
    <Screen scroll contentClassName="pb-10">
      <ScreenBackHeader
        title="Privacy"
        subtitle="How MamaNote handles your data"
      />

      <Card tone="mint" className="mb-5 gap-2">
        <Text variant="subtitle" className="font-semibold">
          Your family data stays yours
        </Text>
        <Text muted className="leading-6">
          MamaNote is built for parents. We keep tracking simple, secure, and under your control.
        </Text>
      </Card>

      <View className="gap-4">
        {SECTIONS.map((section) => (
          <Card key={section.title} className="gap-3">
            <Text variant="subtitle" className="font-semibold">
              {section.title}
            </Text>
            {section.body.map((paragraph) => (
              <Text key={paragraph} muted className="leading-6">
                {paragraph}
              </Text>
            ))}
          </Card>
        ))}
      </View>

      <Text muted variant="caption" className="mt-8 text-center">
        Last updated May 2026 · MamaNote v{APP_VERSION}
      </Text>
    </Screen>
  );
}
