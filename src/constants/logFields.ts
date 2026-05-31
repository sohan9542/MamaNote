import type { LogEntryType } from '@app-types/database';

/** Colors aligned with competitor-style activity charts */
export const ACTIVITY_CHART_COLORS: Record<LogEntryType, string> = {
  sleep: '#8B5CF6',
  feeding: '#EA580C',
  diaper: '#22C55E',
  pump: '#EAB308',
  medication: '#F43F5E',
  note: '#EC4899',
};

export type LogSubtype =
  | 'breastfeeding'
  | 'bottle'
  | 'nutrition'
  | 'wet'
  | 'dirty'
  | 'both'
  | 'temperature'
  | 'left'
  | 'right';

export interface LogMetadata {
  subtype?: LogSubtype;
  /** Breast side for feeding */
  side?: 'left' | 'right' | 'both';
  durationMinutes?: number;
  temperature?: number;
  medicineName?: string;
}

export interface QuickLogPreset {
  type: LogEntryType;
  label: string;
  emoji: string;
  /** Show duration chips (sleep, etc.) */
  showDuration?: boolean;
  /** Show amount field (ml) */
  showAmount?: boolean;
  /** Chip options for quick select */
  chips?: { id: string; label: string; metadata?: Partial<LogMetadata> }[];
}

export const QUICK_LOG_PRESETS: QuickLogPreset[] = [
  {
    type: 'sleep',
    label: 'Sleep',
    emoji: '🌙',
    showDuration: true,
    chips: [
      { id: '30', label: '30m', metadata: { durationMinutes: 30 } },
      { id: '60', label: '1h', metadata: { durationMinutes: 60 } },
      { id: '90', label: '1.5h', metadata: { durationMinutes: 90 } },
      { id: '120', label: '2h', metadata: { durationMinutes: 120 } },
    ],
  },
  {
    type: 'feeding',
    label: 'Feeding',
    emoji: '🍼',
    showAmount: true,
    chips: [
      { id: 'breast', label: 'Breast', metadata: { subtype: 'breastfeeding' } },
      { id: 'bottle', label: 'Bottle', metadata: { subtype: 'bottle' } },
      { id: 'nutrition', label: 'Solids', metadata: { subtype: 'nutrition' } },
    ],
  },
  {
    type: 'diaper',
    label: 'Diaper',
    emoji: '👶',
    chips: [
      { id: 'wet', label: 'Wet', metadata: { subtype: 'wet' } },
      { id: 'dirty', label: 'Dirty', metadata: { subtype: 'dirty' } },
      { id: 'both', label: 'Both', metadata: { subtype: 'both' } },
    ],
  },
  {
    type: 'pump',
    label: 'Pump',
    emoji: '💧',
    showAmount: true,
  },
  {
    type: 'medication',
    label: 'Medicine',
    emoji: '💊',
  },
  {
    type: 'note',
    label: 'Note',
    emoji: '📝',
    chips: [
      { id: 'temp', label: 'Temperature', metadata: { subtype: 'temperature' } },
    ],
  },
];

export function getLogPreset(type: LogEntryType): QuickLogPreset {
  return QUICK_LOG_PRESETS.find((p) => p.type === type) ?? QUICK_LOG_PRESETS[0];
}

/** Map home quick-action label → log preset metadata */
export function metadataFromQuickLabel(
  type: LogEntryType,
  quickLabel?: string,
): LogMetadata {
  if (type === 'feeding' && quickLabel === 'Nutrition') return { subtype: 'nutrition' };
  if (type === 'feeding' && quickLabel === 'Breastfeeding') return { subtype: 'breastfeeding' };
  if (type === 'note' && quickLabel === 'Temperature') return { subtype: 'temperature' };
  return {};
}
