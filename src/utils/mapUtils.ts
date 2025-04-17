// Utility functions related to map, travel, and areas.

export const MIN_TRAVEL_TIME_MS = 500;

export const calculateTravelTime = (
  baseTime: number,
  movementSpeed: number
): number => {
  const speedMultiplier = 1 - movementSpeed / 100;
  const calculatedTime = baseTime * speedMultiplier;
  return Math.max(calculatedTime, MIN_TRAVEL_TIME_MS);
};

// export {}; // Remove empty export if we have actual exports 