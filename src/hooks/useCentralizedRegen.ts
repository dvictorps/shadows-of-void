import { useRef } from 'react';
import { Character } from '../types/gameData';
import { EffectiveStats } from '../utils/statUtils/weapon';

interface UseCentralizedRegenProps {
  activeCharacter: Character | null;
  effectiveStats: EffectiveStats | null;
  barrierZeroTimestamp: number | null;
  setBarrierZeroTimestamp: (timestamp: number | null) => void;
  updateCharacter: (updates: Partial<Character>) => void;
  saveCharacter: () => void;
}

const BARRIER_RECHARGE_DELAY_MS = 6000;

export function useCentralizedRegen({
  activeCharacter,
  effectiveStats,
  barrierZeroTimestamp,
  setBarrierZeroTimestamp,
  updateCharacter,
  saveCharacter,
}: UseCentralizedRegenProps) {
  // Acumuladores de tempo para regen
  const manaRegenAccumulator = useRef(0);
  const lifeRegenAccumulator = useRef(0);
  // Acumulador para recarga de barreira
  const barrierAccumulator = useRef(0);
  // Guarda o último timestamp de zeragem da barreira
  const lastBarrierZeroTimestamp = useRef<number | null>(null);

  // Função a ser chamada pelo game loop
  function tickRegen(deltaTime: number) {
    if (!activeCharacter || !effectiveStats) return;

    // --- Regen de Mana ---
    const manaRegenRate = effectiveStats.finalManaRegenPerSecond ?? 0;
    if (manaRegenRate > 0 && activeCharacter.currentMana < activeCharacter.maxMana) {
      manaRegenAccumulator.current += deltaTime;
      if (manaRegenAccumulator.current >= 1000) {
        const ticks = Math.floor(manaRegenAccumulator.current / 1000);
        manaRegenAccumulator.current -= ticks * 1000;
        const manaHealAmount = Math.max(1, Math.floor(manaRegenRate)) * ticks;
        const freshMana = activeCharacter.currentMana;
        const newMana = Math.min(activeCharacter.maxMana, freshMana + manaHealAmount);
        if (newMana !== freshMana) {
          updateCharacter({ currentMana: newMana });
          setTimeout(() => saveCharacter(), 50);
        }
      }
    } else {
      manaRegenAccumulator.current = 0;
    }

    // --- Regen de Vida ---
    const lifeRegenRate = effectiveStats.finalLifeRegenPerSecond ?? 0;
    if (lifeRegenRate > 0 && activeCharacter.currentHealth > 0 && activeCharacter.currentHealth < effectiveStats.maxHealth) {
      lifeRegenAccumulator.current += deltaTime;
      if (lifeRegenAccumulator.current >= 1000) {
        const ticks = Math.floor(lifeRegenAccumulator.current / 1000);
        lifeRegenAccumulator.current -= ticks * 1000;
        const healAmount = Math.max(1, Math.floor(lifeRegenRate)) * ticks;
        const freshHp = activeCharacter.currentHealth;
        const newHp = Math.min(effectiveStats.maxHealth, freshHp + healAmount);
        if (newHp !== freshHp) {
          updateCharacter({ currentHealth: newHp });
          setTimeout(() => saveCharacter(), 50);
        }
      }
    } else {
      lifeRegenAccumulator.current = 0;
    }

    // --- Recarga de Barreira ---
    // Se a barreira está zerada e o timestamp foi setado
    if (
      (effectiveStats.totalBarrier ?? 0) > 0 &&
      (activeCharacter.currentBarrier ?? 0) <= 0 &&
      barrierZeroTimestamp !== null
    ) {
      // Se mudou o timestamp, zera o acumulador
      if (lastBarrierZeroTimestamp.current !== barrierZeroTimestamp) {
        barrierAccumulator.current = 0;
        lastBarrierZeroTimestamp.current = barrierZeroTimestamp;
      }
      barrierAccumulator.current += deltaTime;
      if (barrierAccumulator.current >= BARRIER_RECHARGE_DELAY_MS) {
        // Recarrega barreira
        updateCharacter({ currentBarrier: effectiveStats.totalBarrier });
        setTimeout(() => saveCharacter(), 50);
        setBarrierZeroTimestamp(null);
        barrierAccumulator.current = 0;
      }
    } else {
      barrierAccumulator.current = 0;
      lastBarrierZeroTimestamp.current = barrierZeroTimestamp;
    }
  }

  return { tickRegen };
} 