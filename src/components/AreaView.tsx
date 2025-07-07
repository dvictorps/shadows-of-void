"use client";

import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Character,
  MapLocation,
  EnemyInstance,
  EnemyDamageType,
} from "../types/gameData";
import { EffectiveStats } from "../utils/statUtils";
import { useCharacterStore } from "../stores/characterStore";
import { motion } from "framer-motion";
import { HitEffectType } from "@/types/gameData";
import TopControls from "./AreaView/TopControls";
import AreaHeader from "./AreaView/AreaHeader";
import DamageOverlay from "./AreaView/DamageOverlay";
import PlayerOrbs from "./AreaView/PlayerOrbs";
import EnemyDisplay from "./AreaView/EnemyDisplay";
import XPBar from "./AreaView/XPBar";
import ConsumablesBar from "./AreaView/ConsumablesBar";
import { useEnemyEffects } from "../hooks/useEnemyEffects";
import { useBossEncounter } from "../hooks/useBossEncounter";
import { useFloatingNumbers } from "../hooks/useFloatingNumbers";
import { useSoundEffects } from "../hooks/useSoundEffects";
import PendingDropsButton from "./AreaView/PendingDropsButton";
import WindCrystalDisplay from "./AreaView/WindCrystalDisplay";
import { useAreaStatus } from "../hooks/useAreaStatus";
// import { calculatePercentage } from "@/utils/combatUI"; // reserved for future use

export type { HitEffectType };

export interface AreaViewHandles {
  displayPlayerDamage: (value: number, isCritical: boolean) => void;
  displayLifeLeech: (value: number) => void;
  displayEnemyThornsDamage: (value: number) => void;
  displayEnemyDamage: (value: number, damageType: EnemyDamageType) => void;
  displayMissText: () => void;
  triggerHitEffect: (type: HitEffectType) => void;
  triggerEnemyShake: () => void;
  playEnemyDeathSound: (enemyTypeId: string) => void;
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
  onOpenStash: () => void;
  onUseTeleportStone: () => void;
  windCrystals: number;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  killsToComplete: number;
  setIsBossSpawning: (isSpawning: boolean) => void;
}

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
      onOpenStash,
      onUseTeleportStone,
      windCrystals,
      currentEnemy,
      enemiesKilledCount,
      killsToComplete,
      setIsBossSpawning,
    },
    ref
  ) => {
    const {
      data: {
        playerDamageTakenNumbers,
        floatingMissTexts,
        lastPlayerDamage,
        lastLifeLeech,
        lastEnemyThornsDamage,
      },
      actions: {
        displayPlayerDamage,
        displayLifeLeech,
        displayEnemyThornsDamage,
        displayEnemyDamage,
        displayMissText,
      },
    } = useFloatingNumbers();

    const {
      hitEffects,
      spriteFlash,
      shakeControls,
      screenShakeControls,
      handleShowHitEffect,
      handleTriggerEnemyShake,
      triggerScreenShake,
    } = useEnemyEffects();

    const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestEffectiveStatsRef = useRef<EffectiveStats | null>(null);
    const enemyContainerRef = useRef<HTMLDivElement | null>(null);

    const usePotionAction = useCharacterStore((state) => state.usePotion);

    const { playEnemyDeathSound } = useSoundEffects();

    useEffect(() => {
      latestEffectiveStatsRef.current = effectiveStats;
    }, [effectiveStats]);

    useImperativeHandle(
      ref,
      () => ({
        displayPlayerDamage,
        displayLifeLeech,
        displayEnemyThornsDamage,
        displayEnemyDamage,
        displayMissText,
        triggerHitEffect: handleShowHitEffect,
        triggerEnemyShake: handleTriggerEnemyShake,
        playEnemyDeathSound,
      }),
      [
        displayPlayerDamage,
        displayLifeLeech,
        displayEnemyThornsDamage,
        displayEnemyDamage,
        displayMissText,
        handleShowHitEffect,
        handleTriggerEnemyShake,
        playEnemyDeathSound,
      ]
    );

    useEffect(() => {
      return () => {
        if (spawnTimeoutRef.current) {
          clearTimeout(spawnTimeoutRef.current);
          spawnTimeoutRef.current = null;
        }
      };
    }, []);

    const { isTown, areaComplete } = useAreaStatus({
      area,
      currentEnemy,
      enemiesKilledCount,
      killsToComplete,
    });

    const { isBossEncounter, bossEncounterPhase } = useBossEncounter({
      currentEnemy,
      enemyContainerRef,
      setIsBossSpawning,
      triggerScreenShake,
    });

    if (!character || !area) {
      return null;
    }

    // If needed elsewhere, we can compute barrier percentage via util
    // const barrierPercentage = calculatePercentage(character?.currentBarrier, effectiveStats?.totalBarrier);

    return (
      <motion.div
        animate={screenShakeControls}
        className="flex flex-col border border-white flex-grow relative bg-black animate-fade-in opacity-0"
        style={{ minHeight: "70vh" }}
      >
        <PendingDropsButton count={pendingDropCount} onClick={onOpenDropModalForViewing} />
        {!isTown && <WindCrystalDisplay value={windCrystals} />}

        <AreaHeader
          isTown={isTown}
          areaName={area.name}
          areaLevel={area.level}
          enemiesKilledCount={enemiesKilledCount}
          killsToComplete={killsToComplete}
        />

        <div className="flex-grow flex flex-col items-center justify-center relative min-h-[200px]">
          <DamageOverlay
            playerDamageTakenNumbers={playerDamageTakenNumbers}
            floatingMissTexts={floatingMissTexts}
            lastPlayerDamage={lastPlayerDamage}
            lastLifeLeech={lastLifeLeech}
            lastEnemyThornsDamage={lastEnemyThornsDamage}
          />

          {isTown ? (
            <p className="text-lg text-gray-400">Zona Segura.</p>
          ) : areaComplete ? (
            <p className="text-2xl text-green-400 font-bold">Área Concluída!</p>
          ) : (
            <EnemyDisplay
              currentEnemy={currentEnemy}
              hitEffects={hitEffects}
              spriteFlash={spriteFlash}
              shakeControls={shakeControls}
              enemyContainerRef={enemyContainerRef}
              isBossEncounter={isBossEncounter}
              bossEncounterPhase={bossEncounterPhase}
            />
          )}
        </div>

        <div className="absolute bottom-8 left-4 right-4 flex items-end justify-between gap-4 px-2">
          <PlayerOrbs
            currentHealth={character.currentHealth}
            maxHealth={effectiveStats?.maxHealth ?? 0}
            currentBarrier={character.currentBarrier}
            totalBarrier={effectiveStats?.totalBarrier}
            currentMana={character.currentMana}
            maxMana={character.maxMana}
            isMage={character?.class === "Mago"}
          />

          <XPBar
            currentXP={character.currentXP}
            xpToNextLevel={xpToNextLevel}
            level={character.level}
          />

          <ConsumablesBar
            healthPotions={character.healthPotions}
            teleportStones={character.teleportStones}
            currentHealth={character.currentHealth}
            maxHealth={effectiveStats?.maxHealth ?? 0}
            isTown={isTown}
            onUsePotion={usePotionAction}
            onUseTeleportStone={onUseTeleportStone}
          />
        </div>

        <TopControls
          isTown={isTown}
          areaComplete={areaComplete}
          onReturnToMap={onReturnToMap}
          onOpenVendor={onOpenVendor}
          onOpenStash={onOpenStash}
        />
      </motion.div>
    );
  }
);

AreaView.displayName = "AreaView";

export default AreaView;
