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

// Utils for world map area connections and marker calculations
import { MapLocation } from "@/types/gameData";

export function getMarkerCenter(position: { left: string; top: string }, offsetPercent = 1.5) {
  const left = parseFloat(position.left);
  const top = parseFloat(position.top);
  return {
    x: `${left + offsetPercent}%`,
    y: `${top + offsetPercent}%`,
  };
}

export function getMapConnectionLines(locations: MapLocation[], unlockedAreaIds: Set<string>, offsetPercent = 1.5) {
  const linesToDraw: {
    key: string;
    x1: string;
    y1: string;
    x2: string;
    y2: string;
  }[] = [];
  const drawnLines = new Set<string>();

  const getLineKey = (id1: string, id2: string) => [id1, id2].sort().join("-");

  locations.forEach((loc) => {
    if (unlockedAreaIds.has(loc.id)) {
      const { x: locCenterX, y: locCenterY } = getMarkerCenter(loc.position, offsetPercent);
      loc.connections?.forEach((connId) => {
        if (unlockedAreaIds.has(connId)) {
          const connectedLoc = locations.find((l) => l.id === connId);
          if (connectedLoc) {
            const lineKey = getLineKey(loc.id, connId);
            if (!drawnLines.has(lineKey)) {
              const { x: connCenterX, y: connCenterY } = getMarkerCenter(connectedLoc.position, offsetPercent);
              linesToDraw.push({
                key: lineKey,
                x1: locCenterX,
                y1: locCenterY,
                x2: connCenterX,
                y2: connCenterY,
              });
              drawnLines.add(lineKey);
            }
          }
        }
      });
    }
  });
  return linesToDraw;
}

export function isAreaConnected(currentAreaId: string | null, targetAreaId: string, locations: MapLocation[]): boolean {
  if (!currentAreaId) return false;
  const current = locations.find((l) => l.id === currentAreaId);
  return !!current?.connections?.includes(targetAreaId);
} 