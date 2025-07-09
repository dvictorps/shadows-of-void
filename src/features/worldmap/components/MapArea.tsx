"use client";

import React, { useState } from "react";
import { FaArrowLeft, FaMapMarkerAlt, FaVolumeUp } from "react-icons/fa";
import { Character, MapLocation } from "@/types/gameData";
import VolumeModal from "./VolumeModal";
import { getMapConnectionLines, isAreaConnected } from "@/utils/mapUtils";

interface MapAreaProps {
  character: Character | null;
  locations: MapLocation[];
  onHoverLocation: (description: string) => void;
  onLeaveLocation: () => void;
  onBackClick: () => void;
  onAreaClick: (areaId: string) => void;
  onCurrentAreaClick: () => void;
  isTraveling: boolean;
  travelProgress: number;
  travelTargetAreaId: string | null;
  windCrystals: number;
}

const MapArea: React.FC<MapAreaProps> = ({
  character,
  locations,
  onHoverLocation,
  onLeaveLocation,
  onBackClick,
  onAreaClick,
  onCurrentAreaClick,
  isTraveling,
  travelProgress,
  travelTargetAreaId,
  windCrystals,
}) => {
  const currentAreaId = character?.currentAreaId;
  const unlockedAreaIds = new Set(character?.unlockedAreaIds || []);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);

  // Calculate lines between unlocked areas using util
  const linesToDraw = getMapConnectionLines(locations, unlockedAreaIds);

  return (
    <div
      className="border border-white flex-grow p-10 relative mb-2 bg-black overflow-hidden"
      style={{ minHeight: "70vh" }}
    >
      {/* Plano de fundo do mapa do ato 1 */}
      <img
        src="/maps/act1.png"
        alt="Mapa Ato 1"
        className="absolute inset-0 w-full h-full object-contain object-center select-none pointer-events-none z-0"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'absolute',
        }}
      />
      {/* Fadeout nas bordas da imagem do mapa */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(0,0,0,0.7) 100%)',
          // O gradiente cobre as bordas, deixando o centro nítido
        }}
      />
      {/* Back Button - Disable while traveling */}
      <button
        onClick={onBackClick}
        disabled={isTraveling}
        className={`absolute top-4 right-16 p-2 border border-white rounded text-white transition-colors focus:outline-none focus:ring-1 focus:ring-white z-20 ${
          isTraveling ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700"
        }`}
        aria-label="Back to Characters"
      >
        <FaArrowLeft />
      </button>
      {/* Volume Button */}
      <button
        onClick={() => setIsVolumeOpen(true)}
        className="absolute top-4 right-4 p-2 border border-white rounded text-white hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-white z-20"
        aria-label="Volume Settings"
      >
        <FaVolumeUp />
      </button>
      {/* Travel Progress Bar */}
      {isTraveling && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 rounded-none overflow-hidden z-20">
          <div
            className="h-full bg-blue-500 transition-width duration-100 ease-linear"
            style={{ width: `${travelProgress}%` }}
          ></div>
        </div>
      )}
      {/* Draw Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {linesToDraw.map((line) => {
          // Check if this line connects current area to travel target during travel
          const isTravelPathLine =
            isTraveling &&
            travelTargetAreaId &&
            currentAreaId &&
            ((line.key.startsWith(currentAreaId) &&
              line.key.endsWith(travelTargetAreaId)) ||
              (line.key.startsWith(travelTargetAreaId) &&
                line.key.endsWith(currentAreaId)));

          return (
            <React.Fragment key={line.key}>
              {/* Blinking Background Line (Only during travel and for the specific path) */}
              {isTravelPathLine && (
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#3b82f6" // Blue color (Tailwind blue-500)
                  strokeWidth="5" // Thicker than dashed line
                  className="animate-blinking-line"
                />
              )}
              {/* Original Dashed Line */}
              <line
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="white"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            </React.Fragment>
          );
        })}
      </svg>
      {/* Render Locations */}
      {locations.map((loc) => {
        const isCurrent = loc.id === currentAreaId;
        const isUnlocked = unlockedAreaIds.has(loc.id);
        const IconComponent = loc.icon; // Get icon component
        const isDestination = isTraveling && loc.id === travelTargetAreaId; // Check if it's the travel destination

        // Check if this location is connected to the current one
        const isConnectedToCurrent = isAreaConnected(currentAreaId ?? null, loc.id, locations);

        const canTravelTo = isUnlocked && !isCurrent && isConnectedToCurrent;
        const canWindCrystalTravelTo =
          isUnlocked && !isCurrent && !isConnectedToCurrent && windCrystals > 0;

        return (
          <div
            key={loc.id}
            className={`absolute p-2 border rounded-full transition-all duration-200 z-10 ${
              isUnlocked
                ? `${
                    isDestination
                      ? "border-blue-400 bg-gray-800 scale-110 shadow-lg cursor-default animate-blinking-glow"
                      : isCurrent
                      ? `border-white yellow-location-glow bg-gray-800 scale-110 shadow-lg ${
                          !isTraveling ? "cursor-pointer" : "cursor-default"
                        }`
                      : canTravelTo
                      ? "border-white bg-gray-900 hover:bg-blue-800 hover:scale-105 cursor-pointer"
                      : canWindCrystalTravelTo
                      ? "border-teal-400 bg-gray-900 hover:bg-teal-800 hover:scale-105 cursor-pointer wind-crystal-glow"
                      : "border-white bg-gray-900 cursor-default opacity-70"
                  }`
                : "cursor-not-allowed border-gray-600 bg-gray-950 opacity-50"
            }`}
            style={{ top: loc.position.top, left: loc.position.left }}
            onMouseEnter={() =>
              !isTraveling && isUnlocked && onHoverLocation(loc.description)
            }
            onMouseLeave={() => !isTraveling && isUnlocked && onLeaveLocation()}
            onClick={() => {
              if (!isTraveling) {
                if (canTravelTo || canWindCrystalTravelTo) {
                  onAreaClick(loc.id);
                } else if (isCurrent) {
                  onCurrentAreaClick();
                }
              }
            }}
          >
            {/* Render the specific icon or a default */}
            <div className="flex items-center justify-center w-4 h-4">
              {IconComponent ? (
                <IconComponent className="text-sm text-white" />
              ) : (
                <FaMapMarkerAlt className="text-sm text-gray-400" />
              )}
            </div>
            {/* Marker Icon (if current location) */}
            {isCurrent && isUnlocked && !isTraveling && (
              <FaMapMarkerAlt className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-lg text-yellow-400" />
            )}
          </div>
        );
      })}
      {/* Volume Modal */}
      <VolumeModal isOpen={isVolumeOpen} onClose={() => setIsVolumeOpen(false)} />
    </div>
  );
};

export default MapArea;
