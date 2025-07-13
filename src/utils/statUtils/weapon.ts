import { Character } from "../../types/gameData";
import { ONE_HANDED_WEAPON_TYPES } from '../itemUtils';
import { ALL_ITEM_BASES } from '../../data/items';
import { getWeaponLocalStats, applyElementalInstanceBonusesToStats, getWeaponElementalBreakdown } from './weaponHelpers';
import { getGlobalModifiers, getGlobalStatsFromModifiers } from './globalModifiers';
import { getDefensiveStats, getRegenStats, getThornsStats, getEstimatedPhysReductionPercent, getPhysTakenAsElementStats } from './defensiveStats';
import { getAttributeBonuses } from './attributeBonuses';
import { getInitialElementalInstance } from '../../stores/elementalInstanceStore';

// Remover UNARMED_ATTACK_SPEED, JEWELRY_TYPES, getCurrentElementalInstance, instanceBonusActive, attributeBonuses
// Definir EffectiveStats localmente
export interface EffectiveStats {
  minDamage: number;
  maxDamage: number;
  minPhysDamage: number;
  maxPhysDamage: number;
  minEleDamage: number;
  maxEleDamage: number;
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
  dps: number;
  physDps: number;
  eleDps: number;
  lifeLeechPercent: number;
  maxHealth: number;
  totalArmor: number;
  totalEvasion: number;
  totalBarrier: number;
  totalBlockChance: number;
  finalFireResistance: number;
  finalColdResistance: number;
  finalLightningResistance: number;
  finalVoidResistance: number;
  finalLifeRegenPerSecond: number;
  finalManaRegenPerSecond: number;
  flatManaRegen: number;
  percentManaRegen: number;
  thornsDamage: number;
  estimatedPhysReductionPercent: number;
  totalPhysTakenAsElementPercent: number;
  totalReducedPhysDamageTakenPercent: number;
  weaponBaseMinPhys: number;
  weaponBaseMaxPhys: number;
  weaponBaseMinEle: number;
  weaponBaseMaxEle: number;
  weaponBaseAttackSpeed: number;
  weaponBaseCritChance: number;
  globalFlatMinPhys: number;
  globalFlatMaxPhys: number;
  globalFlatMinFire: number;
  globalFlatMaxFire: number;
  globalFlatMinCold: number;
  globalFlatMaxCold: number;
  globalFlatMinLightning: number;
  globalFlatMaxLightning: number;
  globalFlatMinVoid: number;
  globalFlatMaxVoid: number;
  increasePhysDamagePercent: number;
  increaseAttackSpeedPercent: number;
  increaseEleDamagePercent: number;
  increaseFireDamagePercent: number;
  increaseColdDamagePercent: number;
  increaseLightningDamagePercent: number;
  increaseVoidDamagePercent: number;
  increaseGlobalCritChancePercent: number;
  totalMovementSpeed: number;
  weapon2CalcMinPhys?: number;
  weapon2CalcMaxPhys?: number;
  weapon2CalcMinEle?: number;
  weapon2CalcMaxEle?: number;
  weapon2CalcAttackSpeed?: number;
  weapon2CalcCritChance?: number;
}

