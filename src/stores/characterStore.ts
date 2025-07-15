import { create } from 'zustand';
import { Character } from '../types/gameData';
import { saveCharacters, loadCharacters } from '../utils/localStorage';
import { calculateEffectiveStats, EffectiveStats } from '../utils/statUtils/weapon';

// Define amount potion heals (e.g., 30% of max health)
const POTION_HEAL_PERCENT = 0.30;

// Define the state structure and actions
export interface CharacterState {
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
    let finalCharacterState = character;
    if (finalCharacterState) {
        try {
            const stats = calculateEffectiveStats(finalCharacterState);
            console.log(`[Zustand setActiveCharacter] Setting initial barrier for ${finalCharacterState.name}. Calculated max: ${stats.totalBarrier}`);
            finalCharacterState = {
                ...finalCharacterState,
                currentBarrier: stats.totalBarrier, // Set current barrier to max on activation
                // Optional: Clamp health here too just in case?
                // currentHealth: Math.min(finalCharacterState.currentHealth, stats.maxHealth),
            };
        } catch (e) {
            console.error("[Zustand setActiveCharacter] Error calculating stats during initial barrier set:", e);
            // Proceed with the original character if calculation fails
        }
    }
    set({ activeCharacter: finalCharacterState });
  },

  // Action to update parts of the active character state
  updateCharacter: (updatedCharData) => set((state) => {
    if (!state.activeCharacter) {
        console.warn("[Zustand] Attempted to update character, but none is active.");
        return {};
    }

    console.log("[Zustand updateCharacter] Received updatedCharData:", updatedCharData);

    // 1. Merge the updates to get the potential new character state
    const potentiallyUpdatedCharacter: Character = {
        ...state.activeCharacter,
        ...updatedCharData,
    };

    // 2. Recalculate effective stats based on the *potentially* updated character
    //    (This is crucial if equipment changed in updatedCharData)
    let currentHealth = potentiallyUpdatedCharacter.currentHealth;
    let currentBarrier = potentiallyUpdatedCharacter.currentBarrier ?? 0; // Handle potential null/undefined
    let currentMana = potentiallyUpdatedCharacter.currentMana;
    let recalculatedStats: EffectiveStats | null = null;

    try {
      recalculatedStats = calculateEffectiveStats(potentiallyUpdatedCharacter);

      // 3. Clamp current health if it exceeds the new max health
      if (currentHealth > recalculatedStats.maxHealth) {
        console.log(`[Zustand updateCharacter] Clamping health: ${currentHealth} > ${recalculatedStats.maxHealth}`);
        currentHealth = recalculatedStats.maxHealth;
      }

      // 4. Clamp current barrier if it exceeds the new total barrier
      if (currentBarrier > recalculatedStats.totalBarrier) {
        console.log(`[Zustand updateCharacter] Clamping barrier: ${currentBarrier} > ${recalculatedStats.totalBarrier}`);
        currentBarrier = recalculatedStats.totalBarrier;
      }

      // 5. Clamp current mana if it exceeds the new max mana
      if (currentMana > (potentiallyUpdatedCharacter.maxMana ?? 0)) {
        console.log(`[Zustand updateCharacter] Clamping mana: ${currentMana} > ${potentiallyUpdatedCharacter.maxMana}`);
        currentMana = potentiallyUpdatedCharacter.maxMana ?? 0;
      }

    } catch (e) {
      console.error("[Zustand updateCharacter] Error calculating stats during update/clamp:", e);
      // If stats calc fails, we probably shouldn't clamp based on potentially wrong old stats
      // Just proceed with the original merge without clamping in this error case.
    }

    // 5. Construct the final state with potentially clamped values
    const finalCharacterState: Character = {
      ...potentiallyUpdatedCharacter,
      currentHealth: currentHealth, // Use the potentially clamped value
      currentBarrier: currentBarrier, // Use the potentially clamped value
      currentMana: currentMana, // Use the potentially clamped value
    };

    return { activeCharacter: finalCharacterState };
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
