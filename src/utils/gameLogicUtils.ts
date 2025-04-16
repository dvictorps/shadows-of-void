// Utility functions related to core game mechanics like XP, levels, etc.

// Constants for travel time calculation
export const BASE_TRAVEL_TIME_MS = 5000;
export const MIN_TRAVEL_TIME_MS = 500;

export const calculateXPToNextLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

// Function to calculate travel time based on movement speed
export const calculateTravelTime = (
  baseTime: number,
  movementSpeed: number
): number => {
  const speedMultiplier = 1 - movementSpeed / 100;
  const calculatedTime = baseTime * speedMultiplier;
  return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
};

// export {}; // Remove empty export if we have actual exports 