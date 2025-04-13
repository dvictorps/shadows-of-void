import { v4 as uuidv4 } from 'uuid';
import { EquippableItem, Modifier, ModifierType, ItemRarity } from '../types/gameData';
import { itemBases, getEligibleItemBases, BaseItemTemplate } from '../data/items';

// --- Helpers ---
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Modifier Tiers ---
interface ModifierTier {
  tier: number;
  minItemLevel: number;
  multiplier: number;
}
const modifierTiers: ModifierTier[] = [
  { tier: 1, minItemLevel: 1, multiplier: 1.0 },
  { tier: 2, minItemLevel: 15, multiplier: 1.5 },
  { tier: 3, minItemLevel: 30, multiplier: 2.0 },
  { tier: 4, minItemLevel: 50, multiplier: 2.5 },
];

function getTierMultiplier(itemLevel: number): number {
  let applicableMultiplier = 1.0;
  for (let i = modifierTiers.length - 1; i >= 0; i--) {
    if (itemLevel >= modifierTiers[i].minItemLevel) {
      applicableMultiplier = modifierTiers[i].multiplier;
      break;
    }
  }
  return applicableMultiplier;
}

// --- Base Modifier Definitions (Value Ranges are for Tier 1) ---
const possibleModifiers: { type: ModifierType; min: number; max: number; minRangeMax?: number; maxRangeMin?: number; local?: boolean }[] = [
    { type: 'IncreasedPhysicalDamage', min: 5, max: 15, local: true },
    { type: 'AddsFlatPhysicalDamage', min: 1, max: 6, minRangeMax: 2, maxRangeMin: 4, local: true },
    { type: 'AttackSpeed', min: 3, max: 7, local: true },
    { type: 'LifeLeech', min: 1, max: 2 },
    { type: 'Strength', min: 3, max: 8 },
    { type: 'Dexterity', min: 3, max: 8 },
    { type: 'Intelligence', min: 3, max: 8 },
];
const weaponModifiers = possibleModifiers.filter(mod => mod.local);

// --- Rarity Determination ---
function determineRarity(itemLevel: number): ItemRarity {
    const roll = Math.random();
    if (itemLevel >= 30) return 'Raro';
    if (itemLevel >= 12) {
        if (roll < 0.6) return 'Azul';
        return 'Raro';
    }
    if (roll < 0.5) return 'Branco';
    if (roll < 0.85) return 'Azul';
    return 'Raro';
}

// --- Modifier Generation (Updated) ---
function generateModifiers(rarity: ItemRarity, itemLevel: number): Modifier[] {
  let numModifiers = 0;
  if (rarity === 'Azul') numModifiers = getRandomInt(1, 2);
  else if (rarity === 'Raro') numModifiers = getRandomInt(3, 5);
  if (numModifiers === 0) return [];

  const selectedModifiers: Modifier[] = [];
  const availableModifiers = [...weaponModifiers];
  const tierMultiplier = getTierMultiplier(itemLevel);

  for (let i = 0; i < numModifiers; i++) {
    if (availableModifiers.length === 0) break;
    const randomIndex = getRandomInt(0, availableModifiers.length - 1);
    const modTemplate = availableModifiers[randomIndex];
    let modifierToAdd: Modifier;

    const tMin = Math.round(modTemplate.min * tierMultiplier);
    const tMax = Math.round(modTemplate.max * tierMultiplier);

    if (modTemplate.type === 'AddsFlatPhysicalDamage') {
        const tMinRangeMax = Math.round(modTemplate.minRangeMax! * tierMultiplier);
        const tMaxRangeMin = Math.round(modTemplate.maxRangeMin! * tierMultiplier);
        const finalMinRangeMax = Math.max(tMin, tMinRangeMax);
        const finalMaxRangeMin = Math.max(finalMinRangeMax, tMaxRangeMin);
        const finalMax = Math.max(finalMaxRangeMin, tMax);

        const valMin = getRandomInt(tMin, finalMinRangeMax);
        const valMax = getRandomInt(finalMaxRangeMin, finalMax);
        modifierToAdd = { type: modTemplate.type, value: 0, valueMin: valMin, valueMax: Math.max(valMin, valMax) };
    } else {
        const value = getRandomInt(tMin, tMax);
        modifierToAdd = { type: modTemplate.type, value };
    }
    selectedModifiers.push(modifierToAdd);
    availableModifiers.splice(randomIndex, 1);
  }
  return selectedModifiers;
}

// --- Main Drop Generation Function ---
export function generateDrop(monsterLevel: number): EquippableItem | null {
    const levelVariance = getRandomInt(-1, 1);
    const itemLevel = Math.max(1, monsterLevel + levelVariance);

    const eligibleBases = getEligibleItemBases(itemLevel, 'TwoHandedSword');
    if (eligibleBases.length === 0) {
        console.log(`[GenerateDrop] No eligible bases found for itemLevel ${itemLevel}`);
        return null;
    }

    const baseTemplate = eligibleBases[getRandomInt(0, eligibleBases.length - 1)];
    const rarity = determineRarity(itemLevel);
    const modifiers = generateModifiers(rarity, itemLevel);

    const newItem: EquippableItem = {
        id: uuidv4(),
        baseId: baseTemplate.baseId,
        name: `${rarity !== 'Branco' ? `${rarity} ` : ''}${baseTemplate.name}`,
        rarity: rarity,
        itemType: baseTemplate.itemType,
        icon: baseTemplate.icon,
        itemLevel: itemLevel, // Added itemLevel here
        modifiers: modifiers,
        baseMinDamage: baseTemplate.baseMinDamage,
        baseMaxDamage: baseTemplate.baseMaxDamage,
        baseAttackSpeed: baseTemplate.baseAttackSpeed,
    };

    console.log(`[GenerateDrop] Generated Item: ${newItem.name} (iLvl: ${itemLevel}, Rarity: ${rarity}, Mods: ${modifiers.length})`);
    return newItem;
} 