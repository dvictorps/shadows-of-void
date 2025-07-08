import {
  Character,
  OverallGameData,
  defaultCharacters,
  defaultOverallData,
} from '../types/gameData';

const CHARACTERS_KEY = 'shadowsOfVoid_characters';
const OVERALL_DATA_KEY = 'shadowsOfVoid_overallGameData';

// --- Character Data ---

export function loadCharacters(): Character[] {
  if (typeof window === 'undefined') {
    return defaultCharacters;
  }
  try {
    const storedCharacters = localStorage.getItem(CHARACTERS_KEY);
    if (storedCharacters) {
      return JSON.parse(storedCharacters) as Character[];
    }
  } catch (error) {
    console.error('Error loading characters from localStorage:', error);
  }
  return defaultCharacters;
}

export function saveCharacters(characters: Character[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(CHARACTERS_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error('Error saving characters to localStorage:', error);
  }
}

// --- Overall Game Data ---

export const loadOverallData = (): OverallGameData => {
  if (typeof window === "undefined") return { ...defaultOverallData };
  try {
    const data = localStorage.getItem(OVERALL_DATA_KEY);
    if (data) {
      const parsedData: OverallGameData = JSON.parse(data);
      // <<< Ensure stash exists (for backward compatibility) >>>
      if (!parsedData.stash) {
        parsedData.stash = [];
      }
      // Ensure currencies exist
      if (!parsedData.currencies) {
        parsedData.currencies = { ...defaultOverallData.currencies };
      } else {
        // Ensure individual currencies exist
        if (parsedData.currencies.ruby === undefined || parsedData.currencies.ruby === null) {
            parsedData.currencies.ruby = defaultOverallData.currencies.ruby;
        }
        if (parsedData.currencies.windCrystals === undefined || parsedData.currencies.windCrystals === null) {
            parsedData.currencies.windCrystals = defaultOverallData.currencies.windCrystals;
        }
      }
      // Ensure lastPlayedCharacterId exists
      if (parsedData.lastPlayedCharacterId === undefined) {
          parsedData.lastPlayedCharacterId = defaultOverallData.lastPlayedCharacterId;
      }

      return parsedData;
    } else {
      return { ...defaultOverallData }; // Return a copy of the default
    }
  } catch (error) {
    console.error("Error loading overall game data:", error);
    return { ...defaultOverallData }; // Return a copy on error
  }
};

export function saveOverallData(data: OverallGameData): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(OVERALL_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving overall game data to localStorage:', error);
  }
} 