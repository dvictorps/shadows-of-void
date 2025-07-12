import {
  Character,
  OverallGameData,
  defaultCharacters,
  defaultOverallData,
} from '../types/gameData';

const CHARACTERS_KEY = 'shadowsOfVoid_characters';
const CHARACTERS_HC_KEY = 'shadowsOfVoid_characters_hardcore';
const OVERALL_DATA_KEY = 'shadowsOfVoid_overallGameData';
const OVERALL_DATA_HC_KEY = 'shadowsOfVoid_overallGameData_hardcore';

// --- Character Data ---

export function loadCharacters(isHardcore = false): Character[] {
  if (typeof window === 'undefined') {
    return defaultCharacters;
  }
  try {
    const storedCharacters = localStorage.getItem(isHardcore ? CHARACTERS_HC_KEY : CHARACTERS_KEY);
    if (storedCharacters) {
      return JSON.parse(storedCharacters) as Character[];
    }
  } catch (error) {
    console.error('Error loading characters from localStorage:', error);
  }
  return defaultCharacters;
}

export function saveCharacters(characters: Character[], isHardcore = false): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(isHardcore ? CHARACTERS_HC_KEY : CHARACTERS_KEY, JSON.stringify(characters));
  } catch (error) {
    console.error('Error saving characters to localStorage:', error);
  }
}

// --- Overall Game Data ---

export const loadOverallData = (isHardcore = false): OverallGameData => {
  if (typeof window === "undefined") return { ...defaultOverallData };
  try {
    const data = localStorage.getItem(isHardcore ? OVERALL_DATA_HC_KEY : OVERALL_DATA_KEY);
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

export function saveOverallData(data: OverallGameData, isHardcore = false): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(isHardcore ? OVERALL_DATA_HC_KEY : OVERALL_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving overall game data to localStorage:', error);
  }
} 