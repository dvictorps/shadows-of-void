"use client"; // Add if using client-side hooks indirectly or for consistency

import React, { useState, useMemo } from "react";
// Remove Character import from here, will get from store
// import { Character } from "../types/gameData";
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
import { calculateSingleWeaponSwingDamage } from "../utils/statUtils";
import { useCharacterStore } from "../stores/characterStore"; // Import the store
import { ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils"; // <<< ADD IMPORT

// Define props for CharacterStats - Remove character prop
interface CharacterStatsProps {
  // character: Character | null; // Remove this
  xpToNextLevel: number;
  totalStrength: number; // Add total strength
  totalDexterity: number; // Add total dexterity
  totalIntelligence: number; // Add total intelligence
}

// NEW: Helper function to format numbers and handle NaN
const formatStat = (
  value: number | undefined | null,
  fixed?: number
): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return "-"; // Or '0' or some other placeholder
  }
  return fixed !== undefined ? value.toFixed(fixed) : String(value);
};

const CharacterStats: React.FC<CharacterStatsProps> = ({
  // Remove character from destructuring
  xpToNextLevel,
  totalStrength, // Destructure new props
  totalDexterity,
  totalIntelligence,
}) => {
  const activeCharacter = useCharacterStore((state) => state.activeCharacter);
  console.log(
    "[CharacterStats Render] Rendering for:",
    activeCharacter?.name ?? "None"
  ); // <<< LOG 1

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Log before useMemo
  console.log(
    "[CharacterStats] BEFORE useMemo. activeCharacter exists:",
    !!activeCharacter
  ); // <<< LOG 2

  const effectiveStats: EffectiveStats | null = useMemo(() => {
    if (!activeCharacter) {
      console.log(
        "[CharacterStats useMemo] No active character for stats calc."
      ); // <<< LOG 3a
      return null;
    }
    console.log(
      "[CharacterStats useMemo] Calculating stats for:",
      activeCharacter.name
    ); // <<< LOG 3b
    try {
      const stats = calculateEffectiveStats(activeCharacter);
      console.log("[CharacterStats useMemo] Calculation RESULT:", stats); // <<< LOG 3c (Log the whole object)
      return stats;
    } catch (e) {
      console.error("[CharacterStats useMemo] Error during calculation:", e); // <<< LOG 3d (Error case)
      return null;
    }
  }, [activeCharacter]);

  // Log after useMemo
  console.log(
    "[CharacterStats] AFTER useMemo. effectiveStats object:",
    effectiveStats
  ); // <<< LOG 4

  // Log values just before the check
  const displayCurrentHealth = activeCharacter?.currentHealth ?? "N/A";
  const displayMaxHealth = activeCharacter?.maxHealth ?? "N/A"; // Max health from store
  const calculatedMaxHealth = effectiveStats?.maxHealth ?? "N/A"; // Max health from calculation
  console.log(
    `[CharacterStats Values Check] Store Current: ${displayCurrentHealth}, Store Max: ${displayMaxHealth}, Calculated Max: ${calculatedMaxHealth}`
  ); // <<< LOG 5

  if (!activeCharacter || !effectiveStats) {
    console.log(
      "[CharacterStats] Returning loading/null based on check. Character:",
      !!activeCharacter,
      "Stats:",
      !!effectiveStats
    ); // <<< LOG 6
    return (
      <div className="p-4 border border-gray-600 bg-gray-800 rounded">
        Loading stats...
      </div>
    );
  }

  // If it gets past here, it should render fully
  console.log("[CharacterStats] Proceeding with full render."); // <<< LOG 7

  // Recalculate health percentage
  const healthPercentage =
    activeCharacter.maxHealth > 0
      ? (activeCharacter.currentHealth / activeCharacter.maxHealth) * 100
      : 0;

  // Use xpToNextLevel from props for XP percentage calculation
  const xpPercentage =
    xpToNextLevel > 0 ? (activeCharacter.currentXP / xpToNextLevel) * 100 : 0;

  // Use activeCharacter from store in handlers/display
  const handleUsePotion = () => {
    if (activeCharacter && activeCharacter.healthPotions > 0) {
      // TODO: Implement potion use via store action later
      console.log("Using potion (placeholder - needs store action)");
    }
  };

  const closeModal = () => setIsModalOpen(false);

  // Function to render stats list for the modal (now shows both sections)
  const renderModalContent = () => {
    return (
      <>
        {/* Offensive Section FIRST - Detailed */}
        <h5 className="text-md font-semibold text-white mb-2">Ofensivo</h5>
        <div className="space-y-1 text-sm mb-3">
          <p>
            Dano Físico Base: {formatStat(effectiveStats.baseMinPhysDamage)} -{" "}
            {formatStat(effectiveStats.baseMaxPhysDamage)}
          </p>
          <p>
            Vel. Ataque Base: {formatStat(effectiveStats.baseAttackSpeed, 2)}
          </p>
          <hr className="border-gray-700 my-1" />
          <p>
            Dano Físico Plano Adicionado:{" "}
            {formatStat(
              effectiveStats.minPhysDamage - effectiveStats.baseMinPhysDamage
            )}{" "}
            -{" "}
            {formatStat(
              effectiveStats.maxPhysDamage - effectiveStats.baseMaxPhysDamage
            )}
          </p>{" "}
          {/* Calculate flat portion */}
          {effectiveStats.flatMinFire > 0 && (
            <p>
              Dano de Fogo Plano Adicionado:{" "}
              {formatStat(effectiveStats.flatMinFire)} -{" "}
              {formatStat(effectiveStats.flatMaxFire)}
            </p>
          )}
          {effectiveStats.flatMinCold > 0 && (
            <p>
              Dano de Frio Plano Adicionado:{" "}
              {formatStat(effectiveStats.flatMinCold)} -{" "}
              {formatStat(effectiveStats.flatMaxCold)}
            </p>
          )}
          {effectiveStats.flatMinLightning > 0 && (
            <p>
              Dano de Raio Plano Adicionado:{" "}
              {formatStat(effectiveStats.flatMinLightning)} -{" "}
              {formatStat(effectiveStats.flatMaxLightning)}
            </p>
          )}
          {effectiveStats.flatMinVoid > 0 && (
            <p>
              Dano de Vazio Plano Adicionado:{" "}
              {formatStat(effectiveStats.flatMinVoid)} -{" "}
              {formatStat(effectiveStats.flatMaxVoid)}
            </p>
          )}
          <hr className="border-gray-700 my-1" />
          <p>
            Dano Físico Aumentado: +
            {formatStat(effectiveStats.increasePhysDamagePercent, 0)}%
          </p>
          <p>
            Vel. Ataque Aumentada: +
            {formatStat(effectiveStats.increaseAttackSpeedPercent, 0)}%
          </p>
          <p>
            Dano Elemental Aumentado: +
            {formatStat(effectiveStats.increaseEleDamagePercent, 0)}%
          </p>
          <hr className="border-gray-700 my-1" />
          {/* Conditionally display weapon damages */}
          {/* Check if both are equipped AND are one-handed weapons */}
          {activeCharacter.equipment.weapon1 &&
          ONE_HANDED_WEAPON_TYPES.has(
            activeCharacter.equipment.weapon1.itemType
          ) &&
          activeCharacter.equipment.weapon2 &&
          ONE_HANDED_WEAPON_TYPES.has(
            activeCharacter.equipment.weapon2.itemType
          ) &&
          effectiveStats ? (
            // Dual Wielding Display
            (() => {
              const weapon1Damage = calculateSingleWeaponSwingDamage(
                activeCharacter.equipment.weapon1!,
                effectiveStats
              );
              const weapon2Damage = calculateSingleWeaponSwingDamage(
                activeCharacter.equipment.weapon2!,
                effectiveStats
              );
              console.log(
                "[CharacterStats Dual Wield] Weapon 1 Calc:",
                weapon1Damage
              );
              console.log(
                "[CharacterStats Dual Wield] Weapon 2 Calc:",
                weapon2Damage
              );
              return (
                <>
                  <p className="text-yellow-300">
                    Dano Arma Principal: {formatStat(weapon1Damage.totalMin)} -{" "}
                    {formatStat(weapon1Damage.totalMax)}
                  </p>
                  <p className="text-yellow-300">
                    Dano Arma Secundária: {formatStat(weapon2Damage.totalMin)} -{" "}
                    {formatStat(weapon2Damage.totalMax)}
                  </p>
                </>
              );
            })()
          ) : (
            // Single Weapon / Unarmed Display
            <p>
              Dano Final Total: {formatStat(effectiveStats?.minDamage)} -{" "}
              {formatStat(effectiveStats?.maxDamage)}
            </p>
          )}
          <p>Vel. Ataque Final: {formatStat(effectiveStats?.attackSpeed, 2)}</p>
          <p>DPS Estimado Final: {formatStat(effectiveStats?.dps)}</p>
        </div>

        <hr className="border-gray-600 my-2" />

        {/* Defensive Section LAST - Updated */}
        <h5 className="text-md font-semibold text-white mb-2">Defensivo</h5>
        <div className="space-y-1 text-sm">
          <p>
            Vida: {formatStat(activeCharacter.currentHealth)} /{" "}
            {formatStat(effectiveStats.maxHealth)}
          </p>
          {/* Display FINAL calculated values */}
          <p>Armadura: {formatStat(effectiveStats.totalArmor)}</p>
          {/* ADDED Evasion/Barrier display */}
          <p>Evasão: {formatStat(effectiveStats.totalEvasion)}</p>
          <p>Barreira: {formatStat(effectiveStats.totalBarrier)}</p>
          {/* Display Estimated Physical Reduction */}
          <p>
            Redução Física Est.:{" "}
            {
              formatStat(effectiveStats.estimatedPhysReductionPercent, 1) // Display with 1 decimal place
            }
            %
          </p>
          {/* UPDATED: Display calculated Block Chance */}
          <p>
            Chance de Bloqueio: {formatStat(effectiveStats.totalBlockChance)}%
          </p>
          {/* ---------------------------------------- */}
          <p>Resist. Fogo: {formatStat(effectiveStats.finalFireResistance)}%</p>
          <p>Resist. Frio: {formatStat(effectiveStats.finalColdResistance)}%</p>
          <p>
            Resist. Raio: {formatStat(effectiveStats.finalLightningResistance)}%
          </p>
          <p>
            Resist. Vazio: {formatStat(effectiveStats.finalVoidResistance)}%
          </p>
          {/* Add Life Regen display */}
          <p>
            Regeneração de Vida:{" "}
            {formatStat(effectiveStats.finalLifeRegenPerSecond, 1)}/s
          </p>
          {/* --- ADD NEW STATS DISPLAY --- */}
          <hr className="border-gray-700 my-1" />
          <p>
            Dano Físico Recebido como Elemental:{" "}
            {formatStat(effectiveStats.totalPhysTakenAsElementPercent)}%
          </p>
          <p>
            Redução de Dano Físico Recebido:{" "}
            {formatStat(effectiveStats.totalReducedPhysDamageTakenPercent)}%
          </p>
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
            {activeCharacter.name}
          </h3>
          <p>Classe: {activeCharacter.class}</p>
          <p>Nível: {activeCharacter.level}</p>
          <p className="text-xs text-yellow-400">
            DPS: {formatStat(effectiveStats.dps)}
          </p>
          <div className="mt-1 h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-400"
              style={{
                width: `${Math.min(xpPercentage, 100)}%`,
              }}
            ></div>
          </div>
          <p className="text-xs">
            XP: {activeCharacter.currentXP} / {xpToNextLevel}
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
            disabled={!activeCharacter || activeCharacter.healthPotions <= 0}
            className={`w-10 h-10 bg-red-900 border border-white rounded flex flex-col items-center justify-center text-white text-xs font-bold leading-tight p-1 transition-opacity ${
              !activeCharacter || activeCharacter.healthPotions <= 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-700"
            }`}
            title={`Usar Poção de Vida (${activeCharacter.healthPotions} restantes)`}
          >
            <FaHeart className="mb-0.5" /> {/* Icon optional */}
            <span>{activeCharacter.healthPotions}</span>
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
              {activeCharacter.currentHealth}/{effectiveStats.maxHealth}
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
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white rounded-lg shadow-xl z-50 p-4 flex flex-col">
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
