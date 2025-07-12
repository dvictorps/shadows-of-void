import { Character } from "../../types/gameData";
import { ONE_HANDED_WEAPON_TYPES } from '../itemUtils';
import { ALL_ITEM_BASES } from '../../data/items';
import { getWeaponLocalStats } from './weaponHelpers';
import { getGlobalModifiers, getGlobalStatsFromModifiers } from './globalModifiers';
import { getDefensiveStats, getRegenStats, getThornsStats, getEstimatedPhysReductionPercent, getPhysTakenAsElementStats } from './defensiveStats';
import { getWeaponDps } from './weaponDps';

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

export function calculateEffectiveStats(character: Character): EffectiveStats {
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

  // Dentro de calculateEffectiveStats, use getWeaponDps para calcular dps, physDps, eleDps e preencha no objeto finalStats.
  // Exemplo de uso do helper para DPS:
  const dpsParams = weapon1LocalStats
    ? {
        minPhys: weapon1LocalStats.minPhys,
        maxPhys: weapon1LocalStats.maxPhys,
        minEle: weapon1LocalStats.minEle,
        maxEle: weapon1LocalStats.maxEle,
        attackSpeed: weapon1LocalStats.speed,
        critChance: weapon1LocalStats.crit,
        critMultiplier: globalStats.critMultiplier,
      }
    : { minPhys: 0, maxPhys: 0, minEle: 0, maxEle: 0, attackSpeed: 1, critChance: 5, critMultiplier: 150 };
  const { dps, physDps, eleDps } = getWeaponDps(dpsParams);

  // --- Final Effective Stats Object ---
  const finalStats: EffectiveStats = {
    minDamage: weapon1LocalStats ? weapon1LocalStats.minPhys + weapon1LocalStats.minEle : 0,
    maxDamage: weapon1LocalStats ? weapon1LocalStats.maxPhys + weapon1LocalStats.maxEle : 0,
    minPhysDamage: weapon1LocalStats ? weapon1LocalStats.minPhys : 0,
    maxPhysDamage: weapon1LocalStats ? weapon1LocalStats.maxPhys : 0,
    minEleDamage: weapon1LocalStats ? weapon1LocalStats.minEle : 0,
    maxEleDamage: weapon1LocalStats ? weapon1LocalStats.maxEle : 0,
    attackSpeed: weapon1LocalStats ? weapon1LocalStats.speed : 0,
    critChance: weapon1LocalStats ? weapon1LocalStats.crit : 0,
    critMultiplier: globalStats.critMultiplier,
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

  // --- SPELL WEAPON LOGIC: Só aplica bônus de instância para mago ---
  // if ((weapon1LocalStats?.isSpellWeapon || weapon1LocalStats?.isMeleeWeapon) && character.class === 'Mago') {
  //   const isSpell = weapon1LocalStats?.isSpellWeapon;
  //   const isMelee = weapon1LocalStats?.isMeleeWeapon;
  //   let min = 0, max = 0;
  //   let minFire = weapon1LocalStats.spellMinFire ?? 0;
  //   let maxFire = weapon1LocalStats.spellMaxFire ?? 0;
  //   let minCold = weapon1LocalStats.spellMinCold ?? 0;
  //   let maxCold = weapon1LocalStats.spellMaxCold ?? 0;
  //   let minLightning = weapon1LocalStats.spellMinLightning ?? 0;
  //   let maxLightning = weapon1LocalStats.spellMaxLightning ?? 0;

  //   minFire += totalFlatSpellFire;
  //   maxFire += totalFlatSpellFire;
  //   minCold += totalFlatSpellCold;
  //   maxCold += totalFlatSpellCold;
  //   minLightning += totalFlatSpellLightning;
  //   maxLightning += totalFlatSpellLightning;

  //   minFire *= 1 + (totalIncreasedSpellDamage / 100);
  //   maxFire *= 1 + (totalIncreasedSpellDamage / 100);
  //   minCold *= 1 + (totalIncreasedSpellDamage / 100);
  //   maxCold *= 1 + (totalIncreasedSpellDamage / 100);
  //   minLightning *= 1 + (totalIncreasedSpellDamage / 100);
  //   maxLightning *= 1 + (totalIncreasedSpellDamage / 100);

  //   const instance = getCurrentElementalInstance();
  //   let castSpeed = 1 * (1 + totalIncreasedCastSpeed / 100);
  //   let attackSpeed = weapon1LocalStats?.speed ?? 1;
  //   let spellCrit = 6 * (1 + totalIncreasedSpellCritChance / 100);
  //   let baseCrit = weapon1LocalStats?.crit ?? 5;

  //   if (instanceBonusActive) {
  //     if (instance === 'gelo') {
  //       if (isSpell) {
  //         minCold *= 1.3;
  //         maxCold *= 1.3;
  //       }
  //       if (isMelee) {
  //         // Para melee, aumenta o dano final em 30% (aplicado depois)
  //         // O cálculo será ajustado abaixo
  //       }
  //     } else if (instance === 'fogo') {
  //       if (isSpell) {
  //         castSpeed *= 1.25;
  //       }
  //       if (isMelee) {
  //         attackSpeed *= 1.25;
  //       }
  //     } else if (instance === 'raio') {
  //       if (isSpell) {
  //         spellCrit = 10;
  //       }
  //       if (isMelee) {
  //         baseCrit = 10;
  //       }
  //     }
  //   }

  //   if (isSpell) {
  //     if (instance === 'fogo') {
  //       min = minFire;
  //       max = maxFire;
  //     } else if (instance === 'gelo') {
  //       min = minCold;
  //       max = maxCold;
  //     } else if (instance === 'raio') {
  //       min = minLightning;
  //       max = maxLightning;
  //     }
  //     const dps = ((min + max) / 2) * castSpeed * (1 + (spellCrit / 100) * (effCritMultiplier / 100));
  //     return {
  //       minDamage: min,
  //       maxDamage: max,
  //       minPhysDamage: 0,
  //       maxPhysDamage: 0,
  //       minEleDamage: min,
  //       maxEleDamage: max,
  //       attackSpeed: castSpeed,
  //       critChance: spellCrit,
  //       critMultiplier: effCritMultiplier,
  //       dps,
  //       physDps: 0,
  //       eleDps: dps,
  //       lifeLeechPercent: totalLifeLeech,
  //       maxHealth: finalMaxHealth,
  //       totalArmor: finalTotalArmor,
  //       totalEvasion: effEvasion,
  //       totalBarrier: finalTotalBarrier,
  //       totalBlockChance: finalTotalBlockChance,
  //       finalFireResistance: finalFireRes,
  //       finalColdResistance: finalColdRes,
  //       finalLightningResistance: finalLightningRes,
  //       finalVoidResistance: finalVoidRes,
  //       finalLifeRegenPerSecond: finalLifeRegenPerSecond,
  //       finalManaRegenPerSecond: finalManaRegenPerSecond,
  //       flatManaRegen: accumulatedFlatManaRegen,
  //       percentManaRegen: percentManaRegen,
  //       thornsDamage: totalThorns,
  //       estimatedPhysReductionPercent: estimatedPhysReductionPercent,
  //       totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
  //       totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
  //       weaponBaseMinPhys: 0,
  //       weaponBaseMaxPhys: 0,
  //       weaponBaseMinEle: min,
  //       weaponBaseMaxEle: max,
  //       weaponBaseAttackSpeed: castSpeed,
  //       weaponBaseCritChance: spellCrit,
  //       globalFlatMinPhys: 0,
  //       globalFlatMaxPhys: 0,
  //       globalFlatMinFire: minFire,
  //       globalFlatMaxFire: maxFire,
  //       globalFlatMinCold: minCold,
  //       globalFlatMaxCold: maxCold,
  //       globalFlatMinLightning: minLightning,
  //       globalFlatMaxLightning: maxLightning,
  //       globalFlatMinVoid: 0,
  //       globalFlatMaxVoid: 0,
  //       increasePhysDamagePercent: 0,
  //       increaseAttackSpeedPercent: 0,
  //       increaseEleDamagePercent: 0,
  //       increaseFireDamagePercent: 0,
  //       increaseColdDamagePercent: 0,
  //       increaseLightningDamagePercent: 0,
  //       increaseVoidDamagePercent: 0,
  //       increaseGlobalCritChancePercent: 0,
  //       totalMovementSpeed: finalTotalMovementSpeed,
  //       weapon2CalcMinPhys: 0,
  //       weapon2CalcMaxPhys: 0,
  //       weapon2CalcMinEle: 0,
  //       weapon2CalcMaxEle: 0,
  //       weapon2CalcAttackSpeed: 0,
  //       weapon2CalcCritChance: 0,
  //     };
  //   } else if (isMelee) {
  //     // Para melee, aplica o bônus diretamente no cálculo do dano físico
  //     const minPhys = weapon1LocalStats.minPhys;
  //     const maxPhys = weapon1LocalStats.maxPhys;
  //     const eleMin = weapon1LocalStats.minEle;
  //     const eleMax = weapon1LocalStats.maxEle;
  //     let bonusColdMin = 0;
  //     let bonusColdMax = 0;
  //     if (instanceBonusActive) { // This line was removed
  //       if (instance === 'gelo') {
  //         bonusColdMin = minPhys * 0.3;
  //         bonusColdMax = maxPhys * 0.3;
  //       }
  //     }
  //     let finalAttackSpeed = attackSpeed;
  //     if (instanceBonusActive) { // This line was removed
  //       if (instance === 'fogo') {
  //         finalAttackSpeed = attackSpeed;
  //       }
  //     }
  //     let finalCrit = baseCrit;
  //     if (instanceBonusActive) { // This line was removed
  //       if (instance === 'raio') {
  //         finalCrit = baseCrit;
  //       }
  //     }
  //     const totalMinEle = eleMin + bonusColdMin;
  //     const totalMaxEle = eleMax + bonusColdMax;
  //     const dps = ((minPhys + maxPhys) / 2 + (totalMinEle + totalMaxEle) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100));
  //     return {
  //       minDamage: minPhys + totalMinEle,
  //       maxDamage: maxPhys + totalMaxEle,
  //       minPhysDamage: minPhys,
  //       maxPhysDamage: maxPhys,
  //       minEleDamage: totalMinEle,
  //       maxEleDamage: totalMaxEle,
  //       attackSpeed: finalAttackSpeed,
  //       critChance: finalCrit,
  //       critMultiplier: effCritMultiplier,
  //       dps,
  //       physDps: ((minPhys + maxPhys) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100)),
  //       eleDps: ((totalMinEle + totalMaxEle) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100)),
  //       lifeLeechPercent: totalLifeLeech,
  //       maxHealth: finalMaxHealth,
  //       totalArmor: finalTotalArmor,
  //       totalEvasion: effEvasion,
  //       totalBarrier: finalTotalBarrier,
  //       totalBlockChance: finalTotalBlockChance,
  //       finalFireResistance: finalFireRes,
  //       finalColdResistance: finalColdRes,
  //       finalLightningResistance: finalLightningRes,
  //       finalVoidResistance: finalVoidRes,
  //       finalLifeRegenPerSecond: finalLifeRegenPerSecond,
  //       finalManaRegenPerSecond: finalManaRegenPerSecond,
  //       flatManaRegen: accumulatedFlatManaRegen,
  //       percentManaRegen: percentManaRegen,
  //       thornsDamage: totalThorns,
  //       estimatedPhysReductionPercent: estimatedPhysReductionPercent,
  //       totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
  //       totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
  //       weaponBaseMinPhys: minPhys,
  //       weaponBaseMaxPhys: maxPhys,
  //       weaponBaseMinEle: totalMinEle,
  //       weaponBaseMaxEle: totalMaxEle,
  //       weaponBaseAttackSpeed: finalAttackSpeed,
  //       weaponBaseCritChance: finalCrit,
  //       globalFlatMinPhys: 0,
  //       globalFlatMaxPhys: 0,
  //       globalFlatMinFire: 0,
  //       globalFlatMaxFire: 0,
  //       globalFlatMinCold: 0,
  //       globalFlatMaxCold: 0,
  //       globalFlatMinLightning: 0,
  //       globalFlatMaxLightning: 0,
  //       globalFlatMinVoid: 0,
  //       globalFlatMaxVoid: 0,
  //       increasePhysDamagePercent: 0,
  //       increaseAttackSpeedPercent: 0,
  //       increaseEleDamagePercent: 0,
  //       increaseFireDamagePercent: 0,
  //       increaseColdDamagePercent: 0,
  //       increaseLightningDamagePercent: 0,
  //       increaseVoidDamagePercent: 0,
  //       increaseGlobalCritChancePercent: 0,
  //       totalMovementSpeed: finalTotalMovementSpeed,
  //       weapon2CalcMinPhys: 0,
  //       weapon2CalcMaxPhys: 0,
  //       weapon2CalcMinEle: 0,
  //       weapon2CalcMaxEle: 0,
  //       weapon2CalcAttackSpeed: 0,
  //       weapon2CalcCritChance: 0,
  //     };
  //   }
  // }

  return finalStats;
}
  // --- END REVISED calculateEffectiveStats Function ---
  