export function calculateEffectiveStats(character: Character, instanceOverride?: 'fogo' | 'gelo' | 'raio', hasManaForBonus?: boolean): EffectiveStats {
  const weapon1 = character.equipment?.weapon1;
  const weapon2 = character.equipment?.weapon2;
  const isTrueDualWielding = weapon1 && weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

  // Use helpers para breakdown
  const weapon1LocalStats = getWeaponLocalStats(weapon1, ALL_ITEM_BASES);
  const weapon2LocalStats = isTrueDualWielding ? getWeaponLocalStats(weapon2, ALL_ITEM_BASES) : null;
  const allMods = getGlobalModifiers(character);
  const globalStats = getGlobalStatsFromModifiers(allMods);
  const defensiveStats = getDefensiveStats(character);
  const regenStats = getRegenStats(character);
  const thornsStats = getThornsStats(character);
  const { estimatedPhysReductionPercent } = getEstimatedPhysReductionPercent(defensiveStats.totalArmor);
  const physTakenStats = getPhysTakenAsElementStats(character);
  const attributeBonuses = getAttributeBonuses(character);

  let minDamage = 0, maxDamage = 0, minPhysDamage = 0, maxPhysDamage = 0, minEleDamage = 0, maxEleDamage = 0, attackSpeed = 0, critChance = 0;
  let dps = 0, physDps = 0, eleDps = 0;

  // Recuperar instância ativa (global)
  let instance: 'fogo' | 'gelo' | 'raio' = 'gelo';
  if (instanceOverride) {
    instance = instanceOverride;
  } else {
    try {
      instance = getInitialElementalInstance();
    } catch {
      instance = 'gelo';
    }
  }

  // --- Cálculo para mago (arma arcana/spell) e guerreiro (melee) ---
  if (weapon1LocalStats?.isSpellWeapon && character.class === 'Mago') {
    // --- Dual wield spell weapons: soma o dano base das duas varinhas ---
    let minBase = weapon1LocalStats.spellMin ?? 0;
    let maxBase = weapon1LocalStats.spellMax ?? 0;
    if (weapon2LocalStats?.isSpellWeapon) {
      minBase += weapon2LocalStats.spellMin ?? 0;
      maxBase += weapon2LocalStats.spellMax ?? 0;
    }
    const breakdown1 = getWeaponElementalBreakdown(weapon1);
    const breakdown2 = weapon2LocalStats?.isSpellWeapon ? getWeaponElementalBreakdown(weapon2) : { minFire: 0, maxFire: 0, minCold: 0, maxCold: 0, minLightning: 0, maxLightning: 0, minVoid: 0, maxVoid: 0 };
    let minFire = breakdown1.minFire + breakdown2.minFire;
    let maxFire = breakdown1.maxFire + breakdown2.maxFire;
    let minCold = breakdown1.minCold + breakdown2.minCold;
    let maxCold = breakdown1.maxCold + breakdown2.maxCold;
    let minLightning = breakdown1.minLightning + breakdown2.minLightning;
    let maxLightning = breakdown1.maxLightning + breakdown2.maxLightning;
    const minVoid = breakdown1.minVoid + breakdown2.minVoid;
    const maxVoid = breakdown1.maxVoid + breakdown2.maxVoid;
    if (instance === 'fogo') {
      minFire = minBase + minFire;
      maxFire = maxBase + maxFire;
    }
    if (instance === 'gelo') {
      minCold = minBase + minCold;
      maxCold = maxBase + maxCold;
    }
    if (instance === 'raio') {
      minLightning = minBase + minLightning;
      maxLightning = maxBase + maxLightning;
    }
    // Aplicar bônus de instância e multiplicadores globais
    const stats = applyElementalInstanceBonusesToStats({
      stats: {
        minPhys: 0,
        maxPhys: 0,
        minFire,
        maxFire,
        minCold,
        maxCold,
        minLightning,
        maxLightning,
        minVoid: minVoid ?? 0,
        maxVoid: maxVoid ?? 0,
        castSpeed: weapon1LocalStats.speed ?? 1,
        attackSpeed: 0,
        critChance: weapon1LocalStats.crit ?? 0,
        isSpell: true,
      },
      instance,
      hasManaForBonus: hasManaForBonus !== false,
    });
    // Multiplicadores globais
    stats.minFire *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseFireDamagePercent ?? 0) / 100);
    stats.maxFire *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseFireDamagePercent ?? 0) / 100);
    stats.minCold *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseColdDamagePercent ?? 0) / 100);
    stats.maxCold *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseColdDamagePercent ?? 0) / 100);
    stats.minLightning *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseLightningDamagePercent ?? 0) / 100);
    stats.maxLightning *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseLightningDamagePercent ?? 0) / 100);
    // DPS e total
    const minTotal = stats.minFire + stats.minCold + stats.minLightning + (stats.minVoid ?? 0);
    const maxTotal = stats.maxFire + stats.maxCold + stats.maxLightning + (stats.maxVoid ?? 0);
    const avg = (minTotal + maxTotal) / 2;
    dps = avg * stats.castSpeed * (1 + (stats.critChance / 100) * ((globalStats.critMultiplier ?? 150) / 100 - 1));
    minDamage = minTotal;
    maxDamage = maxTotal;
    minPhysDamage = 0;
    maxPhysDamage = 0;
    minEleDamage = minTotal;
    maxEleDamage = maxTotal;
    attackSpeed = stats.castSpeed;
    critChance = stats.critChance;
    physDps = 0;
    eleDps = dps;
  } else {
    const breakdown = getWeaponElementalBreakdown(weapon1);
    let minFire = breakdown.minFire;
    let maxFire = breakdown.maxFire;
    let minCold = breakdown.minCold;
    let maxCold = breakdown.maxCold;
    let minLightning = breakdown.minLightning;
    let maxLightning = breakdown.maxLightning;
    let minVoid = breakdown.minVoid;
    let maxVoid = breakdown.maxVoid;
    let minPhys = weapon1LocalStats ? weapon1LocalStats.minPhys : 0;
    let maxPhys = weapon1LocalStats ? weapon1LocalStats.maxPhys : 0;
    minPhys += globalStats.globalFlatMinPhys ?? 0;
    maxPhys += globalStats.globalFlatMaxPhys ?? 0;
    minFire += globalStats.globalFlatMinFire ?? 0;
    maxFire += globalStats.globalFlatMaxFire ?? 0;
    minCold += globalStats.globalFlatMinCold ?? 0;
    maxCold += globalStats.globalFlatMaxCold ?? 0;
    minLightning += globalStats.globalFlatMinLightning ?? 0;
    maxLightning += globalStats.globalFlatMaxLightning ?? 0;
    minVoid += globalStats.globalFlatMinVoid ?? 0;
    maxVoid += globalStats.globalFlatMaxVoid ?? 0;
    const stats = applyElementalInstanceBonusesToStats({
      stats: {
        minPhys,
        maxPhys,
        minFire,
        maxFire,
        minCold,
        maxCold,
        minLightning,
        maxLightning,
        minVoid: minVoid ?? 0,
        maxVoid: maxVoid ?? 0,
        castSpeed: 0,
        attackSpeed: weapon1LocalStats ? weapon1LocalStats.speed : 1,
        critChance: weapon1LocalStats ? weapon1LocalStats.crit : 0,
        isSpell: false,
      },
      instance,
      hasManaForBonus: hasManaForBonus !== false,
    });
    stats.minPhys *= (1 + (globalStats.increasePhysDamagePercent ?? 0) / 100) * (1 + (attributeBonuses.physDamageBonus ?? 0) / 100);
    stats.maxPhys *= (1 + (globalStats.increasePhysDamagePercent ?? 0) / 100) * (1 + (attributeBonuses.physDamageBonus ?? 0) / 100);
    stats.minFire *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseFireDamagePercent ?? 0) / 100);
    stats.maxFire *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseFireDamagePercent ?? 0) / 100);
    stats.minCold *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseColdDamagePercent ?? 0) / 100);
    stats.maxCold *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseColdDamagePercent ?? 0) / 100);
    stats.minLightning *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseLightningDamagePercent ?? 0) / 100);
    stats.maxLightning *= (1 + (globalStats.increaseEleDamagePercent ?? 0) / 100) * (1 + (globalStats.increaseLightningDamagePercent ?? 0) / 100);
    const minTotal = stats.minPhys + stats.minFire + stats.minCold + stats.minLightning + (stats.minVoid ?? 0);
    const maxTotal = stats.maxPhys + stats.maxFire + stats.maxCold + stats.maxLightning + (stats.maxVoid ?? 0);
    const avg = (minTotal + maxTotal) / 2;
    dps = avg * stats.attackSpeed * (1 + (stats.critChance / 100) * ((globalStats.critMultiplier ?? 150) / 100 - 1));
    minDamage = minTotal;
    maxDamage = maxTotal;
    minPhysDamage = stats.minPhys;
    maxPhysDamage = stats.maxPhys;
    minEleDamage = stats.minFire + stats.minCold + stats.minLightning + (stats.minVoid ?? 0);
    maxEleDamage = stats.maxFire + stats.maxCold + stats.maxLightning + (stats.maxVoid ?? 0);
    attackSpeed = stats.attackSpeed;
    critChance = stats.critChance;
    physDps = ((stats.minPhys + stats.maxPhys) / 2) * stats.attackSpeed * (1 + (stats.critChance / 100) * ((globalStats.critMultiplier ?? 150) / 100 - 1));
    eleDps = ((minEleDamage + maxEleDamage) / 2) * stats.attackSpeed * (1 + (stats.critChance / 100) * ((globalStats.critMultiplier ?? 150) / 100 - 1));
  }

  // --- Final Effective Stats Object ---
  const finalStats: EffectiveStats = {
    minDamage,
    maxDamage,
    minPhysDamage,
    maxPhysDamage,
    minEleDamage,
    maxEleDamage,
    attackSpeed,
    critChance,
    critMultiplier: globalStats.critMultiplier ?? 150,
    dps,
    physDps,
    eleDps,
    lifeLeechPercent: globalStats.lifeLeech,
    maxHealth: character.baseMaxHealth ?? 0, // Ajuste: maxHealth real deve ser calculado em outro helper
    totalArmor: defensiveStats.totalArmor,
    totalEvasion: defensiveStats.totalEvasion,
    totalBarrier: defensiveStats.totalBarrier,
    totalBlockChance: defensiveStats.totalBlockChance,
    finalFireResistance: defensiveStats.fireResist,
    finalColdResistance: defensiveStats.coldResist,
    finalLightningResistance: defensiveStats.lightningResist,
    finalVoidResistance: defensiveStats.voidResist,
    finalLifeRegenPerSecond: regenStats.finalLifeRegenPerSecond,
    finalManaRegenPerSecond: regenStats.finalManaRegenPerSecond,
    flatManaRegen: regenStats.flatManaRegen,
    percentManaRegen: regenStats.percentManaRegen,
    thornsDamage: thornsStats.thornsDamage,
    estimatedPhysReductionPercent,
    totalPhysTakenAsElementPercent: physTakenStats.totalPhysTakenAsElementPercent,
    totalReducedPhysDamageTakenPercent: physTakenStats.totalReducedPhysDamageTakenPercent,
    weaponBaseMinPhys: weapon1LocalStats ? weapon1LocalStats.minPhys : 0,
    weaponBaseMaxPhys: weapon1LocalStats ? weapon1LocalStats.maxPhys : 0,
    weaponBaseMinEle: weapon1LocalStats ? weapon1LocalStats.minEle : 0,
    weaponBaseMaxEle: weapon1LocalStats ? weapon1LocalStats.maxEle : 0,
    weaponBaseAttackSpeed: weapon1LocalStats ? weapon1LocalStats.speed : 0,
    weaponBaseCritChance: weapon1LocalStats ? weapon1LocalStats.crit : 0,
    globalFlatMinPhys: globalStats.globalFlatMinPhys,
    globalFlatMaxPhys: globalStats.globalFlatMaxPhys,
    globalFlatMinFire: globalStats.globalFlatMinFire,
    globalFlatMaxFire: globalStats.globalFlatMaxFire,
    globalFlatMinCold: globalStats.globalFlatMinCold,
    globalFlatMaxCold: globalStats.globalFlatMaxCold,
    globalFlatMinLightning: globalStats.globalFlatMinLightning,
    globalFlatMaxLightning: globalStats.globalFlatMaxLightning,
    globalFlatMinVoid: globalStats.globalFlatMinVoid,
    globalFlatMaxVoid: globalStats.globalFlatMaxVoid,
    increasePhysDamagePercent: globalStats.increasePhysDamagePercent,
    increaseAttackSpeedPercent: globalStats.increaseAttackSpeedPercent,
    increaseEleDamagePercent: globalStats.increaseEleDamagePercent,
    increaseFireDamagePercent: globalStats.increaseFireDamagePercent,
    increaseColdDamagePercent: globalStats.increaseColdDamagePercent,
    increaseLightningDamagePercent: globalStats.increaseLightningDamagePercent,
    increaseVoidDamagePercent: globalStats.increaseVoidDamagePercent,
    increaseGlobalCritChancePercent: globalStats.increaseGlobalCritChancePercent,
    totalMovementSpeed: globalStats.totalMovementSpeed,
    weapon2CalcMinPhys: weapon2LocalStats ? weapon2LocalStats.minPhys : 0,
    weapon2CalcMaxPhys: weapon2LocalStats ? weapon2LocalStats.maxPhys : 0,
    weapon2CalcMinEle: weapon2LocalStats ? weapon2LocalStats.minEle : 0,
    weapon2CalcMaxEle: weapon2LocalStats ? weapon2LocalStats.maxEle : 0,
    weapon2CalcAttackSpeed: weapon2LocalStats ? weapon2LocalStats.speed : 0,
    weapon2CalcCritChance: weapon2LocalStats ? weapon2LocalStats.crit : 0,
  };
  return finalStats;
}
  // --- END REVISED calculateEffectiveStats Function ---
  