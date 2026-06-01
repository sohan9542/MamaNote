import { create } from 'zustand';

interface RatingPromptState {
  visible: boolean;
  show: () => void;
  hide: () => void;
}

export const useRatingPromptStore = create<RatingPromptState>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
