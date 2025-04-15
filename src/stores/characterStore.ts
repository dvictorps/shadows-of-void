import { create } from 'zustand';
import { Character } from '../types/gameData';
import { saveCharacters, loadCharacters } from '../utils/localStorage';

// Define the state structure and actions
interface CharacterState {
  activeCharacter: Character | null;
  setActiveCharacter: (character: Character | null) => void;
  updateCharacter: (updatedCharData: Partial<Character>) => void;
  saveCharacter: () => void;
  // --- TODO: Add inventory/modal states and actions later ---
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

  // --- TODO: Implement inventory/modal actions ---

}));
