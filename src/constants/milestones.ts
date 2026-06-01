import type { LucideIcon } from 'lucide-react-native';
import {
  Baby,
  Blocks,
  Milk,
  Moon,
  Shirt,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react-native';

export type Milestone = {
  id: string;
  /** Inclusive start month (0 = newborn) */
  monthStart: number;
  monthEnd: number;
  title: string;
  /** Playful chapter name */
  funTitle: string;
  emoji: string;
  skills: string[];
  icon: LucideIcon;
  ringColor: string;
  bgColor: string;
};

/** Short cheers shown when marking a skill */
export const SKILL_CHEERS = [
  'You spotted it!',
  'Little win!',
  'Growing beautifully!',
  'So proud of you!',
  'Amazing progress!',
  'Look at them go!',
] as const;

/** Developmental milestones inspired by age bands (0–12 months). */
export const MILESTONES: Milestone[] = [
  {
    id: 'm0',
    monthStart: 0,
    monthEnd: 1,
    title: '0 – 1 month',
    funTitle: 'Snuggle season',
    emoji: '👶',
    skills: [
      'Lifts head briefly during tummy time',
      'Follows faces with eyes',
      'Startles at loud sounds',
      'Calms when held or rocked',
    ],
    icon: Baby,
    ringColor: '#FACC15',
    bgColor: '#FEF9C3',
  },
  {
    id: 'm1',
    monthStart: 1,
    monthEnd: 2,
    title: '1 – 2 months',
    funTitle: 'First smiles',
    emoji: '😊',
    skills: [
      'Social smile',
      'Coos and gurgles',
      'Holds head steadier upright',
      'Tracks moving objects',
    ],
    icon: Sparkles,
    ringColor: '#4ADE80',
    bgColor: '#DCFCE7',
  },
  {
    id: 'm2',
    monthStart: 2,
    monthEnd: 3,
    title: '2 – 3 months',
    funTitle: 'Giggle era',
    emoji: '😄',
    skills: [
      'Laughs out loud',
      'Pushes up on forearms',
      'Reaches for toys',
      'Recognizes familiar voices',
    ],
    icon: Moon,
    ringColor: '#60A5FA',
    bgColor: '#DBEAFE',
  },
  {
    id: 'm3',
    monthStart: 3,
    monthEnd: 4,
    title: '3 – 4 months',
    funTitle: 'Rolling along',
    emoji: '🌀',
    skills: [
      'Rolls tummy to back',
      'Grasps and shakes toys',
      'Babbles with expression',
      'Shows excitement before feeds',
    ],
    icon: Shirt,
    ringColor: '#A78BFA',
    bgColor: '#EDE9FE',
  },
  {
    id: 'm4',
    monthStart: 4,
    monthEnd: 5,
    title: '4 – 5 months',
    funTitle: 'Playtime pro',
    emoji: '🧸',
    skills: [
      'Sits with support',
      'Transfers objects hand to hand',
      'Responds to own name',
      'Explores with mouth',
    ],
    icon: Milk,
    ringColor: '#FB923C',
    bgColor: '#FFEDD5',
  },
  {
    id: 'm5',
    monthStart: 5,
    monthEnd: 6,
    title: '5 – 6 months',
    funTitle: 'Food adventures',
    emoji: '🥄',
    skills: [
      'Starts solid food readiness',
      'Rolls both directions',
      'Sits briefly without support',
      'Stranger awareness begins',
    ],
    icon: UtensilsCrossed,
    ringColor: '#F97316',
    bgColor: '#FFEDD5',
  },
  {
    id: 'm6',
    monthStart: 6,
    monthEnd: 7,
    title: '6 – 7 months',
    funTitle: 'Sitting pretty',
    emoji: '🪑',
    skills: [
      'Sits independently',
      'Bears weight on legs when held',
      'Rakes small objects',
      'Responds to “no”',
    ],
    icon: Blocks,
    ringColor: '#22C55E',
    bgColor: '#DCFCE7',
  },
  {
    id: 'm7',
    monthStart: 7,
    monthEnd: 8,
    title: '7 – 8 months',
    funTitle: 'On the move',
    emoji: '🐛',
    skills: [
      'Crawls or army-crawls',
      'Pincer grasp emerging',
      'Plays peek-a-boo',
      'Understands object permanence',
    ],
    icon: Blocks,
    ringColor: '#38BDF8',
    bgColor: '#E0F2FE',
  },
  {
    id: 'm8',
    monthStart: 8,
    monthEnd: 9,
    title: '8 – 9 months',
    funTitle: 'Wave hello',
    emoji: '👋',
    skills: [
      'Pulls to stand',
      'Waves bye-bye',
      'Says “mama” or “dada” (non-specific)',
      'Self-feeds finger foods',
    ],
    icon: Sparkles,
    ringColor: '#818CF8',
    bgColor: '#E0E7FF',
  },
  {
    id: 'm9',
    monthStart: 9,
    monthEnd: 10,
    title: '9 – 10 months',
    funTitle: 'Cruise control',
    emoji: '🚶',
    skills: [
      'Cruises along furniture',
      'Claps hands',
      'Points to request',
      'Imitates sounds',
    ],
    icon: Baby,
    ringColor: '#F472B6',
    bgColor: '#FCE7F3',
  },
  {
    id: 'm10',
    monthStart: 10,
    monthEnd: 11,
    title: '10 – 11 months',
    funTitle: 'Almost one',
    emoji: '⭐',
    skills: [
      'Stands alone briefly',
      'Uses pincer grasp well',
      'Follows simple directions',
      'Shows preferences for toys',
    ],
    icon: Blocks,
    ringColor: '#34D399',
    bgColor: '#D1FAE5',
  },
  {
    id: 'm11',
    monthStart: 11,
    monthEnd: 12,
    title: '11 – 12 months',
    funTitle: 'Birthday bound',
    emoji: '🎂',
    skills: [
      'May take first steps',
      'Says 1–2 words with meaning',
      'Drinks from open cup with help',
      'Cooperates with dressing',
    ],
    icon: Sparkles,
    ringColor: '#FBBF24',
    bgColor: '#FEF3C7',
  },
];

export function getMilestoneForAgeMonths(ageMonths: number): Milestone {
  const clamped = Math.max(0, Math.min(ageMonths, 11));
  return (
    MILESTONES.find((m) => clamped >= m.monthStart && clamped < m.monthEnd) ??
    MILESTONES[MILESTONES.length - 1]
  );
}
