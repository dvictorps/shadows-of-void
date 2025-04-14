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
    console.log("[Zustand] Setting active character:", character?.name ?? 'null');
    set({ activeCharacter: character });
  },

  // Action to update parts of the active character state
  updateCharacter: (updatedCharData) => set((state) => {
    if (!state.activeCharacter) {
        console.warn("[Zustand] Attempted to update character, but none is active.");
        return {}; // No character to update
    }
    // Merge the existing character with the partial updates
    const newCharacterState = {
        ...state.activeCharacter,
        ...updatedCharData,
    };
    console.log("[Zustand] Updating character state:", updatedCharData, "Result:", newCharacterState);
    return { activeCharacter: newCharacterState };
  }),

  // Action to save the current active character state to localStorage
  saveCharacter: () => {
    const currentActiveCharacter = get().activeCharacter; // Get current state directly

    // --- Enhanced Logging and Checks --- START
    if (!currentActiveCharacter) {
        console.warn("[Zustand Store] Attempted to save character, but none is active.");
        return;
    }

    // Check if the ID is missing/undefined BEFORE trying to save
    if (currentActiveCharacter.id === undefined || currentActiveCharacter.id === null) {
        console.error("[Zustand Store] Cannot save character: ID is missing or invalid.", currentActiveCharacter);
        return;
    }
    // --- Enhanced Logging and Checks --- END

    console.log(`[Zustand Store] Attempting to save character ID: ${currentActiveCharacter.id} (${currentActiveCharacter.name})`); // Log ID being saved

    try {
        const allCharacters = loadCharacters();
        // Log the IDs found in localStorage for comparison
        console.log("[Zustand Store] IDs found in localStorage:", allCharacters.map(c => c.id));

        const charIndex = allCharacters.findIndex((c) => c.id === currentActiveCharacter.id);

        if (charIndex !== -1) {
            allCharacters[charIndex] = currentActiveCharacter; // Use the character from the store's state
            saveCharacters(allCharacters);
            console.log(`[Zustand Store] Character ${currentActiveCharacter.name} (ID: ${currentActiveCharacter.id}) saved successfully.`);
        } else {
            // Log more details if findIndex fails
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
