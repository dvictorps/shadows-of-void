// Game Constants - Centralized configuration values
export const GAME_CONSTANTS = {
  // Combat
  GAME_LOOP_INTERVAL: 100, // milliseconds
  POTION_HEAL_PERCENT: 0.30, // 30% of max health
  ENEMY_DEATH_ANIMATION_DURATION: 500, // milliseconds
  UNARMED_ATTACK_SPEED: 1.0,
  
  // Travel
  BASE_TRAVEL_TIME_MS: 5000,
  MIN_TRAVEL_TIME_MS: 500,
  
  // XP and Leveling
  XP_PENALTY_ON_DEATH: 0.1, // 10% XP loss
  MAX_LEVEL: 100,
  XP_BASE_MULTIPLIER: 100,
  XP_LEVEL_MULTIPLIER: 1.15,
  
  // Health and Status
  LOW_HEALTH_THRESHOLD: 0.3, // 30% health
  MAX_RESISTANCE_PERCENT: 75,
  MAX_BLOCK_CHANCE_PERCENT: 75,
  
  // Default Values
  DEFAULT_KILLS_TO_COMPLETE: 30,
  DEFAULT_SPAWN_COOLDOWN: 1000,
  
  // UI
  DAMAGE_NUMBER_DISPLAY_DURATION: 1000,
  MESSAGE_DISPLAY_DURATION: 3000,
  
  // Audio
  SOUND_VOLUME: 0.5,
} as const;

// Enemy spawn delay ranges
export const ENEMY_SPAWN_DELAYS = {
  MIN: 500,
  MAX: 2000,
} as const;

// Damage type colors for UI
export const DAMAGE_TYPE_COLORS = {
  physical: '#8B4513',
  fire: '#FF4500',
  cold: '#00BFFF',
  lightning: '#FFD700',
  void: '#800080',
} as const;

// Item rarity colors
export const RARITY_COLORS = {
  Normal: '#FFFFFF',
  Mágico: '#0080FF',
  Raro: '#FFFF00',
  Lendário: '#FF8000',
} as const; 