"use client"; // Add if using client-side hooks indirectly or for consistency

import React, { useState } from "react";
import { Character } from "../types/gameData"; // Adjust path if needed
import {
  FaHeart,
  FaTimes,
  // Remove unused icons
  // FaShieldAlt,
  // FaRunning,
  // FaBolt,
  // FaFistRaised,
  // FaHatWizard,
  // FaStar,
} from "react-icons/fa"; // Removed FaPlus, FaMinus

// Define props for CharacterStats
interface CharacterStatsProps {
  character: Character | null; // Character data or null if not loaded/found
  xpToNextLevel: number;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({
  character,
  xpToNextLevel,
}) => {
  // State to manage which modal is open ('defense', 'offense', or null)
  const [modalType, setModalType] = useState<"defense" | "offense" | null>(
    null
  );

  if (!character) {
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

  const closeModal = () => setModalType(null);

  // Function to render stats list for the modal
  const renderModalContent = () => {
    if (modalType === "defense") {
      return (
        <div className="space-y-1 text-sm">
          <p>
            Vida: {character.currentHealth} / {character.maxHealth}
          </p>
          <p>Armadura: {character.armor}</p>
          <p>Evasão: {character.evasion}</p>
          <p>Barreira: {character.barrier}</p>
          <p>Chance de Bloqueio: {character.blockChance}%</p>
          <p>Resist. Fogo: {character.fireResistance}%</p>
          <p>Resist. Frio: {character.coldResistance}%</p>
          <p>Resist. Raio: {character.lightningResistance}%</p>
          <p>Resist. Vazio: {character.voidResistance}%</p>
        </div>
      );
    } else if (modalType === "offense") {
      return (
        <div className="space-y-1 text-sm">
          <p>Dano Ataque: {character.attackDamage}</p>
          <p>Dano Projétil: {character.projectileDamage}</p>
          <p>Dano Magia: {character.spellDamage}</p>
          <p>Vel. Ataque: {(character.attackSpeed ?? 1).toFixed(2)}</p>
          <p>Vel. Conjurar: {(character.castSpeed ?? 1).toFixed(2)}</p>
          <p>Vel. Movimento: {character.movementSpeed}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    // Change border to white
    <div className="relative p-4 border border-white bg-black rounded text-sm text-gray-200 pb-20">
      {/* Use Flexbox to separate left (Class/Level/XP) and right (Base Stats) */}
      <div className="flex justify-between items-start mb-2">
        {/* Left Column */}
        <div className="flex-grow pr-4">
          <h3 className="text-lg font-semibold mb-1 text-white">Atributos</h3>
          <p>Classe: {character.class}</p>
          <p>Nível: {character.level}</p>
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
        </div>

        {/* Right Column - Base Stats with Colors */}
        <div className="text-right flex-shrink-0">
          <p className="text-red-500">Força: {character.strength}</p>
          <p className="text-green-500">Destreza: {character.dexterity}</p>
          <p className="text-blue-500">
            Inteligência: {character.intelligence}
          </p>
        </div>
      </div>

      {/* Horizontal Separator */}
      <hr className="border-gray-600 my-3" />

      {/* --- Section Headers with Modal Buttons --- */}
      <div className="flex justify-between items-center">
        <h4 className="text-md font-semibold text-white">Defesas</h4>
        <button
          onClick={() => setModalType("defense")}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          Detalhes
        </button>
      </div>

      <div className="mt-2 flex justify-between items-center">
        <h4 className="text-md font-semibold text-white">Ofensivo</h4>
        <button
          onClick={() => setModalType("offense")}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-500 rounded text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400"
        >
          Detalhes
        </button>
      </div>

      {/* --- Orb and Potions Container (Absolute Position) --- */}
      <div className="absolute bottom-2 right-2 flex items-end gap-2">
        {/* Potion Button */}
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

        {/* Health Orb */}
        <svg className="w-16 h-16 overflow-visible" viewBox="0 0 100 100">
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
            clipPath="url(#healthClipPathStats)"
          />
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

      {/* --- Modal Implementation --- */}
      {modalType !== null && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-40 transition-opacity duration-300 ease-in-out"
            onClick={closeModal} // Close on backdrop click
          ></div>

          {/* Modal Panel */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xs bg-gray-900 border border-white rounded-lg shadow-xl z-50 p-4">
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-lg font-semibold text-white">
                {modalType === "defense"
                  ? "Detalhes Defensivos"
                  : "Detalhes Ofensivos"}
              </h5>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white focus:outline-none"
                aria-label="Fechar Modal"
              >
                <FaTimes size={16} />
              </button>
            </div>
            {/* Content based on modalType */}
            {renderModalContent()}
          </div>
        </>
      )}
    </div>
  );
};

export default CharacterStats;
