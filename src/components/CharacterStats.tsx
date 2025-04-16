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
// import { calculateSingleWeaponSwingDamage } from "../utils/statUtils";
import { useCharacterStore } from "../stores/characterStore"; // Import the store
// import { ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils";
// import { ALL_ITEM_BASES } from "../data/items";
// import { OverallGameData } from "../types/gameData"; // <<< IMPORT OverallGameData
// Removed unused imports: Image, useSelector, RootState, formatStat, BaseModal

// Define props for CharacterStats - Remove character prop
interface CharacterStatsProps {
  // character: Character | null; // Remove this
  xpToNextLevel: number;
  totalStrength: number; // Add total strength
  totalDexterity: number; // Add total dexterity
  totalIntelligence: number; // Add total intelligence
  onUseTeleportStone: () => void; // <<< ADD PROP TYPE
  windCrystals: number; // <<< ADD WIND CRYSTALS PROP >>>
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
  onUseTeleportStone, // <<< CALL THE PROP ON CLICK
  windCrystals, // <<< Destructure windCrystals >>>
}) => {
  const { activeCharacter } = useCharacterStore((state) => state);
  // Get usePotion action from the store
  const usePotion = useCharacterStore((state) => state.usePotion);
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

  // <<< ADD Evade Chance Calculation >>>
  const AVERAGE_ACT1_ACCURACY = 80; // Define average accuracy for estimation
  let estimatedEvadeChance = 0;
  if (effectiveStats && AVERAGE_ACT1_ACCURACY > 0) {
    const playerEvasion = effectiveStats.totalEvasion ?? 0;
    // Use PoE-like formula, same as in AreaView
    const accuracyTerm = AVERAGE_ACT1_ACCURACY * 1.25;
    const evasionTerm =
      playerEvasion > 0 ? Math.pow(playerEvasion / 5, 0.9) : 0;
    let chanceToHit =
      AVERAGE_ACT1_ACCURACY + evasionTerm === 0
        ? 1
        : accuracyTerm / (AVERAGE_ACT1_ACCURACY + evasionTerm);
    chanceToHit = Math.max(0.05, Math.min(0.95, chanceToHit)); // Clamp hit chance 5%-95%
    estimatedEvadeChance = (1 - chanceToHit) * 100; // Calculate evade chance
  }
  // -------------------------------------

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

  // Recalculate health percentage using EFFECTIVE stats max health
  const healthPercentage =
    effectiveStats.maxHealth > 0
      ? (activeCharacter.currentHealth / effectiveStats.maxHealth) * 100
      : 0;

  // Use xpToNextLevel from props for XP percentage calculation
  const xpPercentage =
    xpToNextLevel > 0 ? (activeCharacter.currentXP / xpToNextLevel) * 100 : 0;

  const closeModal = () => setIsModalOpen(false);

  // Function to render stats list for the modal (now shows both sections)
  const renderModalContent = () => {
    return (
      <>
        {/* Offensive Section FIRST - Detailed */}
        <h5 className="text-md font-semibold text-white mb-2">Ofensivo</h5>
        <div className="space-y-1 text-sm mb-3">
          {/* Show Total Weapon Flat Damage (Phys + Ele) */}
          <p>
            Dano Plano da Arma:{" "}
            {formatStat(
              effectiveStats.weaponBaseMinPhys + effectiveStats.weaponBaseMinEle
            )}{" "}
            -{" "}
            {formatStat(
              effectiveStats.weaponBaseMaxPhys + effectiveStats.weaponBaseMaxEle
            )}
          </p>
          <p>
            Vel. Ataque Base da Arma:{" "}
            {formatStat(effectiveStats.weaponBaseAttackSpeed, 2)}
          </p>
          <p>
            Chance de Crítico Base da Arma:{" "}
            {formatStat(effectiveStats.weaponBaseCritChance, 2)}%
          </p>
          <hr className="border-gray-700 my-1" />
          {/* Show GLOBAL Flat Damage Added (from non-weapon sources) */}
          {effectiveStats.globalFlatMinPhys > 0 && (
            <p>
              Dano Físico Plano Adicionado:{" "}
              {formatStat(effectiveStats.globalFlatMinPhys)} -{" "}
              {formatStat(effectiveStats.globalFlatMaxPhys)}
            </p>
          )}
          {effectiveStats.globalFlatMinFire > 0 && (
            <p>
              Dano de Fogo Plano Adicionado:{" "}
              {formatStat(effectiveStats.globalFlatMinFire)} -{" "}
              {formatStat(effectiveStats.globalFlatMaxFire)}
            </p>
          )}
          {effectiveStats.globalFlatMinCold > 0 && (
            <p>
              Dano de Frio Plano Adicionado:{" "}
              {formatStat(effectiveStats.globalFlatMinCold)} -{" "}
              {formatStat(effectiveStats.globalFlatMaxCold)}
            </p>
          )}
          {effectiveStats.globalFlatMinLightning > 0 && (
            <p>
              Dano de Raio Plano Adicionado:{" "}
              {formatStat(effectiveStats.globalFlatMinLightning)} -{" "}
              {formatStat(effectiveStats.globalFlatMaxLightning)}
            </p>
          )}
          {effectiveStats.globalFlatMinVoid > 0 && (
            <p>
              Dano de Vazio Plano Adicionado:{" "}
              {formatStat(effectiveStats.globalFlatMinVoid)} -{" "}
              {formatStat(effectiveStats.globalFlatMaxVoid)}
            </p>
          )}
          {(effectiveStats.globalFlatMinPhys > 0 ||
            effectiveStats.globalFlatMinFire > 0 ||
            effectiveStats.globalFlatMinCold > 0 ||
            effectiveStats.globalFlatMinLightning > 0 ||
            effectiveStats.globalFlatMinVoid > 0) && (
            <hr className="border-gray-700 my-1" />
          )}
          {/* Show Global % Increases */}
          <p>
            Dano Físico Aumentado: +
            {formatStat(effectiveStats.increasePhysDamagePercent, 0)}%
          </p>
          <p>
            Vel. Ataque Global Aumentada: +
            {formatStat(effectiveStats.increaseAttackSpeedPercent, 0)}%
          </p>
          <p>
            Dano Elemental Aumentado: +
            {formatStat(effectiveStats.increaseEleDamagePercent, 0)}%
          </p>
          <p>
            Chance de Crítico Global Aumentada: +
            {formatStat(effectiveStats.increaseGlobalCritChancePercent, 0)}%
          </p>
          <hr className="border-gray-700 my-1" />
          {/* Show Final Calculated Stats */}
          {/* Removed conditional display for dual wield here, always show final */}
          <p>
            Dano Final Total: {formatStat(effectiveStats?.minDamage)} -{" "}
            {formatStat(effectiveStats?.maxDamage)}
          </p>
          <p>Vel. Ataque Final: {formatStat(effectiveStats?.attackSpeed, 2)}</p>
          <p>
            Chance de Crítico Final: {formatStat(effectiveStats?.critChance, 2)}
            %
          </p>
          <p>
            Multiplicador Crítico Final:{" "}
            {formatStat(effectiveStats?.critMultiplier, 0)}%
          </p>
          <p>DPS Estimado Final: {formatStat(effectiveStats?.dps)}</p>
        </div>

        <hr className="border-gray-600 my-2" />

        {/* Defensive Section LAST - Updated */}
        <h5 className="text-md font-semibold text-white mb-2">Defensivo</h5>
        <div className="space-y-1 text-sm">
          <p>
            Vida: {Math.floor(activeCharacter.currentHealth)} /{" "}
            {Math.floor(effectiveStats.maxHealth)}
          </p>
          {/* Display FINAL calculated values */}
          <p>Armadura: {formatStat(effectiveStats.totalArmor)}</p>
          {/* ADDED Evasion/Barrier display */}
          <p>Evasão: {formatStat(effectiveStats.totalEvasion)}</p>
          <p>Barreira: {Math.floor(effectiveStats.totalBarrier)}</p>
          {/* ADD Current/Max Barrier display */}
          <p>
            Barreira Atual: {Math.floor(activeCharacter.currentBarrier ?? 0)} /{" "}
            {Math.floor(effectiveStats.totalBarrier)}
          </p>
          {/* Display Estimated Physical Reduction */}
          <p>
            Redução Física Est.:{" "}
            {formatStat(effectiveStats.estimatedPhysReductionPercent, 1)}%
          </p>
          {/* <<< ADD Estimated Evade Chance Display >>> */}
          {effectiveStats.totalEvasion > 0 && (
            <p>Chance de Evasão Est.: {formatStat(estimatedEvadeChance, 1)}%</p>
          )}
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

  // <<< Check if in town >>>
  const isInTown = activeCharacter?.currentAreaId === "cidade_principal";

  // <<< Helper function for calculating barrier percentage robustly >>>
  const calculateBarrierPercentage = (
    current: number | null | undefined,
    max: number | null | undefined
  ): number => {
    const currentVal = current ?? 0;
    const maxVal = max ?? 0;
    if (maxVal <= 0 || currentVal <= 0) {
      return 0;
    }
    const percentage = Math.max(0, Math.min(100, (currentVal / maxVal) * 100));
    // Add explicit NaN check for extra safety
    return isNaN(percentage) ? 0 : percentage;
  };
  const barrierPercentage = calculateBarrierPercentage(
    activeCharacter.currentBarrier,
    effectiveStats?.totalBarrier
  );
  // -------------------------------------------------------------
  // <<< ADD LOG: Check barrier values before render >>>
  console.log("[CharacterStats Barrier Check]", {
    currentBarrier: activeCharacter.currentBarrier,
    totalBarrier: effectiveStats?.totalBarrier,
    calculatedPercentage: barrierPercentage,
    healthPercentage: healthPercentage, // Also log health % for comparison
  });
  // --------------------------------------------------

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
        {/* Potion & Teleport Buttons (Middle) */}
        <div className="flex items-end gap-1">
          {/* Potion Button */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-300 mb-0.5">Poções</span>
            <button
              onClick={usePotion}
              disabled={
                !activeCharacter ||
                activeCharacter.healthPotions <= 0 ||
                !effectiveStats || // Add effectiveStats check
                activeCharacter.currentHealth >= effectiveStats.maxHealth
              }
              className={`w-10 h-10 bg-red-900 border border-white rounded flex flex-col items-center justify-center text-white text-xs font-bold leading-tight p-1 transition-opacity ${
                !activeCharacter ||
                activeCharacter.healthPotions <= 0 ||
                !effectiveStats ||
                activeCharacter.currentHealth >= effectiveStats.maxHealth
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-red-700"
              }`}
              title={`Usar Poção de Vida (${
                activeCharacter?.healthPotions ?? 0
              } restantes)`}
            >
              <FaHeart className="mb-0.5" />
              <span>{activeCharacter?.healthPotions ?? 0}</span>
            </button>
          </div>
          {/* Teleport Stone Button */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-300 mb-0.5">Portal</span>
            <button
              onClick={onUseTeleportStone} // <<< CALL THE PROP ON CLICK
              disabled={
                !activeCharacter ||
                activeCharacter.teleportStones <= 0 ||
                isInTown // Use the existing isInTown check
              }
              className={`w-10 h-10 bg-blue-900 border border-white rounded flex flex-col items-center justify-center text-white text-xs font-bold leading-tight p-1 transition-opacity ${
                !activeCharacter ||
                activeCharacter.teleportStones <= 0 ||
                isInTown
                  ? "opacity-50 cursor-not-allowed"
                  : "orb-glow-blue"
              }`}
              title={`Pedra de Teleporte (${
                activeCharacter?.teleportStones ?? 0
              } restantes)`}
            >
              {!isInTown && <span className="text-xl">🌀</span>}
              <span>{activeCharacter?.teleportStones ?? 0}</span>
            </button>
          </div>
          {/* <<< ADD Wind Crystal Display >>> */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-300 mb-0.5">Vento</span>
            <div
              className="w-10 h-10 bg-gray-700 border border-white rounded flex flex-col items-center justify-center text-white text-xs font-bold leading-tight p-1 transition-opacity"
              title={`Cristais do Vento: ${windCrystals}`}
            >
              {/* Using FaFeatherAlt */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="w-4 h-4 mb-0.5 fill-current"
              >
                <path d="M224 140.1C224 124 239.1 110.8 255.6 110.8C272.9 110.8 288 124 288 140.1V334.9C288 351 272.9 364.2 255.6 364.2C239.1 364.2 224 351 224 334.9V140.1zM128.2 156.3C128.2 140.2 143.3 126.1 160.7 126.1C178 126.1 193 140.2 193 156.3V359.7C193 375.8 178 389.9 160.7 389.9C143.3 389.9 128.2 375.8 128.2 359.7V156.3zM321.1 156.3C321.1 140.2 336.2 126.1 353.5 126.1C370.8 126.1 385.9 140.2 385.9 156.3V359.7C385.9 375.8 370.8 389.9 353.5 389.9C336.2 389.9 321.1 375.8 321.1 359.7V156.3zM85.37 188.5C85.37 172.4 99.54 158.2 116.8 158.2C134.1 158.2 149.2 172.4 149.2 188.5V327.5C149.2 343.6 134.1 357.8 116.8 357.8C99.54 357.8 85.37 343.6 85.37 327.5V188.5zM426.6 188.5C426.6 172.4 412.5 158.2 395.2 158.2C377.9 158.2 362.8 172.4 362.8 188.5V327.5C362.8 343.6 377.9 357.8 395.2 357.8C412.5 357.8 426.6 343.6 426.6 327.5V188.5zM42.67 220.6C42.67 204.5 56.83 190.4 74.17 190.4C91.5 190.4 106.7 204.5 106.7 220.6V295.4C106.7 311.5 91.5 325.6 74.17 325.6C56.83 325.6 42.67 311.5 42.67 295.4V220.6zM469.3 220.6C469.3 204.5 455.2 190.4 437.8 190.4C420.5 190.4 405.3 204.5 405.3 220.6V295.4C405.3 311.5 420.5 325.6 437.8 325.6C455.2 325.6 469.3 311.5 469.3 295.4V220.6z" />
              </svg>
              <span>{windCrystals}</span>
            </div>
          </div>
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
              {/* <<< ADD Barrier Clip Path >>> */}
              <clipPath id="barrierClipPathStats">
                <rect
                  x="0"
                  // Calculate Y based on barrier percentage using the helper
                  y={100 - barrierPercentage}
                  width="100"
                  // Calculate Height based on barrier percentage using the helper
                  height={barrierPercentage}
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
            {/* <<< REORDER: Barrier Fill FIRST >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#60a5fa" // Light blue (Tailwind blue-400)
              fillOpacity="0.6" // Semi-transparent
              clipPath="url(#barrierClipPathStats)"
            />
            {/* <<< REORDER: Health Fill SECOND >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#991b1b"
              clipPath="url(#healthClipPathStats)"
            />
            {/* <<< REORDER: Barrier Fill LAST (On Top) >>> */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#60a5fa" // Light blue (Tailwind blue-400)
              fillOpacity="0.6" // Semi-transparent
              clipPath="url(#barrierClipPathStats)"
            />
            {/* <<< Restore Text Display inside SVG >>> */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              fill="white"
              fontSize="12" // Use smaller font size
              fontWeight="600"
            >
              {/* Health Line */}
              <tspan x="50%" dy="-0.1em">
                {Math.floor(activeCharacter.currentHealth)}/
                {Math.floor(effectiveStats?.maxHealth ?? 0)}
              </tspan>
              {/* Barrier Line */}
              <tspan x="50%" dy="1.1em">
                {Math.floor(activeCharacter.currentBarrier ?? 0)}/
                {Math.floor(effectiveStats?.totalBarrier ?? 0)}
              </tspan>
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
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar max-h-[60vh]">
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
