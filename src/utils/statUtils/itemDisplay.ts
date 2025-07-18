import { EquippableItem } from '../../types/gameData';
import { ALL_ITEM_BASES } from '../../data/items';
import { EffectiveStats } from './weapon';
import { BaseItemTemplate } from '../../types/gameData';

export function calculateItemDisplayStats(item: EquippableItem): {
  finalMinDamage: number;
  finalMaxDamage: number;
  finalAttackSpeed: number;
  finalFireMin: number;
  finalFireMax: number;
  finalColdMin: number;
  finalColdMax: number;
  finalLightningMin: number;
  finalLightningMax: number;
  finalVoidMin: number;
  finalVoidMax: number;
  finalCritChance: number;
  isSpellWeapon?: boolean;
  finalMinPhys: number;
  finalMaxPhys: number;
} {
  const template = ALL_ITEM_BASES.find(t => t.baseId === item.baseId);
  const isSpellWeapon = item.classification === 'Spell';
  let minDamage = 0;
  let maxDamage = 0;
  if (isSpellWeapon) {
    minDamage = template?.baseSpellMinDamage ?? 0;
    maxDamage = template?.baseSpellMaxDamage ?? 0;
  } else {
    minDamage = template?.baseMinDamage ?? 0;
    maxDamage = template?.baseMaxDamage ?? 0;
  }
  let attackSpeed = template?.baseAttackSpeed ?? 1;
  const baseCritChance = template?.baseCriticalStrikeChance ?? 5;
  let addedMinDamage = 0;
  let addedMaxDamage = 0;
  let addedFireMin = 0;
  let addedFireMax = 0;
  let addedColdMin = 0;
  let addedColdMax = 0;
  let addedLightningMin = 0;
  let addedLightningMax = 0;
  let addedVoidMin = 0;
  let addedVoidMax = 0;
  let totalIncreasedAttackSpeed = 0;
  let totalIncreasedCritChance = 0;
  let localIncreasePhysPercent = 0;
  const baseMinPhys = template?.baseMinDamage ?? 0;
  const baseMaxPhys = template?.baseMaxDamage ?? 0;
  let flatPhysMin = 0;
  let flatPhysMax = 0;
  item.modifiers.forEach((mod) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage":
        addedMinDamage += mod.valueMin ?? 0;
        addedMaxDamage += mod.valueMax ?? 0;
        flatPhysMin += mod.valueMin ?? 0;
        flatPhysMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatFireDamage":
        addedFireMin += mod.valueMin ?? 0;
        addedFireMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatColdDamage":
        addedColdMin += mod.valueMin ?? 0;
        addedColdMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatLightningDamage":
        addedLightningMin += mod.valueMin ?? 0;
        addedLightningMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatVoidDamage":
        addedVoidMin += mod.valueMin ?? 0;
        addedVoidMax += mod.valueMax ?? 0;
        break;
      // --- Adicionar casos para modificadores de spell ---
      case "AddsFlatSpellFireDamage":
        addedFireMin += mod.valueMin ?? 0;
        addedFireMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatSpellColdDamage":
        addedColdMin += mod.valueMin ?? 0;
        addedColdMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatSpellLightningDamage":
        addedLightningMin += mod.valueMin ?? 0;
        addedLightningMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatSpellVoidDamage":
        addedVoidMin += mod.valueMin ?? 0;
        addedVoidMax += mod.valueMax ?? 0;
        break;
      // --- Fim dos casos de spell ---
      case "IncreasedLocalAttackSpeed":
        totalIncreasedAttackSpeed += mod.value ?? 0;
        break;
      case "IncreasedLocalCriticalStrikeChance":
        totalIncreasedCritChance += mod.value ?? 0;
        break;
      case "IncreasedLocalPhysicalDamage":
        localIncreasePhysPercent += mod.value ?? 0;
        break;
    }
  });
  minDamage += addedMinDamage;
  maxDamage += addedMaxDamage;
  minDamage *= (1 + localIncreasePhysPercent / 100);
  maxDamage *= (1 + localIncreasePhysPercent / 100);
  minDamage = Math.round(minDamage);
  maxDamage = Math.round(maxDamage);
  if (minDamage > maxDamage) {
    minDamage = maxDamage;
  }
  let finalMinPhys = Math.round((baseMinPhys + flatPhysMin) * (1 + localIncreasePhysPercent / 100));
  const finalMaxPhys = Math.round((baseMaxPhys + flatPhysMax) * (1 + localIncreasePhysPercent / 100));
  if (finalMinPhys > finalMaxPhys) finalMinPhys = finalMaxPhys;
  const localAttackSpeedMultiplier = 1 + totalIncreasedAttackSpeed / 100;
  attackSpeed = attackSpeed * localAttackSpeedMultiplier;
  let critChance = baseCritChance;
  const critChanceMultiplier = 1 + totalIncreasedCritChance / 100;
  critChance = critChance * critChanceMultiplier;
  return {
    finalMinDamage: minDamage,
    finalMaxDamage: maxDamage,
    finalAttackSpeed: attackSpeed,
    finalCritChance: critChance,
    finalFireMin: addedFireMin,
    finalFireMax: addedFireMax,
    finalColdMin: addedColdMin,
    finalColdMax: addedColdMax,
    finalLightningMin: addedLightningMin,
    finalLightningMax: addedLightningMax,
    finalVoidMin: addedVoidMin,
    finalVoidMax: addedVoidMax,
    isSpellWeapon,
    finalMinPhys,
    finalMaxPhys,
  };
}

