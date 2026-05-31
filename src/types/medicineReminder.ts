/** Daily medicine reminder stored locally and synced to OS notifications. */
export interface MedicineReminder {
  id: string;
  babyId: string;
  medicineName: string;
  /** 24-hour "HH:mm" strings, e.g. "08:00", "14:30" */
  times: string[];
  enabled: boolean;
  updatedAt: string;
}

export const MEDICINE_TIME_PRESETS = [
  { label: 'Morning', time: '08:00' },
  { label: 'Afternoon', time: '14:00' },
  { label: 'Evening', time: '20:00' },
] as const;
