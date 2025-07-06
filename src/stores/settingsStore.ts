import { create } from 'zustand';

interface SettingsState {
  volume: number; // 0.0 – 1.0
  setVolume: (v: number) => void;
}

const STORAGE_KEY = 'gameVolume';

export const useSettingsStore = create<SettingsState>((set) => ({
  volume:
    typeof window !== 'undefined'
      ? (() => {
          const stored = localStorage.getItem(STORAGE_KEY);
          const parsed = stored ? parseFloat(stored) : 1;
          return isNaN(parsed) ? 1 : Math.min(Math.max(parsed, 0), 1);
        })()
      : 1,
  setVolume: (v: number) => {
    const clamped = Math.min(Math.max(v, 0), 1);
    set({ volume: clamped });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, clamped.toString());
    }
  },
})); 