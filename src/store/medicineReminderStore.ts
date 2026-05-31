import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { syncMedicineReminders } from '@lib/notifications';
import type { MedicineReminder } from '@app-types/medicineReminder';
import {
  findRemindersForMedicine,
  medicineNamesMatch,
} from '@utils/medicineReminder';

const STORAGE_KEY = '@mamanote/medicine-reminders';

type ReminderMap = Record<string, MedicineReminder[]>;

interface MedicineReminderState {
  remindersByBaby: ReminderMap;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  getForBaby: (babyId: string) => MedicineReminder[];
  findForMedicine: (babyId: string, medicineName: string) => MedicineReminder[];
  saveReminder: (reminder: MedicineReminder) => Promise<void>;
  deleteReminder: (babyId: string, reminderId: string) => Promise<void>;
  deleteRemindersForMedicine: (babyId: string, medicineName: string) => Promise<void>;
  syncNotifications: () => Promise<void>;
}

async function readStorage(): Promise<ReminderMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ReminderMap;
  } catch {
    return {};
  }
}

async function writeStorage(map: ReminderMap) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function allReminders(map: ReminderMap): MedicineReminder[] {
  return Object.values(map).flat();
}

export const useMedicineReminderStore = create<MedicineReminderState>((set, get) => ({
  remindersByBaby: {},
  hydrated: false,

  hydrate: async () => {
    const remindersByBaby = await readStorage();
    set({ remindersByBaby, hydrated: true });
    await syncMedicineReminders(allReminders(remindersByBaby));
  },

  getForBaby: (babyId) => get().remindersByBaby[babyId] ?? [],

  findForMedicine: (babyId, medicineName) =>
    findRemindersForMedicine(get().remindersByBaby[babyId] ?? [], medicineName),

  saveReminder: async (reminder) => {
    const map = { ...get().remindersByBaby };
    const list = [...(map[reminder.babyId] ?? [])];
    const idx = list.findIndex((r) => r.id === reminder.id);
    if (idx >= 0) list[idx] = reminder;
    else list.push(reminder);
    map[reminder.babyId] = list;

    await writeStorage(map);
    set({ remindersByBaby: map });
    await syncMedicineReminders(allReminders(map));
  },

  deleteReminder: async (babyId, reminderId) => {
    const map = { ...get().remindersByBaby };
    map[babyId] = (map[babyId] ?? []).filter((r) => r.id !== reminderId);

    await writeStorage(map);
    set({ remindersByBaby: map });
    await syncMedicineReminders(allReminders(map));
  },

  deleteRemindersForMedicine: async (babyId, medicineName) => {
    const map = { ...get().remindersByBaby };
    map[babyId] = (map[babyId] ?? []).filter(
      (r) => !medicineNamesMatch(r.medicineName, medicineName),
    );

    await writeStorage(map);
    set({ remindersByBaby: map });
    await syncMedicineReminders(allReminders(map));
  },

  syncNotifications: async () => {
    await syncMedicineReminders(allReminders(get().remindersByBaby));
  },
}));
