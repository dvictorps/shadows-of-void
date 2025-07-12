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
} from "@/types/gameData";
import { EffectiveStats } from "@/utils/statUtils/weapon";
import { useCharacterStore } from "@/stores/characterStore";
import { motion } from "framer-motion";
import { HitEffectType } from "@/types/gameData";
import TopControls from "./TopControls";
import AreaHeader from "./AreaHeader";
import DamageOverlay from "./DamageOverlay";
import PlayerOrbs from "./PlayerOrbs";
import EnemyDisplay from "./EnemyDisplay";
import XPBar from "./XPBar";
import ConsumablesBar from "./ConsumablesBar";
import { useEnemyEffects } from "../hooks/useEnemyEffects";
import { useBossEncounter } from "../hooks/useBossEncounter";
import { useFloatingNumbers } from "../hooks/useFloatingNumbers";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import PendingDropsButton from "./PendingDropsButton";
import { useAreaStatus } from "../hooks/useAreaStatus";
import { useElementalInstanceStore } from '@/stores/elementalInstanceStore';
import type { ElementalInstance } from '@/stores/elementalInstanceStore';
import * as Tooltip from '@radix-ui/react-tooltip';
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
  isBossSpawning: boolean;
  setIsBossSpawning: (v: boolean) => void;
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

    const { isBossEncounter, bossEncounterPhase, setBossEncounterPhase } = useBossEncounter({
      currentEnemy,
      enemyContainerRef,
      triggerScreenShake,
    });

    // Sincronize o flag de boss spawning com a fase do boss
    useEffect(() => {
      if (bossEncounterPhase === "sprite" || bossEncounterPhase === "nameAndHp") {
        setIsBossSpawning(true);
        return;
      }
      setIsBossSpawning(false);
    }, [bossEncounterPhase, setIsBossSpawning]);

    // --- Instância Elemental (global via store) ---
    const selectedInstance = useElementalInstanceStore(s => s.selectedInstance);
    const setSelectedInstance = useElementalInstanceStore(s => s.setSelectedInstance);
    const instanceOptions = [
      { key: 'fogo', label: 'Fogo', emoji: '🔥' },
      { key: 'gelo', label: 'Gelo', emoji: '❄️' },
      { key: 'raio', label: 'Raio', emoji: '⚡' },
    ];

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
        {/* --- Instância Elemental Skills: apenas para mago, coluna vertical à direita --- */}
        {character.class === 'Mago' && !isTown && (
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-20"
            style={{ minHeight: 180 }}
          >
            <Tooltip.Provider delayDuration={100}>
              {instanceOptions.map((inst) => (
                <Tooltip.Root key={inst.key}>
                  <Tooltip.Trigger asChild>
                    <button
                      onClick={() => setSelectedInstance(inst.key as ElementalInstance)}
                      className={`flex flex-col items-center px-3 py-2 rounded border-2 transition-all duration-150
                        ${selectedInstance === inst.key ? 'border-yellow-400 bg-gray-800 shadow-lg' : 'border-gray-600 bg-gray-900'}
                        hover:border-yellow-300`}
                      style={{ minWidth: 60 }}
                    >
                      <span className="text-2xl mb-1">{inst.emoji}</span>
                      <span className="text-xs text-white font-semibold">{inst.label}</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="left" className="bg-gray-900 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-600 z-50 max-w-[220px]">
                      {inst.key === 'fogo'
                        ? '+25% velocidade de ataque/cast. Custo: 10 de mana por hit.'
                        : inst.key === 'gelo'
                        ? '+30% do dano como dano de gelo (melee) ou +30% dano de gelo (spell). Custo: 10 de mana por hit.'
                        : '10% chance base de crítico. Custo: 5 de mana por hit.'}
                      <Tooltip.Arrow className="fill-gray-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ))}
            </Tooltip.Provider>
          </div>
        )}
        {/* --- Fim dos botões de instância --- */}
        <PendingDropsButton count={pendingDropCount} onClick={onOpenDropModalForViewing} />
        {/* Wind Crystal colado na direita, abaixo das instâncias do mago */}
        {!isTown && (
          <div className="absolute right-2 top-[calc(50%+110px)] flex items-center z-20 group mt-4">
            <span className="inline-block w-16 h-16">
              <img
                src="/sprites/ui/wind-crystal.png"
                alt="Wind Crystal"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </span>
            <span className="text-white text-xs font-bold flex items-center ml-1">x {windCrystals}</span>
            <span className="pointer-events-none absolute right-0 top-0 -translate-y-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
              Wind Crystal
            </span>
          </div>
        )}
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
              setBossEncounterPhase={setBossEncounterPhase}
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
