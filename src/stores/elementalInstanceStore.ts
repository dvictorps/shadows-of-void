import { create } from 'zustand';

export type ElementalInstance = 'fogo' | 'gelo' | 'raio';

interface ElementalInstanceState {
  selectedInstance: ElementalInstance;
  lastSwitchTimestamp: number;
  setSelectedInstance: (instance: ElementalInstance) => void;
}

function getActiveCharacterId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('selectedCharacterId');
}

function getInitialElementalInstance(): ElementalInstance {
  if (typeof window === 'undefined') return 'gelo';
  const charId = getActiveCharacterId();
  if (!charId) return 'gelo';
  const key = `sov_elemental_instance_${charId}`;
  const saved = localStorage.getItem(key);
  if (saved === 'fogo' || saved === 'gelo' || saved === 'raio') return saved;
  return 'gelo';
}

export const useElementalInstanceStore = create<ElementalInstanceState>((set, get) => ({
  selectedInstance: getInitialElementalInstance(),
  lastSwitchTimestamp: 0,
  setSelectedInstance: (instance) => {
    const now = Date.now();
    const last = get().lastSwitchTimestamp;
    if (now - last < 2000) return;
    set({ selectedInstance: instance, lastSwitchTimestamp: now });
    if (typeof window !== 'undefined') {
      const charId = getActiveCharacterId();
      if (charId) {
        const key = `sov_elemental_instance_${charId}`;
        localStorage.setItem(key, instance);
      }
    }
  },
})); 