"use client"; // Add if using client-side hooks indirectly or for consistency

import React from "react";
import { Character } from "../types/gameData"; // Adjust path if needed

// Define props for CharacterStats
interface CharacterStatsProps {
  character: Character | null; // Character data or null if not loaded/found
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ character }) => {
  // Calculate health percentage INSIDE this component
  const healthPercentage = character
    ? character.maxHealth > 0
      ? (character.currentHealth / character.maxHealth) * 100
      : 0
    : 0;

  // Calculate XP percentage based on currentXP and a placeholder next level XP
  // We'll need the calculateXPForNextLevel function later for accuracy
  const xpForNextLevel = character ? 100 + character.level * 50 : 100; // Placeholder
  const xpPercentage = character
    ? (character.currentXP / xpForNextLevel) * 100
    : 0;

  // Helper functions for display
  const displayValue = (value: number | undefined | null, suffix = "") =>
    value !== null && value !== undefined ? `${value}${suffix}` : "-";
  const displayPercentage = (value: number | undefined | null) =>
    displayValue(value, "%");

  return (
    // Add relative positioning to the main container
    <div className="border border-white p-4 flex flex-col text-[10px] relative">
      {/* Name and Class */}
      <div className="flex justify-between mb-2 pb-1">
        <span className="font-semibold">{character?.name ?? "-"}</span>
        <span>{character?.class ?? "-"}</span>
      </div>

      {/* Level and XP Bar */}
      <div className="mb-3">
        <span className="block">Lvl {character?.level ?? "-"}</span>
        <div className="w-full bg-gray-700 rounded h-1.5 border border-gray-500 overflow-hidden mt-1">
          <div
            className="bg-white h-full transition-all duration-300 ease-linear"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
        <span className="text-[10px] text-gray-400 block text-right">
          {displayValue(character?.currentXP)} / {displayValue(xpForNextLevel)}{" "}
          XP
        </span>
      </div>

      {/* Stats Grid - Use CORRECT fields from Character type */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 flex-grow leading-tight">
        <span>Armadura: {displayValue(character?.armor)}</span>
        <span>Evasão: {displayValue(character?.evasion)}</span>
        <span>Barreira: {displayValue(character?.barrier)}</span>
        <span>Bloqueio: {displayPercentage(character?.blockChance)}</span>
        {/* Remove Vida display */}
        {/* <span>Vida: {displayValue(character?.currentHealth)} / {displayValue(character?.maxHealth)}</span> */}
        {/* Add an empty span for alignment if needed, or adjust grid cols */}
        {/* <span></span> */}

        {/* Resistances Title */}
        <span className="col-span-2 mt-1 pt-0.5 font-semibold">
          Resistências:
        </span>
        <span>Fogo: {displayPercentage(character?.fireResistance)}</span>
        <span>Gelo: {displayPercentage(character?.coldResistance)}</span>
        <span>Raio: {displayPercentage(character?.lightningResistance)}</span>
        <span>Void: {displayPercentage(character?.voidResistance)}</span>

        {/* Damage Title - Optional */}
        {/* <span className="col-span-2 mt-1 pt-0.5 font-semibold">
            Dano:
          </span> */}
        {/* Display relevant damage stats */}
        <span>Ataque: {displayValue(character?.attackDamage)}</span>
        <span>Magia: {displayValue(character?.spellDamage)}</span>
        {/* Add more damage types if desired */}
      </div>

      {/* Health Orb - SVG Implementation (Moved Here) */}
      <svg
        // Positioned bottom-right, slightly smaller
        className="absolute bottom-1 right-1 w-16 h-16 overflow-visible"
        viewBox="0 0 100 100"
      >
        <defs>
          <clipPath id="healthClipPath">
            <rect
              x="0"
              y={100 - healthPercentage}
              width="100"
              height={healthPercentage}
            />
          </clipPath>
        </defs>
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#1f2937"
          stroke="white"
          strokeWidth="2"
        />
        {/* Health Fill (Red) - Clipped */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#991b1b"
          clipPath="url(#healthClipPath)"
        />
        {/* Health Text */}
        <text
          x="50%"
          y="50%"
          dy=".3em"
          textAnchor="middle"
          fill="white"
          fontSize="10" // Smaller text for smaller orb
          fontWeight="600"
        >
          {character?.currentHealth ?? "-"} / {character?.maxHealth ?? "-"}
        </text>
      </svg>
    </div>
  );
};

export default CharacterStats; // Export the component
