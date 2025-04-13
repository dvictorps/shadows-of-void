"use client";

import React from "react";
import { FaArrowLeft, FaMapMarkerAlt } from "react-icons/fa";
import { Character, MapLocation } from "../types/gameData"; // Adjust path if needed

interface MapAreaProps {
  character: Character | null;
  locations: MapLocation[];
  onHoverLocation: (description: string) => void;
  onLeaveLocation: () => void;
  onBackClick: () => void;
}

// Helper function to create a unique key for lines
const getLineKey = (id1: string, id2: string): string => {
  return [id1, id2].sort().join("-");
};

const MapArea: React.FC<MapAreaProps> = ({
  character,
  locations,
  onHoverLocation,
  onLeaveLocation,
  onBackClick,
}) => {
  const currentAreaId = character?.currentAreaId;
  const unlockedAreaIds = new Set(character?.unlockedAreaIds || []);

  // Calculate lines between unlocked areas
  const linesToDraw: {
    key: string;
    x1: string;
    y1: string;
    x2: string;
    y2: string;
  }[] = [];
  const drawnLines = new Set<string>(); // To avoid drawing lines twice

  locations.forEach((loc) => {
    if (unlockedAreaIds.has(loc.id)) {
      // Calculate center percentage more accurately
      const locLeftPercent = parseFloat(loc.position.left);
      const locTopPercent = parseFloat(loc.position.top);
      // Estimate half marker size as percentage (adjust this value as needed)
      const offsetPercent = 1.5;
      const locCenterX = `${locLeftPercent + offsetPercent}%`;
      const locCenterY = `${locTopPercent + offsetPercent}%`;

      loc.connections?.forEach((connId) => {
        if (unlockedAreaIds.has(connId)) {
          const connectedLoc = locations.find((l) => l.id === connId);
          if (connectedLoc) {
            const lineKey = getLineKey(loc.id, connId);
            if (!drawnLines.has(lineKey)) {
              // Calculate connected center
              const connLeftPercent = parseFloat(connectedLoc.position.left);
              const connTopPercent = parseFloat(connectedLoc.position.top);
              const connCenterX = `${connLeftPercent + offsetPercent}%`;
              const connCenterY = `${connTopPercent + offsetPercent}%`;

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

  return (
    <div
      className="border border-white flex-grow p-10 relative mb-2 bg-gray-950" // Added dark bg
      style={{ minHeight: "70vh" }}
    >
      {/* Back Button */}
      <button
        onClick={onBackClick}
        className="absolute top-4 right-4 p-2 border border-white rounded text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-white z-20" // Ensure button is clickable
        aria-label="Back to Characters"
      >
        <FaArrowLeft />
      </button>
      {/* Draw Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {linesToDraw.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="white"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        ))}
      </svg>
      {/* Render Locations */}
      {locations.map((loc) => {
        const isCurrent = loc.id === currentAreaId;
        const isUnlocked = unlockedAreaIds.has(loc.id);
        const IconComponent = loc.icon; // Get icon component

        return (
          <div
            key={loc.id}
            className={`absolute p-2 border rounded-full transition-all duration-200 z-10 ${
              // Increased duration
              isUnlocked
                ? `cursor-pointer ${
                    isCurrent
                      ? "border-yellow-400 bg-gray-800 scale-110 shadow-lg"
                      : "border-white bg-gray-900 hover:bg-gray-700 hover:scale-105"
                  }` // Unlocked styles
                : "cursor-not-allowed border-gray-600 bg-gray-950 opacity-50" // Locked styles
            }`}
            style={{ top: loc.position.top, left: loc.position.left }}
            onMouseEnter={() => isUnlocked && onHoverLocation(loc.description)}
            onMouseLeave={() => isUnlocked && onLeaveLocation()}
            // onClick={() => isUnlocked && handleTravel(loc.id)} // Add travel later
          >
            {/* Render the specific icon or a default */}
            {IconComponent ? (
              <IconComponent
                className={`text-xl ${
                  isUnlocked ? "text-white" : "text-gray-500"
                }`}
              />
            ) : (
              <div
                className={`w-4 h-4 rounded-full ${
                  isUnlocked ? "bg-white" : "bg-gray-600"
                }`}
              ></div> // Default marker
            )}

            {/* Marker Icon (if current location) */}
            {isCurrent && isUnlocked && (
              <FaMapMarkerAlt className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-lg text-yellow-400" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MapArea;
