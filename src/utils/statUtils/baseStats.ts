import { Character } from "../../types/gameData";

// Calcula força total (base + mods)
export function calculateTotalStrength(character: Character): number {
  let totalBonusStrength = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    for (const mod of item.modifiers) {
      if (mod.type === 'Strength') {
        totalBonusStrength += mod.value ?? 0;
      }
    }
    if (item.implicitModifier && item.implicitModifier.type === 'Strength') {
      totalBonusStrength += item.implicitModifier.value ?? 0;
    }
  }
  return character.strength + totalBonusStrength;
}

// Calcula destreza total (base + mods)
export function calculateTotalDexterity(character: Character): number {
  let totalBonusDexterity = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    for (const mod of item.modifiers) {
      if (mod.type === 'Dexterity') {
        totalBonusDexterity += mod.value ?? 0;
      }
    }
    if (item.implicitModifier && item.implicitModifier.type === 'Dexterity') {
      totalBonusDexterity += item.implicitModifier.value ?? 0;
    }
  }
  return character.dexterity + totalBonusDexterity;
}

// Calcula inteligência total (base + mods)
export function calculateTotalIntelligence(character: Character): number {
  let totalBonusIntelligence = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    for (const mod of item.modifiers) {
      if (mod.type === 'Intelligence') {
        totalBonusIntelligence += mod.value ?? 0;
      }
    }
    if (item.implicitModifier && item.implicitModifier.type === 'Intelligence') {
      totalBonusIntelligence += item.implicitModifier.value ?? 0;
    }
  }
  return character.intelligence + totalBonusIntelligence;
}

// Calcula vida máxima final (base + mods)
export function calculateFinalMaxHealth(
    baseMaxHealth: number,
    flatHealthFromMods: number
): number {
    const finalHealth = baseMaxHealth + flatHealthFromMods;
    return Math.max(1, finalHealth);
} 