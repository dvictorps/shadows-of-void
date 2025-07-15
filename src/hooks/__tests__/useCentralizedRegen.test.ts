import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCentralizedRegen } from '../useCentralizedRegen';
import { act, renderHook } from '@testing-library/react';

const mockCharacter = {
  id: 1,
  name: 'TestHero',
  class: 'Mago',
  isHardcore: false,
  level: 1,
  currentXP: 0,
  currentAct: 1,
  currentAreaId: 'area1',
  unlockedAreaIds: ['area1'],
  strength: 1,
  dexterity: 1,
  intelligence: 10,
  armor: 0,
  evasion: 0,
  barrier: 0,
  blockChance: 0,
  baseMaxHealth: 100,
  maxHealth: 100,
  currentHealth: 50,
  currentBarrier: 0,
  baseMaxMana: 50,
  maxMana: 50,
  currentMana: 10,
  fireResistance: 0,
  coldResistance: 0,
  lightningResistance: 0,
  voidResistance: 0,
  minBaseDamage: 1,
  maxBaseDamage: 2,
  criticalStrikeChance: 0,
  criticalStrikeMultiplier: 150,
  projectileDamage: 0,
  spellDamage: 0,
  fireDamage: 0,
  coldDamage: 0,
  lightningDamage: 0,
  voidDamage: 0,
  movementSpeed: 0,
  attackSpeed: 1,
  castSpeed: 1,
  healthPotions: 0,
  teleportStones: 0,
  inventory: [],
  equipment: {},
};

const mockStats = {
  minDamage: 0,
  maxDamage: 0,
  minPhysDamage: 0,
  maxPhysDamage: 0,
  minEleDamage: 0,
  maxEleDamage: 0,
  attackSpeed: 0,
  critChance: 0,
  critMultiplier: 0,
  dps: 0,
  physDps: 0,
  eleDps: 0,
  lifeLeechPercent: 0,
  maxHealth: 100,
  totalArmor: 0,
  totalEvasion: 0,
  totalBarrier: 40,
  totalBlockChance: 0,
  finalFireResistance: 0,
  finalColdResistance: 0,
  finalLightningResistance: 0,
  finalVoidResistance: 0,
  finalLifeRegenPerSecond: 7,
  finalManaRegenPerSecond: 5,
  flatManaRegen: 0,
  percentManaRegen: 0,
  thornsDamage: 0,
  estimatedPhysReductionPercent: 0,
  totalPhysTakenAsElementPercent: 0,
  totalReducedPhysDamageTakenPercent: 0,
  weaponBaseMinPhys: 0,
  weaponBaseMaxPhys: 0,
  weaponBaseMinEle: 0,
  weaponBaseMaxEle: 0,
  weaponBaseAttackSpeed: 0,
  weaponBaseCritChance: 0,
  globalFlatMinPhys: 0,
  globalFlatMaxPhys: 0,
  globalFlatMinFire: 0,
  globalFlatMaxFire: 0,
  globalFlatMinCold: 0,
  globalFlatMaxCold: 0,
  globalFlatMinLightning: 0,
  globalFlatMaxLightning: 0,
  globalFlatMinVoid: 0,
  globalFlatMaxVoid: 0,
  increasePhysDamagePercent: 0,
  increaseAttackSpeedPercent: 0,
  increaseEleDamagePercent: 0,
  increaseFireDamagePercent: 0,
  increaseColdDamagePercent: 0,
  increaseLightningDamagePercent: 0,
  increaseVoidDamagePercent: 0,
  increaseGlobalCritChancePercent: 0,
  totalMovementSpeed: 0,
  maxMana: 50,
};

describe('useCentralizedRegen', () => {
  let char;
  let stats;
  let updateCharacter;
  let saveCharacter;
  let barrierZeroTimestamp;
  let setBarrierZeroTimestamp;

  beforeEach(() => {
    char = { ...mockCharacter };
    stats = { ...mockStats };
    updateCharacter = vi.fn((data) => Object.assign(char, data));
    saveCharacter = vi.fn();
    barrierZeroTimestamp = Date.now();
    setBarrierZeroTimestamp = vi.fn((v) => { barrierZeroTimestamp = v; });
  });

  it('regenera vida e mana corretamente a cada 1s', () => {
    const { result } = renderHook(() => useCentralizedRegen({
      activeCharacter: char,
      effectiveStats: stats,
      barrierZeroTimestamp,
      setBarrierZeroTimestamp,
      updateCharacter,
      saveCharacter,
    }));
    // 1s: +7 vida, +5 mana
    act(() => { result.current.tickRegen(1000); });
    expect(char.currentHealth).toBe(57);
    expect(char.currentMana).toBe(15);
    // 2s: +7 vida, +5 mana
    act(() => { result.current.tickRegen(1000); });
    expect(char.currentHealth).toBe(64);
    expect(char.currentMana).toBe(20);
    // 3s: +7 vida, +5 mana
    act(() => { result.current.tickRegen(1000); });
    expect(char.currentHealth).toBe(71);
    expect(char.currentMana).toBe(25);
  });

  it('recarrega barreira após 6s', () => {
    char.currentBarrier = 0;
    stats.totalBarrier = 40;
    barrierZeroTimestamp = Date.now();
    const { result } = renderHook(() => useCentralizedRegen({
      activeCharacter: char,
      effectiveStats: stats,
      barrierZeroTimestamp,
      setBarrierZeroTimestamp,
      updateCharacter,
      saveCharacter,
    }));
    // Avança 5s: não recarrega ainda
    act(() => { result.current.tickRegen(5000); });
    expect(char.currentBarrier).toBe(0);
    // Avança mais 1s: recarrega
    act(() => { result.current.tickRegen(1000); });
    expect(char.currentBarrier).toBe(40);
    expect(setBarrierZeroTimestamp).toHaveBeenCalledWith(null);
  });
}); 