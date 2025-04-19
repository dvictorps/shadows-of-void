"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  FaArrowLeft,
  FaHeart,
  FaShoppingBag,
  FaStore,
  FaMagic,
} from "react-icons/fa";
import {
  Character,
  MapLocation,
  EnemyInstance,
  // enemyTypes, // REMOVED
  // calculateEnemyStats, // REMOVED
  EnemyDamageType,
} from "../types/gameData"; // Adjust path if needed
import { EffectiveStats } from "../utils/statUtils";
import { useCharacterStore } from "../stores/characterStore";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence, useAnimation, Variants } from "framer-motion"; // <<< Import Framer Motion

// Define HitEffect type
type HitEffectType = "1h" | "2h" | "unarmed"; // Define possible hit types
// <<< EXPORT HitEffectType >>>
export type { HitEffectType }; // <<< ADD EXPORT HERE

interface HitEffect {
  id: string;
  type: HitEffectType;
  x: number;
  y: number;
  rotation: number; // <<< ADD rotation property
}
// --- End HitEffect type ---

// <<< Define Handle types (Make sure new functions are here) >>>
export interface AreaViewHandles {
  displayPlayerDamage: (value: number, isCritical: boolean) => void;
  displayLifeLeech: (value: number) => void;
  displayEnemyThornsDamage: (value: number) => void;
  displayEnemyDamage: (value: number, damageType: EnemyDamageType) => void;
  displayMissText: () => void;
  // --- Add Animation Triggers --- <<< ADD THESE TO EXPORT >>>
  triggerHitEffect: (type: HitEffectType) => void;
  triggerEnemyShake: () => void;
  // ----------------------------
}

interface AreaViewProps {
  character: Character | null;
  area: MapLocation | null;
  effectiveStats: EffectiveStats | null;
  onReturnToMap: (areaWasCompleted: boolean) => void;
  xpToNextLevel: number;
  pendingDropCount: number;
  onOpenDropModalForViewing: () => void;
  onOpenVendor: () => void;
  onUseTeleportStone: () => void;
  windCrystals: number;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  killsToComplete: number;
}

// Type for the last player damage state
interface LastPlayerDamage {
  value: number;
  timestamp: number; // To trigger re-renders even if value is the same
  id: string; // Unique ID for key prop
  isCritical: boolean; // ADDED: Flag for critical hit
}

// NEW: Type for the last life leech display
interface LastLifeLeech {
  value: number;
  timestamp: number;
  id: string;
}

// NEW: Type for the last thorns damage display
interface LastEnemyThornsDamage {
  value: number;
  timestamp: number;
  id: string;
}

// --- Enemy Damage Number Type (with damage type) ---
interface EnemyDamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  type: EnemyDamageType; // <<< ADDED damage type
}
// ----------------------------------------------------

// <<< NEW: Floating Text Type (for MISS) >>>
interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
}
// ----------------------------------------

// --- Helper to get display name for damage type ---
const getDamageTypeDisplayName = (type: EnemyDamageType): string => {
  switch (type) {
    case "physical":
      return "Físico";
    case "cold":
      return "Frio";
    case "void":
      return "Vazio";
    case "fire":
      return "Fogo";
    case "lightning":
      return "Raio";
    default:
      return type; // Fallback to the internal name
  }
};
// ---------------------------------------------------

