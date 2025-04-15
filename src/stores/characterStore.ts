import { create } from 'zustand';
import { Character } from '../types/gameData';
import { saveCharacters, loadCharacters } from '../utils/localStorage';
import { calculateEffectiveStats } from '../utils/statUtils';

// Define amount potion heals (e.g., 30% of max health)
const POTION_HEAL_PERCENT = 0.30;

// Define the state structure and actions
interface CharacterState {
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character | null) => void;
  updateCharacter: (updatedCharData: Partial<Character>) => void;
  saveCharacter: () => void;
  // --- TODO: Add inventory/modal states and actions later ---
  usePotion: () => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  activeCharacter: null,

  // Action to set the entire active character (e.g., on load or death)
  setActiveCharacter: (character) => {
    set({ activeCharacter: character });
  },

  // Action to update parts of the active character state
  updateCharacter: (updatedCharData) => set((state) => {
    if (!state.activeCharacter) {
        console.warn("[Zustand] Attempted to update character, but none is active.");
        return {};
    }

    // <<< Log received data >>>
    console.log("[Zustand updateCharacter] Received updatedCharData:", updatedCharData);

    const newCharacterState = {
        ...state.activeCharacter,
        ...updatedCharData,
    };
    return { activeCharacter: newCharacterState };
  }),

  // Action to save the current active character state to localStorage
  saveCharacter: () => {
    const currentActiveCharacter = get().activeCharacter;

    if (!currentActiveCharacter) {
        console.warn("[Zustand Store] Attempted to save character, but none is active.");
        return;
    }
    if (currentActiveCharacter.id === undefined || currentActiveCharacter.id === null) {
        console.error("[Zustand Store] Cannot save character: ID is missing or invalid.", currentActiveCharacter);
        return;
    }

    try {
        const allCharacters = loadCharacters();

        const charIndex = allCharacters.findIndex((c) => c.id === currentActiveCharacter.id);

        if (charIndex !== -1) {
            allCharacters[charIndex] = currentActiveCharacter;
            saveCharacters(allCharacters);
        } else {
            console.error(
                `[Zustand Store] Could not find character with ID ${currentActiveCharacter.id} in localStorage list to save update.`,
                {
                    activeCharInStore: currentActiveCharacter,
                    charactersLoadedFromStorage: allCharacters
                }
            );
        }
    } catch (error) {
        console.error("[Zustand Store] Error during character save process:", error);
    }
  },

  // --- Action to use a health potion ---
  usePotion: () => set((state) => {
    if (!state.activeCharacter) {
      console.warn("[Zustand Store] Attempted to use potion, but no character is active.");
      return {}; // No change
    }

    const { activeCharacter } = state;

    if (activeCharacter.healthPotions <= 0) {
      console.log("[Zustand Store] No health potions remaining.");
      return {}; // No change
    }

    // <<< Calculate max health dynamically >>>
    const currentEffectiveStats = calculateEffectiveStats(activeCharacter);
    const actualMaxHealth = currentEffectiveStats.maxHealth;

    if (activeCharacter.currentHealth >= actualMaxHealth) { // Use calculated max
      console.log("[Zustand Store] Character already at full health.");
      return {}; // No change
    }

    const healAmount = Math.round(actualMaxHealth * POTION_HEAL_PERCENT); // Use calculated max
    const newHealth = Math.min(activeCharacter.currentHealth + healAmount, actualMaxHealth); // Use calculated max
    const newPotionCount = activeCharacter.healthPotions - 1;

    console.log(`[Zustand Store] Used potion. Healing for ${healAmount}. Health: ${activeCharacter.currentHealth} -> ${newHealth}. Potions left: ${newPotionCount}`);

    return {
      activeCharacter: {
        ...activeCharacter,
        currentHealth: newHealth,
        healthPotions: newPotionCount,
      }
    };
  }),

  // --- TODO: Implement inventory/modal actions ---

}));
