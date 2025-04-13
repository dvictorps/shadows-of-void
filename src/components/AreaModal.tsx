"use client";

import React from "react";
import Modal from "./Modal"; // Assuming Modal is in the same components folder
import Button from "./Button"; // Assuming Button is in the same components folder
import { Character, MapLocation } from "../types/gameData"; // Adjust path if needed

// --- Health Orb SVG (Copied and adapted) ---
const HealthOrb: React.FC<{ character: Character | null }> = ({
  character,
}) => {
  if (!character) return null;

  const healthPercentage =
    character.maxHealth > 0
      ? (character.currentHealth / character.maxHealth) * 100
      : 0;

  return (
    <svg
      className="w-16 h-16 overflow-visible" // Slightly smaller size for modal
      viewBox="0 0 100 100"
    >
      <defs>
        <clipPath id="modalHealthClipPath">
          <rect
            x="0"
            y={100 - healthPercentage}
            width="100"
            height={healthPercentage}
          />
        </clipPath>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#1f2937"
        stroke="white"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="#991b1b"
        clipPath="url(#modalHealthClipPath)"
      />
      <text
        x="50%"
        y="50%"
        dy=".3em"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="600"
      >
        {character.currentHealth ?? "-"} / {character.maxHealth ?? "-"}
      </text>
    </svg>
  );
};

// --- XP Bar (Simplified, needs calculation logic) ---
const ExpBar: React.FC<{ character: Character | null }> = ({ character }) => {
  if (!character) return null;

  // Placeholder - Replace with actual calculation using utility function later
  const xpForNextLevel = 100 + character.level * 50;
  const xpPercentage = (character.currentXP / xpForNextLevel) * 100 || 0;

  return (
    <div className="flex-grow mx-4">
      <div className="w-full bg-gray-700 rounded h-4 border border-gray-500 overflow-hidden">
        <div
          className="bg-purple-500 h-full transition-all duration-300 ease-linear text-right pr-1 text-xs leading-tight"
          style={{ width: `${xpPercentage}%` }}
        >
          {/* Optionally show percentage inside */}
          {/* {Math.floor(xpPercentage)}% */}
        </div>
      </div>
      <span className="text-[10px] text-gray-400 block text-center mt-0.5">
        XP: {character.currentXP ?? "-"} / {xpForNextLevel}
      </span>
    </div>
  );
};

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
  area: MapLocation | null;
  onFlee: () => void; // Handler for the flee button
}

const AreaModal: React.FC<AreaModalProps> = ({
  isOpen,
  onClose,
  character,
  area,
  onFlee,
}) => {
  if (!area) return null; // Don't render if no area selected

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={area.name} // Use area name as title
      actions={<></>} // Provide empty actions to satisfy prop type
    >
      <div className="flex flex-col min-h-[40vh]">
        {" "}
        {/* Ensure minimum height */}
        {/* Main content area - add area details/monsters/actions later */}
        <div className="flex-grow p-4 text-center">
          <p>{area.description}</p>
          {/* TODO: Add area content (monsters, interactions, etc.) */}
        </div>
        {/* Bottom Bar */}
        <div className="flex items-center justify-between p-2 border-t border-gray-600 mt-auto">
          {/* Left: Health Orb */}
          <HealthOrb character={character} />

          {/* Middle: XP Bar */}
          <ExpBar character={character} />

          {/* Right: Flee Button */}
          <Button onClick={onFlee}>Fugir</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AreaModal;
