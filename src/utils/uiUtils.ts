import { DAMAGE_TYPE_COLORS, RARITY_COLORS } from '../constants/gameConstants';
import { EnemyDamageType, ItemRarity } from '../types/gameData';

// Format numbers with appropriate suffixes
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format percentage with proper display
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

// Get color for damage type
export const getDamageTypeColor = (damageType: EnemyDamageType): string => {
  return DAMAGE_TYPE_COLORS[damageType] || '#FFFFFF';
};

// Get color for item rarity
export const getRarityColor = (rarity: ItemRarity): string => {
  return RARITY_COLORS[rarity] || '#FFFFFF';
};

// Get display name for damage type in Portuguese
export const getDamageTypeDisplayName = (type: EnemyDamageType): string => {
  const displayNames = {
    physical: 'Físico',
    cold: 'Frio',
    void: 'Vazio',
    fire: 'Fogo',
    lightning: 'Raio',
  };
  return displayNames[type] || type;
};

// Calculate percentage of current vs max
export const calculatePercentage = (current: number, max: number): number => {
  if (max === 0) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
};

// Generate unique ID for components
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// Random number between min and max (inclusive)
export const randomBetween = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Format time in milliseconds to readable format
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

// Debounce function for performance optimization
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for performance optimization
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;
  return (...args: Parameters<T>) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

// Check if value is defined and not null
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

// Safe array access with default
export const safeArrayAccess = <T>(array: T[], index: number, defaultValue: T): T => {
  return array[index] ?? defaultValue;
};

// Create CSS class names conditionally
export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
}; 