// <<< Wrap component with forwardRef >>>
const AreaView = forwardRef<AreaViewHandles, AreaViewProps>(
  (
    {
      character,
      area,
      effectiveStats,
      onReturnToMap,
      xpToNextLevel,
      pendingDropCount,
      onOpenDropModalForViewing,
      onOpenVendor,
      onUseTeleportStone,
      windCrystals,
      currentEnemy,
      enemiesKilledCount,
      killsToComplete,
    },
    ref
  ) => {
    console.log(
      "[AreaView Props Check] Character:",
      character?.name,
      "Area:",
      area?.name
    );

    // State for visual feedback
    const [playerDamageTakenNumbers, setPlayerDamageTakenNumbers] = useState<
      EnemyDamageNumber[]
    >([]);
    const [lastPlayerDamage, setLastPlayerDamage] =
      useState<LastPlayerDamage | null>(null);
    const [lastLifeLeech, setLastLifeLeech] = useState<LastLifeLeech | null>(
      null
    );
    const [lastEnemyThornsDamage, setLastEnemyThornsDamage] =
      useState<LastEnemyThornsDamage | null>(null);
    const [floatingMissTexts, setFloatingMissTexts] = useState<FloatingText[]>(
      []
    );

    // --- State for Animations (Ensure these are defined HERE) ---
    const [hitEffects, setHitEffects] = useState<HitEffect[]>([]); // <<< DEFINE hitEffects state
    const shakeControls = useAnimation(); // <<< DEFINE shakeControls
    // ------------------------------------------------------------

    // --- Animation Variants (Ensure these are defined HERE) ---
    const shakeAnimation = {
      x: [0, -8, 8, -6, 6, -4, 4, 0], // Shake sequence
      transition: { duration: 0.3, ease: "easeInOut" },
    };

    const hitEffectVariants: Variants = {
      initial: { opacity: 0, scale: 0.6 },
      animate: {
        opacity: [1, 1, 0],
        scale: [1, 1.15, 1.2],
        transition: { duration: 0.25, times: [0, 0.6, 1], ease: "easeOut" },
      },
    };
    // ----------------------------------------------------------

    // Refs (MUST be declared before conditional returns)
    const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestEffectiveStatsRef = useRef<EffectiveStats | null>(null);
    const enemyContainerRef = useRef<HTMLDivElement | null>(null);

    // Other hooks (MUST be declared before conditional returns)
    const usePotionAction = useCharacterStore((state) => state.usePotion);

    // Effect for effectiveStats ref (MUST be before conditional returns)
    useEffect(() => {
      latestEffectiveStatsRef.current = effectiveStats;
    }, [effectiveStats]);

    // Spawn Animation Effect (MUST be before conditional returns)
    useEffect(() => {
      if (currentEnemy && !currentEnemy.isDying) {
        const timer = setTimeout(() => {
          if (enemyContainerRef.current) {
            enemyContainerRef.current.classList.remove("enemy-spawn-initial");
            enemyContainerRef.current.classList.add("enemy-spawn-visible");
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }, [currentEnemy]);

    // <<< Internal handlers to update local state >>>
    const handleDisplayPlayerDamage = useCallback(
      (value: number, isCritical: boolean) => {
        setLastPlayerDamage({
          value: Math.floor(value),
          timestamp: Date.now(),
          id: crypto.randomUUID(),
          isCritical,
        });
      },
      []
    );

    const handleDisplayLifeLeech = useCallback((value: number) => {
      setLastLifeLeech({
        value: value,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    }, []);

    const handleDisplayEnemyThornsDamage = useCallback((value: number) => {
      setLastEnemyThornsDamage({
        value,
        timestamp: Date.now(),
        id: crypto.randomUUID(),
      });
    }, []);

    const handleDisplayEnemyDamage = useCallback(
      (value: number, type: EnemyDamageType) => {
        const damageId = crypto.randomUUID();
        const xPos = 15 + (Math.random() * 10 - 5);
        const yPos = 75 + (Math.random() * 10 - 5);
        setPlayerDamageTakenNumbers((prev) => [
          ...prev,
          { id: damageId, value: value, x: xPos, y: yPos, type: type },
        ]);
        setTimeout(() => {
          setPlayerDamageTakenNumbers((prev) =>
            prev.filter((dn) => dn.id !== damageId)
          );
        }, 800);
      },
      []
    );

    const handleDisplayMissText = useCallback(() => {
      const missId = crypto.randomUUID();
      const xPos = 15 + (Math.random() * 10 - 5);
      const yPos = 75 + (Math.random() * 10 - 5);
      setFloatingMissTexts((prev) => [
        ...prev,
        { id: missId, text: "MISS", x: xPos, y: yPos },
      ]);
      setTimeout(() => {
        setFloatingMissTexts((prev) => prev.filter((mt) => mt.id !== missId));
      }, 800);
    }, []);

    // --- Define Animation Trigger Handlers HERE (Now AFTER state/variants) ---
    const handleTriggerHitEffect = useCallback(
      (type: HitEffectType) => {
        console.log(
          `[AreaView] handleTriggerHitEffect called with type: ${type}`
        );
        const id = crypto.randomUUID();
        const x = 20 + Math.random() * 20; // <<< Top-left horizontal position (20% to 40%)
        const y = 20 + Math.random() * 20; // <<< Top-left vertical position (20% to 40%)
        const rotation = Math.random() * 90 - 45; // Keep random rotation
        setHitEffects((prev) => [...prev, { id, type, x, y, rotation }]);
        setTimeout(() => {
          setHitEffects((prev) => prev.filter((effect) => effect.id !== id));
        }, 350); // Keep lifespan relatively short
      },
      [setHitEffects] // Dependency array remains the same
    );

    const handleTriggerEnemyShake = useCallback(() => {
      console.log("[AreaView] handleTriggerEnemyShake called.");
      shakeControls.start(shakeAnimation);
    }, [shakeControls, shakeAnimation]);
    // -----------------------------------------------------------------------

    // --- Effects to clear local display states after timeout ---
    useEffect(() => {
      if (lastPlayerDamage) {
        const timer = setTimeout(() => {
          setLastPlayerDamage(null);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [lastPlayerDamage]);

    useEffect(() => {
      if (lastLifeLeech) {
        const timer = setTimeout(() => {
          setLastLifeLeech(null);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [lastLifeLeech]);

    useEffect(() => {
      if (lastEnemyThornsDamage) {
        const timer = setTimeout(() => {
          setLastEnemyThornsDamage(null);
        }, 800);
        return () => clearTimeout(timer);
      }
    }, [lastEnemyThornsDamage]);

    // <<< Log hitEffects state before return >>>
    console.log("[AreaView Render] Hit Effects State:", hitEffects);

    // <<< useImperativeHandle (Should be correct now) >>>
    useImperativeHandle(
      ref,
      () => ({
        displayPlayerDamage: handleDisplayPlayerDamage,
        displayLifeLeech: handleDisplayLifeLeech,
        displayEnemyThornsDamage: handleDisplayEnemyThornsDamage,
        displayEnemyDamage: handleDisplayEnemyDamage,
        displayMissText: handleDisplayMissText,
        triggerHitEffect: handleTriggerHitEffect,
        triggerEnemyShake: handleTriggerEnemyShake,
      }),
      [
        handleDisplayPlayerDamage,
        handleDisplayLifeLeech,
        handleDisplayEnemyThornsDamage,
        handleDisplayEnemyDamage,
        handleDisplayMissText,
        handleTriggerHitEffect,
        handleTriggerEnemyShake,
      ]
    );
    // <<< END useImperativeHandle >>>

    // --- UNMOUNT cleanup ---
    useEffect(() => {
      return () => {
        console.log(
          "[AreaView UNMOUNT Cleanup] Clearing spawn timer (if any)."
        );
        if (spawnTimeoutRef.current) {
          clearTimeout(spawnTimeoutRef.current);
          spawnTimeoutRef.current = null;
        }
      };
    }, []);
    // -------------------------------------------------------

    // Loading check (Conditional return is OKAY AFTER ALL HOOKS)
    if (!character || !area) {
      return null;
    }

    // --- Derived State & Constants (After null check) ---
    // <<< Use killsToComplete prop >>>
    const areaComplete = enemiesKilledCount >= killsToComplete;
    const isTown = area.id === "cidade_principal";

    // Add log before return
    console.log("[AreaView Render Check] Conditions:", {
      isTown,
      areaComplete, // Uses the prop now
      currentEnemyName: currentEnemy?.name,
    });

    const enemyHealthPercentage = currentEnemy
      ? (currentEnemy.currentHealth / currentEnemy.maxHealth) * 100
      : 0;

    const xpPercentage =
      xpToNextLevel > 0 ? (character.currentXP / xpToNextLevel) * 100 : 0;
    const playerHealthPercentage =
      ((character?.currentHealth ?? 0) / (effectiveStats?.maxHealth ?? 1)) *
      100;

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
      const percentage = Math.max(
        0,
        Math.min(100, (currentVal / maxVal) * 100)
      );
      return isNaN(percentage) ? 0 : percentage; // Extra safety
    };
    const barrierPercentage = calculateBarrierPercentage(
      character?.currentBarrier,
      effectiveStats?.totalBarrier
    );
    // <<< ADD LOG: Check barrier values before render >>>
    console.log("[AreaView Barrier Check]", {
      currentBarrier: character?.currentBarrier,
      totalBarrier: effectiveStats?.totalBarrier,
      calculatedPercentage: barrierPercentage,
      playerHealthPercentage: playerHealthPercentage, // Log health % for comparison
    });
    // -------------------------------------------------------------

    // <<< ADD Log for Enemy Health Percentage >>>
    console.log("[AreaView Render] Enemy Health %:", enemyHealthPercentage);
    // -------------------------------------------------------------

    // --- Return JSX ---
    // Add log right before return to check button disable condition
    console.log(
      `[AreaView Potion Check] Potions: ${character.healthPotions}, Current: ${
        character.currentHealth
      }, Max: ${effectiveStats?.maxHealth ?? "N/A"}, Disabled Check Result: ${
        // Use effectiveStats.maxHealth
        !effectiveStats ||
        character.healthPotions <= 0 ||
        character.currentHealth >= effectiveStats.maxHealth
      }`
    );
    // <<< ADD LOG TO CHECK windCrystals VALUE AND TYPE >>>
    // console.log('[AreaView Render] Checking windCrystals:', { value: windCrystals, type: typeof windCrystals });
    // ----------------------------------------------------

    return (
      <div
        className="flex flex-col border border-white flex-grow relative bg-black animate-fade-in opacity-0"
        style={{ minHeight: "70vh" }}
      >
        <button
          // Pass areaComplete to the handler
          onClick={() => onReturnToMap(areaComplete)}
          className="absolute top-2 right-2 p-1 border border-white rounded text-white hover:bg-gray-700 focus:outline-none z-20"
          aria-label="Voltar ao Mapa"
        >
          <FaArrowLeft />
        </button>

        {/* NEW: Pending Drops Button (Top Left) */}
        {pendingDropCount > 0 && !isTown && (
          <button
            onClick={onOpenDropModalForViewing}
            className="absolute top-12 right-2 px-2 py-1 border border-gray-600 bg-gray-800 rounded text-white hover:bg-gray-700 focus:outline-none flex items-center gap-1 z-20"
            aria-label={`Ver ${pendingDropCount} itens pendentes`}
          >
            <FaShoppingBag size={16} />
            <span className="bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 relative -top-1 -right-1">
              {pendingDropCount}
            </span>
          </button>
        )}

        {/* NEW: Wind Crystal Display (Bottom Right) */}
        {!isTown && (
          <div
            className="absolute bottom-24 right-4 flex items-center gap-1 px-2 py-1 text-white z-20 text-shadow-sm"
            title={`Cristais do Vento: ${windCrystals}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              className="w-4 h-4 fill-current"
            >
              <path d="M224 140.1C224 124 239.1 110.8 255.6 110.8C272.9 110.8 288 124 288 140.1V334.9C288 351 272.9 364.2 255.6 364.2C239.1 364.2 224 351 224 334.9V140.1zM128.2 156.3C128.2 140.2 143.3 126.1 160.7 126.1C178 126.1 193 140.2 193 156.3V359.7C193 375.8 178 389.9 160.7 389.9C143.3 389.9 128.2 375.8 128.2 359.7V156.3zM321.1 156.3C321.1 140.2 336.2 126.1 353.5 126.1C370.8 126.1 385.9 140.2 385.9 156.3V359.7C385.9 375.8 370.8 389.9 353.5 389.9C336.2 389.9 321.1 375.8 321.1 359.7V156.3zM85.37 188.5C85.37 172.4 99.54 158.2 116.8 158.2C134.1 158.2 149.2 172.4 149.2 188.5V327.5C149.2 343.6 134.1 357.8 116.8 357.8C99.54 357.8 85.37 343.6 85.37 327.5V188.5zM426.6 188.5C426.6 172.4 412.5 158.2 395.2 158.2C377.9 158.2 362.8 172.4 362.8 188.5V327.5C362.8 343.6 377.9 357.8 395.2 357.8C412.5 357.8 426.6 343.6 426.6 327.5V188.5zM42.67 220.6C42.67 204.5 56.83 190.4 74.17 190.4C91.5 190.4 106.7 204.5 106.7 220.6V295.4C106.7 311.5 91.5 325.6 74.17 325.6C56.83 325.6 42.67 311.5 42.67 295.4V220.6zM469.3 220.6C469.3 204.5 455.2 190.4 437.8 190.4C420.5 190.4 405.3 204.5 405.3 220.6V295.4C405.3 311.5 420.5 325.6 437.8 325.6C455.2 325.6 469.3 311.5 469.3 295.4V220.6z" />
            </svg>
            <span className="text-sm font-semibold">{windCrystals}</span>
          </div>
        )}

        {/* Vendor Button (Top Right - Only in Town) */}
        {isTown && (
          <button
            onClick={onOpenVendor}
            className="absolute top-1/2 right-2 transform -translate-y-1/2 px-3 py-2 border border-yellow-400 bg-yellow-900/50 rounded text-yellow-300 hover:bg-yellow-800/50 focus:outline-none flex items-center gap-1.5 z-20"
            aria-label="Abrir Vendedor"
          >
            <FaStore size={18} />
            <span className="hidden sm:inline">Vendedor</span>
          </button>
        )}

        {/* Area Info - Conditional Title */}
        <h2 className="text-xl font-semibold mb-1 text-white pt-8">
          {" "}
          {/* Add padding-top to avoid overlap */}
          {isTown ? area.name : `${area.name} (Nv. ${area.level})`}
        </h2>
        {/* Conditionally render kill count - hide in town */}
        {!isTown && (
          // Add wrapper div to limit width and center
          <div className="mb-3 max-w-xs mx-auto">
            <p className="text-xs text-center text-gray-400 mb-1">
              {" "}
              {/* Restore mb-1 */}
              Inimigos: {enemiesKilledCount} / {killsToComplete}
            </p>
            {/* Restore original height and keep structure */}
            <div className="w-full bg-gray-700 rounded h-2.5 border border-gray-500 overflow-hidden">
              {" "}
              {/* Restore h-2.5 */}
              <div
                className="bg-purple-600 h-full transition-width duration-300 ease-linear"
                style={{
                  width: `${(enemiesKilledCount / killsToComplete) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex-grow flex flex-col items-center justify-center relative min-h-[200px]">
          {/* Damage Numbers Layer */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {/* --- Update rendering to use conditional colors --- */}
            {playerDamageTakenNumbers.map((dn) => {
              // Determine text color based on damage type
              let textColorClass = "text-white"; // Default to white (for physical)
              switch (dn.type) {
                case "cold":
                  textColorClass = "text-blue-400";
                  break;
                case "fire":
                  textColorClass = "text-orange-500"; // Orange for fire
                  break;
                case "lightning":
                  textColorClass = "text-yellow-400"; // Yellow for lightning
                  break;
                case "void":
                  textColorClass = "text-purple-400";
                  break;
                // case "physical": // Already default
                //   textColorClass = "text-white";
                //   break;
              }

              return (
                <span
                  key={dn.id}
                  className={`absolute text-xl font-bold animate-diablo-damage-float ${textColorClass} text-stroke-black`}
                  style={{
                    left: `${dn.x}%`,
                    top: `${dn.y}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {dn.value}
                </span>
              );
            })}
            {/* <<< Render Floating MISS Text >>> */}
            {floatingMissTexts.map((mt) => (
              <span
                key={mt.id}
                className="absolute text-xl font-bold animate-float-up-fade text-gray-400" // Style for MISS
                style={{
                  left: `${mt.x}%`,
                  top: `${mt.y}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {mt.text}
              </span>
            ))}
            {/* -------------------------------- */}

            {/* Floating Player Damage Numbers (damage dealt TO enemy) */}
            {lastPlayerDamage && (
              <div
                key={lastPlayerDamage.id}
                className={`
                absolute text-center pointer-events-none
                animate-float-up-fade font-bold
                ${
                  lastPlayerDamage.isCritical
                    ? "text-red-500 text-3xl" // Critical: Red, larger
                    : "text-white text-2xl text-stroke-black" // Normal: White, slightly smaller, black outline
                }
              `}
                style={{
                  left: `50%`, // Centered horizontally
                  top: `15%`, // Positioned higher for player damage
                  transform: "translateX(-50%)",
                }}
              >
                {lastPlayerDamage.value}
                {/* Add 'CRITICO!!!' suffix for critical hits */}
                {lastPlayerDamage.isCritical && " CRITICO!!!"}
              </div>
            )}

            {/* NEW: Floating Life Leech Numbers */}
            {lastLifeLeech && (
              <div
                key={lastLifeLeech.id}
                className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-green-500 text-xl" // Green, slightly smaller than normal damage
                style={{
                  left: `55%`, // Position slightly to the right of damage
                  top: `25%`, // Position slightly lower than damage
                  transform: "translateX(-50%)",
                }}
              >
                +{lastLifeLeech.value}
              </div>
            )}

            {/* NEW: Floating Enemy Thorns Damage Numbers */}
            {lastEnemyThornsDamage && (
              <div
                key={lastEnemyThornsDamage.id}
                // Style similar to player damage, but maybe different color/position?
                className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-purple-400 text-xl" // Purple for thorns?
                style={{
                  left: `45%`, // Position slightly to the left of damage
                  top: `20%`, // Position slightly higher than leech
                  transform: "translateX(-50%)",
                }}
              >
                {lastEnemyThornsDamage.value} (Thorns)
              </div>
            )}
          </div>

          {/* --- REMOVE Orphaned Animation Layer --- */}
          {/* 
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            // ... REMOVE all rendering logic inside this old div ...
          </div>
           */}
          {/* ----------------------------------------- */}

          {/* Enemy/Completion/Town Display */}
          {isTown ? (
            // Display safe zone message in town
            <p className="text-lg text-gray-400">Zona Segura.</p>
          ) : areaComplete ? (
            <p className="text-2xl text-green-400 font-bold">Área Concluída!</p>
          ) : currentEnemy ? (
            // --- Wrap with Radix Tooltip components ---
            <Tooltip.Provider delayDuration={100}>
              {" "}
              {/* Optional: Add delay */}
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  {/* <<< Wrap Enemy Div in motion.div for shaking AND add relative positioning >>> */}
                  <motion.div
                    className={`
                      text-center relative z-0
                      transition-opacity duration-500 ease-out
                      ${
                        currentEnemy.isDying
                          ? "opacity-0"
                          : "enemy-spawn-visible"
                      }
                      ${!currentEnemy.isDying ? "enemy-spawn-initial" : ""}
                    `}
                    ref={enemyContainerRef}
                  >
                    {/* Enemy Name (Stays outside inner motion.div) */}
                    <p className="text-lg font-medium text-white mb-1">
                      {currentEnemy.name} (Nv. {currentEnemy.level})
                    </p>

                    {/* <<< INNER motion.div for Sprite + Hit Effects (for shaking and relative positioning) >>> */}
                    <motion.div
                      className="relative text-6xl my-4 h-48 w-48 mx-auto flex items-center justify-center" // <<< ADD relative positioning
                      animate={shakeControls} // <<< APPLY shake controls HERE
                    >
                      {/* Hit Effects Layer (INSIDE inner motion.div) */}
                      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                        <AnimatePresence>
                          {hitEffects.map((effect) => {
                            // <<< Updated Hit Effect Styles >>>
                            let effectElement;

                            switch (effect.type) {
                              case "1h": // Slash sprite
                                effectElement = (
                                  <img
                                    src="/sprites/effects/slash.png"
                                    alt="Hit Slash"
                                    className="w-16 h-16 object-contain pointer-events-none filter drop-shadow-[0_0_5px_rgba(255,0,0,1)]" // Stronger, opaque red drop-shadow
                                    style={{ rotate: `${effect.rotation}deg` }} // Apply random rotation
                                  />
                                );
                                break;
                              case "2h": // Larger Slash sprite
                                effectElement = (
                                  <img
                                    src="/sprites/effects/slash.png"
                                    alt="Heavy Hit Slash"
                                    className="w-20 h-20 object-contain pointer-events-none filter drop-shadow-[0_0_7px_rgba(255,0,0,1)]" // Even stronger, opaque red drop-shadow
                                    style={{ rotate: `${effect.rotation}deg` }} // Apply random rotation
                                  />
                                );
                                break;
                              case "unarmed": // "Impact Burst"
                              default:
                                effectElement = (
                                  // Keep previous circle burst style
                                  <div className="w-10 h-10 pointer-events-none border-2 border-white rounded-full" />
                                );
                                break;
                            }

                            return (
                              <motion.div
                                key={effect.id}
                                className="absolute z-20 pointer-events-none" // Added pointer-events-none here
                                style={{
                                  left: `${effect.x}%`,
                                  top: `${effect.y}%`,
                                  transform: "translate(-50%, -50%)", // Center the effect
                                  transformOrigin: "center center",
                                }}
                                variants={hitEffectVariants}
                                initial="initial"
                                animate="animate"
                              >
                                {effectElement}{" "}
                                {/* Render the styled element */}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                      {/* <<< End Hit Effects Layer >>> */}

                      {/* Sprite/Emoji (INSIDE inner motion.div) */}
                      {currentEnemy.iconPath ? (
                        <img
                          src={currentEnemy.iconPath}
                          alt={currentEnemy.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : currentEnemy.emoji ? (
                        <span>{currentEnemy.emoji}</span>
                      ) : (
                        <span>?</span>
                      )}
                      {/* <<< End Sprite/Emoji >>> */}
                    </motion.div>
                    {/* <<< END INNER motion.div >>> */}

                    {/* Health Bar & Text (Stays outside inner motion.div) */}
                    <div className="w-full bg-gray-700 rounded h-4 border border-gray-500 overflow-hidden mb-1">
                      {/* Restore the inner health bar div */}
                      <div
                        className="bg-red-600 h-full transition-width duration-150 ease-linear"
                        style={{ width: `${enemyHealthPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-300 mb-4">
                      {currentEnemy.currentHealth} / {currentEnemy.maxHealth}
                    </p>
                  </motion.div>
                  {/* <<< End OUTER container >>> */}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg border border-gray-600 z-50" // Basic styling
                    sideOffset={5}
                  >
                    {`Tipo de Dano: ${getDamageTypeDisplayName(
                      currentEnemy.damageType
                    )}`}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          ) : (
            // --------------------------------------------
            // Only show "Procurando inimigos..." if not in town
            <p className="text-gray-500">Procurando inimigos...</p>
          )}
        </div>

        {/* Player Stats Display (Health Orb & XP Bar) - Positioned at the bottom */}
        <div className="absolute bottom-8 left-4 right-4 flex items-end justify-between gap-4 px-2">
          {/* Left Side: Health Orb with Text Above */}
          <div className="relative w-20 h-20 flex flex-col items-center">
            {/* <<< ADD Barrier Text Above Health Text >>> */}
            <p className="text-xs text-blue-300 font-semibold mb-0">
              {Math.floor(character.currentBarrier ?? 0)}/
              {Math.floor(effectiveStats?.totalBarrier ?? 0)}
            </p>
            {/* Text Above Orb */}
            <p className="text-xs text-white font-semibold mb-0.5">
              {Math.floor(character.currentHealth)}/
              {Math.floor(effectiveStats?.maxHealth ?? 0)}
            </p>
            {/* Orb SVG */}
            <svg
              className="w-16 h-16 overflow-visible orb-glow-red"
              viewBox="0 0 100 100"
            >
              <defs>
                <clipPath id="healthClipPathArea">
                  <rect
                    x="0"
                    y={100 - playerHealthPercentage}
                    width="100"
                    height={playerHealthPercentage}
                  />
                </clipPath>
                {/* <<< ADD Barrier Clip Path >>> */}
                <clipPath id="barrierClipPathArea">
                  <rect
                    x="0"
                    y={100 - barrierPercentage}
                    width="100"
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
                fill="#60a5fa" // Light blue
                fillOpacity="0.6"
                clipPath="url(#barrierClipPathArea)"
              />
              {/* <<< REORDER: Health Fill SECOND >>> */}
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#991b1b"
                clipPath="url(#healthClipPathArea)"
              />
              {/* <<< REORDER: Barrier Fill LAST (On Top) >>> */}
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="#60a5fa" // Light blue
                fillOpacity="0.6"
                clipPath="url(#barrierClipPathArea)"
              />
            </svg>
          </div>

          <div className="flex-grow flex flex-col items-center h-20 justify-end mb-1">
            <span className="text-xs text-gray-300 mb-1">
              XP: {character.currentXP} / {xpToNextLevel} (Nível{" "}
              {character.level})
            </span>
            <div className="w-full bg-gray-700 rounded h-3 border border-gray-500 overflow-hidden">
              <div
                className="bg-yellow-400 h-full transition-width duration-300 ease-linear"
                style={{ width: `${xpPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex justify-center h-20 items-end gap-1">
            <button
              onClick={usePotionAction} // Call the store action
              // Use effectiveStats.maxHealth for the check
              disabled={
                !effectiveStats || // Add null check for effectiveStats
                character.healthPotions <= 0 ||
                character.currentHealth >= effectiveStats.maxHealth // Use calculated max
              }
              className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-red-800 text-white rounded border border-white transition-opacity ${
                // <<< Check this class logic
                // Update the disabled class logic as well
                !effectiveStats ||
                character.healthPotions <= 0 ||
                character.currentHealth >= effectiveStats.maxHealth
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-red-700"
              }`}
              title={`Usar Poção de Vida (${character.healthPotions} restantes)`}
            >
              <FaHeart /> ({character.healthPotions})
            </button>

            <button
              onClick={onUseTeleportStone} // <<< Use the passed prop
              disabled={character.teleportStones <= 0 || isTown} // <<< Disable in town too
              className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-blue-800 text-white rounded border border-white transition-opacity ${
                character.teleportStones <= 0 || isTown
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700 orb-glow-blue"
              }`}
              title={`Usar Pedra de Teleporte (${character.teleportStones} restantes)`}
            >
              <FaMagic /> ({character.teleportStones})
            </button>

            {/* Wind Crystal Display - REMOVED */}
          </div>
        </div>
      </div>
    );
  }
); // <<< Close forwardRef function body

AreaView.displayName = "AreaView"; // <<< Add display name for DevTools

export default AreaView;
