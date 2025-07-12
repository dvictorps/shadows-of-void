"use client"; // Add if using client-side hooks indirectly or for consistency

import React, { useState, useMemo } from "react";
import { calculatePercentage } from "../utils/combatUI";
// Remove Character import from here, will get from store
// import { Character } from "../types/gameData";
import {
  // FaHeart, // REMOVED - No longer used
  // FaTimes, // REMOVED - No longer used
  // Remove unused icons
  // FaShieldAlt,
  // FaRunning,
  // FaBolt,
  // FaFistRaised,
  // FaHatWizard,
  // FaStar,
} from "react-icons/fa"; // Removed FaPlus, FaMinus
import { calculateEffectiveStats, EffectiveStats } from "../utils/statUtils/weapon"; // IMPORT NEW UTIL
// import { calculateSingleWeaponSwingDamage } from "../utils/statUtils";
import { useCharacterStore } from "../stores/characterStore"; // Import the store
import { ONE_HANDED_WEAPON_TYPES } from "../utils/itemUtils";
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

  // Função para arredondar DPS conforme solicitado
  function roundDps(value: number | undefined | null): number | string {
    if (value === undefined || value === null || isNaN(value)) return "-";
    const decimal = value - Math.floor(value);
    if (decimal < 0.5) return Math.floor(value);
    return Math.ceil(value);
  }

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
    // <<< ADD Dual Wielding Check >>>
    const isDualWielding =
      activeCharacter.equipment.weapon1 &&
      activeCharacter.equipment.weapon2 &&
      ONE_HANDED_WEAPON_TYPES.has(activeCharacter.equipment.weapon1.itemType) &&
      ONE_HANDED_WEAPON_TYPES.has(activeCharacter.equipment.weapon2.itemType);

    return (
      <>
        {/* Offensive Section FIRST - Detailed */}
        <h5 className="text-md font-semibold text-white mb-2">Ofensivo</h5>
        <div className="space-y-1 text-sm mb-3">
          {/* Weapon 1 Damage */}
          <p>
            Dano Arma 1 (Local):{" "}
            {formatStat(
              effectiveStats.weaponBaseMinPhys + effectiveStats.weaponBaseMinEle
            )}{" "}
            -{" "}
            {formatStat(
              effectiveStats.weaponBaseMaxPhys + effectiveStats.weaponBaseMaxEle
            )}
          </p>
          {isDualWielding &&
            effectiveStats.weapon2CalcMinPhys !== undefined && (
              <p>
                Dano Arma 2 (Local):{" "}
                {formatStat(
                  (effectiveStats.weapon2CalcMinPhys ?? 0) +
                    (effectiveStats.weapon2CalcMinEle ?? 0)
                )}{" "}
                -{" "}
                {formatStat(
                  (effectiveStats.weapon2CalcMaxPhys ?? 0) +
                    (effectiveStats.weapon2CalcMaxEle ?? 0)
                )}
              </p>
            )}
          {activeCharacter.equipment.weapon1 && activeCharacter.equipment.weapon1.classification === 'Spell' ? (
            <>
              <p>
                Vel. de Cast Base: {formatStat(effectiveStats.weaponBaseAttackSpeed, 2)}
              </p>
              <p>
                Chance Crítico Base: {formatStat(effectiveStats.weaponBaseCritChance, 2)}%
              </p>
            </>
          ) : (
            <>
              <p>
                Vel. Ataque Base Arma 1: {formatStat(effectiveStats.weaponBaseAttackSpeed, 2)}
              </p>
              {isDualWielding &&
                effectiveStats.weapon2CalcAttackSpeed !== undefined && (
                  <p>
                    Vel. Ataque Base Arma 2: {formatStat(effectiveStats.weapon2CalcAttackSpeed, 2)}
                  </p>
                )}
              <p>
                Chance Crítico Base Arma 1: {formatStat(effectiveStats.weaponBaseCritChance, 2)}%
              </p>
              {isDualWielding &&
                effectiveStats.weapon2CalcCritChance !== undefined && (
                  <p>
                    Chance Crítico Base Arma 2: {formatStat(effectiveStats.weapon2CalcCritChance, 2)}%
                  </p>
                )}
            </>
          )}
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
          <p>
            {effectiveStats?.weaponBaseAttackSpeed && effectiveStats?.weaponBaseMinPhys === 0 && effectiveStats?.weaponBaseMinEle > 0
              ? 'Vel. de Cast Final'
              : 'Vel. Ataque Final'}: {formatStat(effectiveStats?.attackSpeed, 2)}
          </p>
          <p>
            Chance de Crítico Final: {formatStat(effectiveStats?.critChance, 2)}%
          </p>
          <p>
            Multiplicador Crítico Final:{" "}
            {formatStat(effectiveStats?.critMultiplier, 0)}%
          </p>
          <p>DPS Estimado Final: {roundDps(effectiveStats?.dps)}</p>
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
          <p>Barreira: {formatStat(effectiveStats.totalBarrier)}</p>
          <p>Chance de Block: {formatStat(effectiveStats.totalBlockChance)}%</p>
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
          <p>
            Regeneração de Mana: {formatStat(effectiveStats.finalManaRegenPerSecond, 1)}/s
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
  const barrierPercentage = calculatePercentage(
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
            DPS: {roundDps(effectiveStats.dps)}
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
          <div className="relative group">
            <button
              onClick={usePotion}
              disabled={
                !activeCharacter ||
                activeCharacter.healthPotions <= 0 ||
                !effectiveStats ||
                activeCharacter.currentHealth >= effectiveStats.maxHealth
              }
              className={`w-20 h-16 bg-black border border-white rounded flex items-center justify-center text-white text-xs font-bold p-0 transition-opacity ${
                !activeCharacter ||
                activeCharacter.healthPotions <= 0 ||
                !effectiveStats ||
                activeCharacter.currentHealth >= effectiveStats.maxHealth
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"
              }`}
              title={`Usar Poção de Vida (${
                activeCharacter?.healthPotions ?? 0
              } restantes)`}
            >
              <img
                src="/sprites/ui/heal-potion.png"
                alt="Poção de Vida"
                className="w-10 h-10 object-contain"
                draggable={false}
              />
              <span className="text-white text-xs font-bold ml-1">x {activeCharacter?.healthPotions ?? 0}</span>
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
              Poção de Vida
            </span>
          </div>
          {/* Teleport Stone Button */}
          <div className="relative group">
            <button
              onClick={onUseTeleportStone}
              disabled={
                !activeCharacter ||
                activeCharacter.teleportStones <= 0 ||
                isInTown
              }
              className={`w-20 h-16 bg-black border border-white rounded flex items-center justify-center text-white text-xs font-bold p-0 transition-opacity ${
                !activeCharacter ||
                activeCharacter.teleportStones <= 0 ||
                isInTown
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-[0_0_8px_2px_rgba(59,130,246,0.7)]"
              }`}
              title={`Pedra de Teleporte (${
                activeCharacter?.teleportStones ?? 0
              } restantes)`}
            >
              <img
                src="/sprites/ui/teleport-stone.png"
                alt="Pedra de Teleporte"
                className="w-10 h-10 object-contain"
                draggable={false}
              />
              <span className="text-white text-xs font-bold ml-1">x {activeCharacter?.teleportStones ?? 0}</span>
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
              Pedra de Teleporte
            </span>
          </div>
          {/* <<< ADD Wind Crystal Display >>> */}
          <div className="relative group">
            <button
              disabled={true}
              className="w-20 h-16 bg-black border border-white rounded flex items-center justify-center text-white text-xs font-bold p-0 cursor-default"
              tabIndex={-1}
            >
              <img
                src="/sprites/ui/wind-crystal.png"
                alt="Cristal do Vento"
                className="w-10 h-10 object-contain"
                draggable={false}
              />
              <span className="text-white text-xs font-bold ml-1">x {windCrystals}</span>
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
              Cristal do Vento
            </span>
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
