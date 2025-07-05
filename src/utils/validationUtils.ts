import { Character, EnemyInstance, MapLocation, EquippableItem } from '../types/gameData';
import { GAME_CONSTANTS } from '../constants/gameConstants';

// Validate character data
export const validateCharacter = (character: Character | null): boolean => {
  if (!character) return false;
  
  return (
    character.id !== undefined &&
    !!character.name &&
    character.level > 0 &&
    character.level <= GAME_CONSTANTS.MAX_LEVEL &&
    character.currentHealth >= 0 &&
    character.maxHealth > 0 &&
    character.currentHealth <= character.maxHealth
  );
};

// Validate enemy instance
export const validateEnemyInstance = (enemy: EnemyInstance | null): boolean => {
  if (!enemy) return false;
  
  return (
    !!enemy.instanceId &&
    !!enemy.typeId &&
    enemy.level > 0 &&
    enemy.maxHealth > 0 &&
    enemy.currentHealth >= 0 &&
    enemy.currentHealth <= enemy.maxHealth &&
    enemy.damage >= 0 &&
    enemy.attackSpeed > 0
  );
};

// Validate map location
export const validateMapLocation = (location: MapLocation | null): boolean => {
  if (!location) return false;
  
  return (
    !!location.id &&
    !!location.name &&
    location.level > 0 &&
    Array.isArray(location.possibleEnemies) &&
    Array.isArray(location.connections)
  );
};

// Validate item
export const validateItem = (item: EquippableItem | null): boolean => {
  if (!item) return false;
  
  return (
    !!item.id &&
    !!item.baseId &&
    !!item.name &&
    !!item.itemType &&
    !!item.rarity &&
    Array.isArray(item.modifiers)
  );
};

// Validate numeric range
export const validateRange = (value: number, min: number, max: number): boolean => {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
};

// Validate percentage
export const validatePercentage = (value: number): boolean => {
  return validateRange(value, 0, 100);
};

// Validate resistance value
export const validateResistance = (value: number): boolean => {
  return validateRange(value, -100, GAME_CONSTANTS.MAX_RESISTANCE_PERCENT);
};

// Validate block chance
export const validateBlockChance = (value: number): boolean => {
  return validateRange(value, 0, GAME_CONSTANTS.MAX_BLOCK_CHANCE_PERCENT);
};

// Validate level
export const validateLevel = (level: number): boolean => {
  return validateRange(level, 1, GAME_CONSTANTS.MAX_LEVEL);
};

// Validate health values
export const validateHealth = (current: number, max: number): boolean => {
  return (
    typeof current === 'number' &&
    typeof max === 'number' &&
    !isNaN(current) &&
    !isNaN(max) &&
    current >= 0 &&
    max > 0 &&
    current <= max
  );
};

// Validate XP values
export const validateXP = (current: number, required: number): boolean => {
  return (
    typeof current === 'number' &&
    typeof required === 'number' &&
    !isNaN(current) &&
    !isNaN(required) &&
    current >= 0 &&
    required > 0
  );
};

// Sanitize string input
export const sanitizeString = (input: string, maxLength: number = 100): string => {
  return input.trim().substring(0, maxLength);
};

// Clamp number to safe range
export const clampNumber = (value: number, min: number, max: number): number => {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
};

// Check if array is valid and not empty
export const isValidArray = <T>(arr: T[] | null | undefined): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

// Check if object has required properties
export const hasRequiredProperties = <T extends Record<string, unknown>>(
  obj: T | null | undefined,
  requiredProps: (keyof T)[]
): obj is T => {
  if (!obj || typeof obj !== 'object') return false;
  
  return requiredProps.every(prop => 
    Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop] !== undefined && obj[prop] !== null
  );
};

// Validate game state consistency
export const validateGameState = (
  character: Character | null,
  area: MapLocation | null,
  enemy: EnemyInstance | null
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!validateCharacter(character)) {
    errors.push('Invalid character data');
  }
  
  if (!validateMapLocation(area)) {
    errors.push('Invalid area data');
  }
  
  if (enemy && !validateEnemyInstance(enemy)) {
    errors.push('Invalid enemy data');
  }
  
  // Check if character is in valid area
  if (character && area && !character.unlockedAreaIds.includes(area.id)) {
    errors.push('Character cannot access this area');
  }
  
  // Check if enemy belongs to area
  if (enemy && area && !area.possibleEnemies.includes(enemy.typeId)) {
    errors.push('Enemy does not belong to this area');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 