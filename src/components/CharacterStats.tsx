"use client"; // Add if using client-side hooks indirectly or for consistency

import React, { useState } from "react";
import { Character } from "../types/gameData"; // Adjust path if needed
import {
  FaHeart,
  // FaTimes, // REMOVED - No longer used
  // Remove unused icons
  // FaShieldAlt,
  // FaRunning,
  // FaBolt,
  // FaFistRaised,
  // FaHatWizard,
  // FaStar,
} from "react-icons/fa"; // Removed FaPlus, FaMinus
import { calculateEffectiveStats, EffectiveStats } from "../utils/statUtils"; // IMPORT NEW UTIL

// Define props for CharacterStats
interface CharacterStatsProps {
  character: Character | null; // Character data or null if not loaded/found
  xpToNextLevel: number;
  totalStrength: number; // Add total strength
  totalDexterity: number; // Add total dexterity
  totalIntelligence: number; // Add total intelligence
}

const CharacterStats: React.FC<CharacterStatsProps> = ({
  character,
  xpToNextLevel,
  totalStrength, // Destructure new props
  totalDexterity,
  totalIntelligence,
}) => {
  // State to manage the single modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate effective stats IF character exists
  const effectiveStats: EffectiveStats | null = character
    ? calculateEffectiveStats(character)
    : null;

  if (!character || !effectiveStats) {
    // Check both character and effectiveStats
    return (
      <div className="p-4 border border-gray-600 bg-gray-800 rounded">
        Loading stats...
      </div>
    );
  }

  // Recalculate health percentage
  const healthPercentage =
    character.maxHealth > 0
      ? (character.currentHealth / character.maxHealth) * 100
      : 0;

  // Use xpToNextLevel from props for XP percentage calculation
  const xpPercentage =
    xpToNextLevel > 0 ? (character.currentXP / xpToNextLevel) * 100 : 0;

  // Placeholder potion handler (needs logic via props)
  const handleUsePotion = () => {
    if (character && character.healthPotions > 0) {
      console.log("Using potion (placeholder - needs state update via props)");
      // Logic to update character state (passed down via props) would go here
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // Function to render stats list for the modal (now shows both sections)
  const renderModalContent = () => {
    return (
      <>
        {/* Offensive Section FIRST */}
        <h5 className="text-md font-semibold text-white mb-2">Ofensivo</h5>
        <div className="space-y-1 text-sm mb-3">
          <p>
            Dano Efetivo: {effectiveStats.minDamage} -{" "}
            {effectiveStats.maxDamage}
          </p>
          <p>Vel. Ataque: {effectiveStats.attackSpeed.toFixed(2)}</p>
          <p>Chance Crítico: {effectiveStats.critChance.toFixed(2)}%</p>
          <p>Mult. Crítico: {effectiveStats.critMultiplier.toFixed(2)}%</p>
          <p>DPS Estimado: {effectiveStats.dps}</p>
          <hr className="border-gray-600 my-1" />
          {/* Keep these for now, might represent base spell/proj damage */}
          <p>Dano Projétil (Base): {character.projectileDamage}</p>
          <p>Dano Magia (Base): {character.spellDamage}</p>
          <p>Vel. Conjurar (Base): {character.castSpeed.toFixed(2)}</p>
          <p>Vel. Movimento: {character.movementSpeed}%</p>
        </div>

        <hr className="border-gray-600 my-2" />

        {/* Defensive Section LAST */}
        <h5 className="text-md font-semibold text-white mb-2">Defensivo</h5>
        <div className="space-y-1 text-sm">
          <p>
            Vida: {character.currentHealth} / {character.maxHealth}
          </p>
          <p>Armadura: {character.armor}</p>
          <p>Evasão: {character.evasion}</p>
          <p>Barreira: {effectiveStats.barrier}</p>
          <p>Chance de Bloqueio: {character.blockChance}%</p>
          <p>Resist. Fogo: {character.fireResistance}%</p>
          <p>Resist. Frio: {character.coldResistance}%</p>
          <p>Resist. Raio: {character.lightningResistance}%</p>
          <p>Resist. Vazio: {character.voidResistance}%</p>
        </div>
      </>
    );
  };

  return (
    // Change border to white
    <div className="relative p-4 border border-white bg-black rounded text-sm text-gray-200 pb-20">
      {/* Use Flexbox to separate left (Class/Level/XP) and right (Base Stats) */}
      <div className="flex justify-between items-start mb-2">
        {/* Left Column */}
        <div className="flex-grow pr-4">
          <h3 className="text-lg font-semibold mb-1 text-white">
            {character.name}
          </h3>
          <p>Classe: {character.class}</p>
          <p>Nível: {character.level}</p>
          <p className="text-xs text-yellow-400">DPS: {effectiveStats.dps}</p>
          <div className="mt-1 h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-400"
              style={{
                width: `${Math.min(xpPercentage, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs">
            XP: {character.currentXP} / {xpToNextLevel}
          </p>

          {/* REMOVED Status Button Section from here */}
          {/* 
          <div className="mt-3 flex justify-between items-center">
// ... existing code ...
          </div> 
          */}
        </div>

        {/* Right Column - Base Stats with Text Glow */}
        <div className="text-right flex-shrink-0 space-y-1">
          {/* Strength - Use totalStrength */}
          <p className="text-glow-red">Força: {totalStrength}</p>
          {/* Dexterity - Use totalDexterity */}
          <p className="text-glow-green">Destreza: {totalDexterity}</p>
          {/* Intelligence - Use totalIntelligence */}
          <p className="text-glow-blue">Inteligência: {totalIntelligence}</p>
        </div>
      </div>

      {/* Horizontal Separator */}
      <hr className="border-gray-600 my-3" />

      {/* --- Orb and Potions Container (Absolute Position) --- */}
      {/* Added Status back, adjusted flex properties maybe? */}
      <div className="absolute bottom-2 left-4 right-4 flex items-end justify-between gap-2">
        {" "}
        {/* Adjusted positioning/justify */}
        {/* Status Button Section (Left-most in this row) */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-300 mb-0.5">Status</span>
          <button
            onClick={() => setIsModalOpen(true)}
            // Using padding for width
            className="px-3 py-1 h-10 flex items-center justify-center text-xs bg-gray-800 border border-white rounded hover:bg-gray-700 transition-colors text-white"
            title="Exibir Status Detalhados"
          >
            Exibir
          </button>
        </div>
        {/* Potion Button (Middle) */}
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-300 mb-0.5">Poções</span>
          <button
            onClick={handleUsePotion}
            disabled={!character || character.healthPotions <= 0}
            className={`w-10 h-10 bg-red-900 border border-white rounded flex flex-col items-center justify-center text-white text-xs font-bold leading-tight p-1 transition-opacity ${
              !character || character.healthPotions <= 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
            title={`Usar Poção de Vida (${character.healthPotions} restantes)`}
          >
            <FaHeart className="mb-0.5" /> {/* Icon optional */}
            <span>{character.healthPotions}</span>
          </button>
        </div>
        {/* Health Orb Container (Right-most) */}
        <div>
          {/* Health Orb with Glow */}
          <svg
            className="w-16 h-16 overflow-visible orb-glow-red"
            viewBox="0 0 100 100"
          >
            <defs>
              <clipPath id="healthClipPathStats">
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
            {/* Health Fill */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#991b1b"
              clipPath="url(#healthClipPathStats)"
            />
            {/* RE-ADD text element inside SVG */}
            <text
              x="50%"
              y="50%"
              dy=".3em"
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="600"
            >
              {character.currentHealth}/{character.maxHealth}
            </text>
          </svg>
        </div>
      </div>

      {/* --- Modal Implementation --- */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-40 transition-opacity duration-300 ease-in-out"
            onClick={closeModal} // Close on backdrop click
          ></div>

          {/* Modal Panel */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xs bg-black border border-white rounded-lg shadow-xl z-50 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-1">
              {/* Update Modal Title */}
              <h5 className="text-lg font-semibold text-white">
                Status Detalhados
              </h5>
            </div>
            {/* Divider after title */}
            <hr className="border-gray-600 mb-3" />

            {/* Content based on modalType - now scrollable */}
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {renderModalContent()}
            </div>

            {/* ADD Close button at the bottom */}
            <button
              onClick={closeModal}
              className="mt-4 px-4 py-2 text-sm bg-gray-700 border border-gray-500 rounded text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 self-center"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CharacterStats;
