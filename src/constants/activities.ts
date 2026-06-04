import type { LucideIcon } from 'lucide-react-native';
import {
  Apple,
  Bath,
  Blocks,
  CupSoda,
  Droplet,
  Footprints,
  Hospital,
  Layers,
  Milk,
  Moon,
  NotebookPen,
  Scale,
  Stethoscope,
  Thermometer,
} from 'lucide-react-native';

import type { LogEntryType } from '@app-types/database';
import type { LogMetadata } from '@constants/logFields';

export type ActivityOption = {
  id: string;
  type: LogEntryType;
  label: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  /** Pre-fill metadata when opening the log sheet */
  defaultMetadata?: LogMetadata;
  /** Diaper saves on first tap; others open the sheet */
  instantLog?: boolean;
};

/** Home + log picker activities (Mommy-app style). */
export const HOME_ACTIVITIES: ActivityOption[] = [
  {
    id: 'sleep',
    type: 'sleep',
    label: 'Sleep',
    icon: Moon,
    bg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    id: 'breastfeeding',
    type: 'feeding',
    label: 'Breastfeeding',
    icon: Milk,
    bg: '#FFEDD5',
    iconColor: '#EA580C',
    defaultMetadata: { subtype: 'breastfeeding' },
  },
  {
    id: 'bottle',
    type: 'feeding',
    label: 'Bottle',
    icon: CupSoda,
    bg: '#FCE7F3',
    iconColor: '#DB2777',
    defaultMetadata: { subtype: 'bottle' },
  },
  {
    id: 'medicine',
    type: 'medication',
    label: 'Medicine',
    icon: Stethoscope,
    bg: '#F5EBD7',
    iconColor: '#B45309',
  },
  {
    id: 'pumping',
    type: 'pump',
    label: 'Pumping',
    icon: Droplet,
    bg: '#FEF9C3',
    iconColor: '#CA8A04',
  },
  {
    id: 'nutrition',
    type: 'feeding',
    label: 'Nutrition',
    icon: Apple,
    bg: '#DBEAFE',
    iconColor: '#2563EB',
    defaultMetadata: { subtype: 'nutrition' },
  },
  {
    id: 'diaper',
    type: 'diaper',
    label: 'Diaper',
    icon: Layers,
    bg: '#DCFCE7',
    iconColor: '#16A34A',
    instantLog: true,
  },
  {
    id: 'notes',
    type: 'note',
    label: 'Notes',
    icon: NotebookPen,
    bg: '#EEEBF4',
    iconColor: '#6E6485',
  },
  {
    id: 'temperature',
    type: 'note',
    label: 'Temperature',
    icon: Thermometer,
    bg: '#FCE7F3',
    iconColor: '#DB2777',
    defaultMetadata: { subtype: 'temperature' },
  },
  {
    id: 'bath',
    type: 'note',
    label: 'Bath',
    icon: Bath,
    bg: '#E0F2FE',
    iconColor: '#0284C7',
    defaultMetadata: { subtype: 'bath' },
  },
  {
    id: 'tummy_time',
    type: 'note',
    label: 'Tummy time',
    icon: Footprints,
    bg: '#FEF3C7',
    iconColor: '#D97706',
    defaultMetadata: { subtype: 'tummy_time' },
  },
  {
    id: 'growth',
    type: 'note',
    label: 'Growth',
    icon: Scale,
    bg: '#F3E8FF',
    iconColor: '#9333EA',
    defaultMetadata: { subtype: 'growth' },
  },
  {
    id: 'doctor',
    type: 'note',
    label: 'Doctor',
    icon: Hospital,
    bg: '#FEE2E2',
    iconColor: '#DC2626',
    defaultMetadata: { subtype: 'doctor' },
  },
  {
    id: 'playtime',
    type: 'note',
    label: 'Playtime',
    icon: Blocks,
    bg: '#D1FAE5',
    iconColor: '#059669',
    defaultMetadata: { subtype: 'playtime' },
  },
];

/** Home screen quick actions (2×2 grid + diaper). Full list stays on Log tab. */
export const HOME_QUICK_ACTIVITY_IDS = [
  'sleep',
  'breastfeeding',
  'medicine',
  'notes',
  'diaper',
] as const;

export const HOME_QUICK_ACTIVITIES: ActivityOption[] = HOME_QUICK_ACTIVITY_IDS.map(
  (id) => HOME_ACTIVITIES.find((a) => a.id === id)!,
);

export function getActivitySurfaceStyle(
  activity: Pick<ActivityOption, 'bg' | 'iconColor'>,
  isDark: boolean,
) {
  return isDark
    ? {
        backgroundColor: `${activity.iconColor}18`,
        borderColor: `${activity.iconColor}35`,
        borderWidth: 1 as const,
      }
    : { backgroundColor: activity.bg };
}

export function getActivityById(id: string): ActivityOption | undefined {
  return HOME_ACTIVITIES.find((a) => a.id === id);
}

export function resolveActivityFromParams(
  type?: string,
  note?: string,
): ActivityOption {
  if (note) {
    const byLabel = HOME_ACTIVITIES.find((a) => a.label === note);
    if (byLabel) return byLabel;
  }
  const match = HOME_ACTIVITIES.find((a) => a.type === type);
  return match ?? HOME_ACTIVITIES[1];
}

export function getActivityForEntry(
  type: LogEntryType,
  metadata?: LogMetadata | null,
): ActivityOption | undefined {
  const subtype = metadata?.subtype;
  if (subtype) {
    const bySubtype = HOME_ACTIVITIES.find((a) => a.defaultMetadata?.subtype === subtype);
    if (bySubtype) return bySubtype;
  }
  if (type === 'note') {
    return HOME_ACTIVITIES.find((a) => a.id === 'notes');
  }
  return HOME_ACTIVITIES.find(
    (a) => a.type === type && !a.defaultMetadata?.subtype,
  );
}