export function calculateSingleWeaponSwingDamage(
    weapon: EquippableItem, 
    weaponTemplate: BaseItemTemplate,
    globalStats: EffectiveStats
): {
  minPhys: number;
  maxPhys: number;
  minEle: number;
  maxEle: number;
  totalMin: number;
  totalMax: number;
} {
    let localMinPhys = weaponTemplate.baseMinDamage ?? 0;
    let localMaxPhys = weaponTemplate.baseMaxDamage ?? 0;
    let localMinEle = 0; 
    let localMaxEle = 0;
    let localPhysIncreasePercent = 0;
    weapon.modifiers.forEach(mod => {
        switch (mod.type) {
            case "AddsFlatPhysicalDamage": localMinPhys += mod.valueMin ?? 0; localMaxPhys += mod.valueMax ?? 0; break;
            case "AddsFlatFireDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatColdDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatLightningDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatVoidDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            // --- Adicionar casos para modificadores de spell ---
            case "AddsFlatSpellFireDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatSpellColdDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatSpellLightningDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatSpellVoidDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            // --- Fim dos casos de spell ---
            case "IncreasedLocalPhysicalDamage": localPhysIncreasePercent += mod.value ?? 0; break;
        }
    });
    localMinPhys *= (1 + localPhysIncreasePercent / 100);
    localMaxPhys *= (1 + localPhysIncreasePercent / 100);
    let finalMinPhys = localMinPhys * (1 + globalStats.increasePhysDamagePercent / 100);
    let finalMaxPhys = localMaxPhys * (1 + globalStats.increasePhysDamagePercent / 100);
    const globalFlatMinEle = globalStats.globalFlatMinFire + globalStats.globalFlatMinCold + globalStats.globalFlatMinLightning + globalStats.globalFlatMinVoid;
    const globalFlatMaxEle = globalStats.globalFlatMaxFire + globalStats.globalFlatMaxCold + globalStats.globalFlatMaxLightning + globalStats.globalFlatMaxVoid;
    const combinedMinEle = localMinEle + globalFlatMinEle;
    const combinedMaxEle = localMaxEle + globalFlatMaxEle;
    let finalMinEle = combinedMinEle * (1 + globalStats.increaseEleDamagePercent / 100);
    let finalMaxEle = combinedMaxEle * (1 + globalStats.increaseEleDamagePercent / 100);
    finalMinPhys = Math.max(0, Math.round(finalMinPhys));
    finalMaxPhys = Math.max(finalMinPhys, Math.round(finalMaxPhys));
    finalMinEle = Math.max(0, Math.round(finalMinEle));
    finalMaxEle = Math.max(finalMinEle, Math.round(finalMaxEle));
    const totalMin = finalMinPhys + finalMinEle;
    const totalMax = finalMaxPhys + finalMaxEle;
    return {
        minPhys: finalMinPhys,
        maxPhys: finalMaxPhys,
        minEle: finalMinEle,
        maxEle: finalMaxEle,
        totalMin: totalMin,
        totalMax: totalMax,
    };
} 