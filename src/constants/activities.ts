import type { LucideIcon } from 'lucide-react-native';
import {
  Apple,
  Droplet,
  Layers,
  Milk,
  Moon,
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
    id: 'temperature',
    type: 'note',
    label: 'Temperature',
    icon: Thermometer,
    bg: '#FCE7F3',
    iconColor: '#DB2777',
    defaultMetadata: { subtype: 'temperature' },
  },
];

export function getActivityById(id: string): ActivityOption | undefined {
  return HOME_ACTIVITIES.find((a) => a.id === id);
}

export function resolveActivityFromParams(
  type?: string,
  note?: string,
): ActivityOption {
  if (note === 'Nutrition') return HOME_ACTIVITIES.find((a) => a.id === 'nutrition')!;
  if (note === 'Temperature') return HOME_ACTIVITIES.find((a) => a.id === 'temperature')!;
  if (note === 'Breastfeeding') return HOME_ACTIVITIES.find((a) => a.id === 'breastfeeding')!;
  const match = HOME_ACTIVITIES.find((a) => a.type === type);
  return match ?? HOME_ACTIVITIES[1];
}

export function getActivityForEntry(
  type: LogEntryType,
  metadata?: LogMetadata | null,
): ActivityOption | undefined {
  const subtype = metadata?.subtype;
  if (type === 'feeding' && subtype === 'nutrition') {
    return HOME_ACTIVITIES.find((a) => a.id === 'nutrition');
  }
  if (type === 'feeding' && subtype === 'breastfeeding') {
    return HOME_ACTIVITIES.find((a) => a.id === 'breastfeeding');
  }
  if (type === 'note' && subtype === 'temperature') {
    return HOME_ACTIVITIES.find((a) => a.id === 'temperature');
  }
  return HOME_ACTIVITIES.find((a) => a.type === type && !a.defaultMetadata?.subtype);
}
