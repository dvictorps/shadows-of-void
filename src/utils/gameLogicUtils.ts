// Utility functions related to core game mechanics like XP, levels, etc.
import { GAME_CONSTANTS } from '../constants/gameConstants';

// Re-export constants for backward compatibility
export const BASE_TRAVEL_TIME_MS = GAME_CONSTANTS.BASE_TRAVEL_TIME_MS;
export const MIN_TRAVEL_TIME_MS = GAME_CONSTANTS.MIN_TRAVEL_TIME_MS;

export const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(GAME_CONSTANTS.XP_BASE_MULTIPLIER * Math.pow(GAME_CONSTANTS.XP_LEVEL_MULTIPLIER, level - 1));
};

// Function to calculate travel time based on movement speed
export const calculateTravelTime = (
  baseTime: number,
  movementSpeedPercent: number
): number => {
  // Calculate speed multiplier: 100% speed = 1.0 multiplier, 120% speed = 0.8 multiplier, etc.
  const speedMultiplier = 1 / (1 + movementSpeedPercent / 100);
  const calculatedTime = baseTime * speedMultiplier;
  console.log(`[calculateTravelTime] Base: ${baseTime}, MS%: ${movementSpeedPercent}, Multiplier: ${speedMultiplier.toFixed(3)}, Calculated: ${calculatedTime.toFixed(0)}`);
  return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
};

// export {}; // Remove empty export if we have actual exports 