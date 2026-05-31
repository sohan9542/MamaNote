export type ChangelogItem = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.0.0',
    date: 'May 2026',
    title: 'Welcome to Mamanote',
    highlights: [
      'Track sleep, feeding, medicine, pumping, nutrition, and diapers',
      'AI daily rhythm based on your baby\'s recent activity',
      'Medicine reminders so you never miss a dose',
      'Share activity logs with family via a secure link',
      'Insights with daily stats and weekly overview charts',
      'Dark mode and gentle, parent-friendly design',
    ],
  },
];

export const APP_VERSION = CHANGELOG[0]?.version ?? '1.0.0';
