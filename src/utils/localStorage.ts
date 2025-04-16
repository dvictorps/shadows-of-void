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

export function loadOverallData(): OverallGameData {
  if (typeof window === 'undefined') {
    return defaultOverallData;
  }
  try {
    const storedData = localStorage.getItem(OVERALL_DATA_KEY);
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const mergedCurrencies = {
        ...defaultOverallData.currencies,
        ...(parsedData.currencies || {})
      };
      return {
        ...defaultOverallData,
        ...parsedData,
        currencies: mergedCurrencies
      };
    }
  } catch (error) {
    console.error('Error loading overall game data from localStorage:', error);
  }
  return defaultOverallData;
}

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