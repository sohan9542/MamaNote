export type ChangelogItem = {
  version: string;
  date: string;
  title: string;
  highlights: string[];
};

export const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.0.0',
    date: 'June 2026',
    title: 'Welcome to MamaNote',
    highlights: [
      'Growth & Skills — track milestones by age on a playful adventure path',
      'Sleep timer & schedule — start day or night sleep, build a nap plan, and generate times',
      '13 home activities including bottle, bath, tummy time, growth, doctor visits, and playtime',
      'Quick access on Home for Growth & Skills and Sleep',
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
