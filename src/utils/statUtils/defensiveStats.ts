import { Character, EquippableItem } from "../../types/gameData";
import { calculateItemArmor, calculateItemEvasion, calculateItemBarrier } from './defense';

// Helper: Calcula stats defensivos do personagem
export function getDefensiveStats(character: Character): {
  totalArmor: number;
  totalEvasion: number;
  totalBarrier: number;
  totalBlockChance: number;
  fireResist: number;
  coldResist: number;
  lightningResist: number;
  voidResist: number;
} {
  let totalArmor = character.armor ?? 0;
  let totalEvasion = character.evasion ?? 0;
  let totalBarrier = 0;
  let totalBlockChance = character.blockChance ?? 0;
  let fireResist = character.fireResistance ?? 0;
  let coldResist = character.coldResistance ?? 0;
  let lightningResist = character.lightningResistance ?? 0;
  let voidResist = character.voidResistance ?? 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    if (item.baseArmor !== undefined) totalArmor += calculateItemArmor(item);
    if (item.baseEvasion !== undefined) totalEvasion += calculateItemEvasion(item);
    if (item.baseBarrier !== undefined) totalBarrier += calculateItemBarrier(item);
    if (item.itemType === 'Shield') totalBlockChance += item.baseBlockChance ?? 0;
    // Resistências
    if (item.modifiers) {
      for (const mod of item.modifiers) {
        if (mod.type === 'FireResistance') fireResist += mod.value ?? 0;
        if (mod.type === 'ColdResistance') coldResist += mod.value ?? 0;
        if (mod.type === 'LightningResistance') lightningResist += mod.value ?? 0;
        if (mod.type === 'VoidResistance') voidResist += mod.value ?? 0;
      }
    }
    if (item.implicitModifier) {
      if (item.implicitModifier.type === 'FireResistance') fireResist += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'ColdResistance') coldResist += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'LightningResistance') lightningResist += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'VoidResistance') voidResist += item.implicitModifier.value ?? 0;
    }
  }
  return { totalArmor, totalEvasion, totalBarrier, totalBlockChance, fireResist, coldResist, lightningResist, voidResist };
}

// Helper: Calcula regeneração de vida e mana do personagem
export function getRegenStats(character: Character): {
  finalLifeRegenPerSecond: number;
  finalManaRegenPerSecond: number;
  flatManaRegen: number;
  percentManaRegen: number;
} {
  let flatLifeRegen = 0;
  let percentLifeRegen = 0;
  let flatManaRegen = 0;
  let percentManaRegen = 0;
  let maxHealth = character.baseMaxHealth ?? 0;
  let maxMana = character.maxMana ?? 0;

  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    if (item.modifiers) {
      for (const mod of item.modifiers) {
        if (mod.type === 'FlatLifeRegen') flatLifeRegen += mod.value ?? 0;
        if (mod.type === 'PercentLifeRegen') percentLifeRegen += mod.value ?? 0;
        if (mod.type === 'FlatManaRegen') flatManaRegen += mod.value ?? 0;
        if (mod.type === 'PercentManaRegen') percentManaRegen += mod.value ?? 0;
      }
    }
    if (item.implicitModifier) {
      if (item.implicitModifier.type === 'FlatLifeRegen') flatLifeRegen += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'PercentLifeRegen') percentLifeRegen += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'FlatManaRegen') flatManaRegen += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'PercentManaRegen') percentManaRegen += item.implicitModifier.value ?? 0;
    }
  }

  // Vida
  const regenFromPercent = maxHealth * (percentLifeRegen / 100);
  const finalLifeRegenPerSecond = parseFloat((flatLifeRegen + regenFromPercent).toFixed(1));
  // Mana
  const percentManaRegenCapped = Math.min(percentManaRegen, 10); // Limite de 10%
  const regenFromPercentMana = maxMana * (percentManaRegenCapped / 100);
  const finalManaRegenPerSecond = parseFloat((flatManaRegen + regenFromPercentMana).toFixed(1));

  return {
    finalLifeRegenPerSecond,
    finalManaRegenPerSecond,
    flatManaRegen,
    percentManaRegen: percentManaRegenCapped,
  };
}

// Helper: Calcula o thornsDamage total do personagem
export function getThornsStats(character: Character): { thornsDamage: number } {
  let thornsDamage = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    if (item.modifiers) {
      for (const mod of item.modifiers) {
        if (mod.type === 'ThornsDamage') thornsDamage += mod.value ?? 0;
      }
    }
    if (item.implicitModifier && item.implicitModifier.type === 'ThornsDamage') {
      thornsDamage += item.implicitModifier.value ?? 0;
    }
  }
  return { thornsDamage };
}

// Helper: Calcula a redução estimada de dano físico baseada na armadura
export function getEstimatedPhysReductionPercent(totalArmor: number, referenceDamageHit: number = 100): { estimatedPhysReductionPercent: number } {
  if (totalArmor <= 0) return { estimatedPhysReductionPercent: 0 };
  const percent = (totalArmor / (totalArmor + 10 * referenceDamageHit)) * 100;
  return { estimatedPhysReductionPercent: parseFloat(percent.toFixed(1)) };
}

// Helper: Calcula os percentuais de dano físico convertido e reduzido
export function getPhysTakenAsElementStats(character: Character): {
  totalPhysTakenAsElementPercent: number;
  totalReducedPhysDamageTakenPercent: number;
} {
  let totalPhysTakenAsElementPercent = 0;
  let totalReducedPhysDamageTakenPercent = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    if (item.modifiers) {
      for (const mod of item.modifiers) {
        if (mod.type === 'PhysDamageTakenAsElement') totalPhysTakenAsElementPercent += mod.value ?? 0;
        if (mod.type === 'ReducedPhysDamageTaken') totalReducedPhysDamageTakenPercent += mod.value ?? 0;
      }
    }
    if (item.implicitModifier) {
      if (item.implicitModifier.type === 'PhysDamageTakenAsElement') totalPhysTakenAsElementPercent += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'ReducedPhysDamageTaken') totalReducedPhysDamageTakenPercent += item.implicitModifier.value ?? 0;
    }
  }
  return { totalPhysTakenAsElementPercent, totalReducedPhysDamageTakenPercent };
} 