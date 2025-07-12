import { create } from 'zustand';

export type ElementalInstance = 'fogo' | 'gelo' | 'raio';

interface ElementalInstanceState {
  selectedInstance: ElementalInstance;
  lastSwitchTimestamp: number;
  setSelectedInstance: (instance: ElementalInstance) => void;
}

export const useElementalInstanceStore = create<ElementalInstanceState>((set, get) => ({
  selectedInstance: 'gelo',
  lastSwitchTimestamp: 0,
  setSelectedInstance: (instance) => {
    const now = Date.now();
    const last = get().lastSwitchTimestamp;
    if (now - last < 2000) return;
    set({ selectedInstance: instance, lastSwitchTimestamp: now });
  },
})); 