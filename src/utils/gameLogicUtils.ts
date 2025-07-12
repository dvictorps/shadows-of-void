// Utility functions related to core game mechanics like XP, levels, etc.

// Constants for travel time calculation
export const BASE_TRAVEL_TIME_MS = 1000;
export const MIN_TRAVEL_TIME_MS = 500;

export const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// Function to calculate travel time based on movement speed
export const calculateTravelTime = (
  baseTime: number,
  movementSpeedPercent: number
): number => {
  // Calculate speed multiplier: 100% speed = 1.0 multiplier, 120% speed = 0.8 multiplier, etc.
  const speedMultiplier = 1 / (1 + movementSpeedPercent / 100);
  const calculatedTime = baseTime * speedMultiplier;
  return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
};

// Procure por lógica de level up do mago e ajuste o scaling de vida máxima
// Exemplo:
// updates.baseMaxHealth = char.baseMaxHealth + (7 * levelDifference); 