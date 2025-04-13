// src/types/gameData.ts

// Define possible character classes
export type CharacterClass = 'Guerreiro' | 'Ladino' | 'Mago';

// Define the structure for a single character
export interface Character {
  id: number; // Unique identifier (e.g., timestamp or generated ID)
  name: string;
  class: CharacterClass;
  level: number; // Assuming level is still relevant
  attributes: {
    strength: number;
    intelligence: number;
    dexterity: number;
  };
  // Add other character-specific fields later (inventory, skills, etc.)
}

// Define the structure for overall game data
export interface OverallGameData {
  currencies: {
    ruby: number;
    sapphire: number;
    voidCrystals: number;
  };
  lastPlayedCharacterId: number | null; // Optional: track last selected
  // Add other global fields later (settings, unlocked features, etc.)
}

// Default values when no data is found in localStorage
export const defaultOverallData: OverallGameData = {
  currencies: {
    ruby: 0,
    sapphire: 0,
    voidCrystals: 0,
  },
  lastPlayedCharacterId: null,
};

export const defaultCharacters: Character[] = []; 