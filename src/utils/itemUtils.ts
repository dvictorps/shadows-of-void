import { v4 as uuidv4 } from 'uuid';
import {
  EquippableItem,
  Modifier,
  ModifierType,
  ItemRarity,
  PREFIX_MODIFIERS,
  SUFFIX_MODIFIERS,
} from '../types/gameData';
import { getEligibleItemBases } from '../data/items';

// --- Helpers ---
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Base Modifier Definitions (Value Ranges are base - Tier 1 equivalent) ---
interface ModifierDefinition {
    type: ModifierType;
    baseMin?: number; // For flat value rolls or min of range
    baseMax: number;  // For flat value rolls or max of range
    isRange?: boolean; // Indicates if baseMin/baseMax define a range (e.g., AddsFlat...)
}

const ALL_MODIFIER_DEFINITIONS: ModifierDefinition[] = [
    // Prefixes
    { type: 'AddsFlatPhysicalDamage', baseMin: 1, baseMax: 5, isRange: true },
    { type: 'IncreasedPhysicalDamage', baseMin: 5, baseMax: 15 }, // Local %
    { type: 'AddsFlatFireDamage', baseMin: 1, baseMax: 5, isRange: true },
    { type: 'AddsFlatColdDamage', baseMin: 1, baseMax: 5, isRange: true },
    { type: 'AddsFlatLightningDamage', baseMin: 1, baseMax: 5, isRange: true },
    { type: 'AddsFlatVoidDamage', baseMin: 1, baseMax: 5, isRange: true },
    // Suffixes
    { type: 'AttackSpeed', baseMin: 3, baseMax: 7 }, // Local %
    { type: 'IncreasedCriticalStrikeChance', baseMin: 5, baseMax: 10 }, // Local %
    { type: 'IncreasedCriticalStrikeMultiplier', baseMin: 8, baseMax: 15 }, // Global %
    { type: 'IncreasedElementalDamage', baseMin: 10, baseMax: 20 }, // Global %
    { type: 'LifeLeech', baseMin: 1, baseMax: 2 }, // % Phys Dmg
    { type: 'Strength', baseMin: 5, baseMax: 10 },
    { type: 'Dexterity', baseMin: 5, baseMax: 10 },
    { type: 'Intelligence', baseMin: 5, baseMax: 10 },
];

// Create separate pools based on PREFIX/SUFFIX sets
const PREFIX_POOL = ALL_MODIFIER_DEFINITIONS.filter(def => PREFIX_MODIFIERS.has(def.type));
const SUFFIX_POOL = ALL_MODIFIER_DEFINITIONS.filter(def => SUFFIX_MODIFIERS.has(def.type));

// NEW: Define display order for modifiers (moved from components)
export const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  // Prefixes (Lower numbers first)
  IncreasedPhysicalDamage: 10,
  AddsFlatPhysicalDamage: 20,
  AddsFlatFireDamage: 30,
  AddsFlatColdDamage: 40,
  AddsFlatLightningDamage: 50,
  AddsFlatVoidDamage: 60,
  // Suffixes (Higher numbers first, within suffixes)
  AttackSpeed: 100,
  IncreasedCriticalStrikeChance: 110,
  IncreasedCriticalStrikeMultiplier: 120,
  IncreasedElementalDamage: 130,
  LifeLeech: 140,
  Strength: 200, // Attributes last
  Dexterity: 210,
  Intelligence: 220,
};

// --- Rarity Determination (Updated with Tiered Legendary Chance) ---
function determineRarity(itemLevel: number): ItemRarity {
    const roll = Math.random();

    // Tiered Legendary Chance
    let legendaryChance = 0.01; // Default for levels < 50
    if (itemLevel >= 75) {
        legendaryChance = 0.15; // 15% for levels 75+
    } else if (itemLevel >= 50) {
        legendaryChance = 0.05; // 5% for levels 50-74
    }

    if (roll < legendaryChance) return 'Lendário';

    // Adjust Rare/Magic chance based on remaining probability
    const remainingProb = 1.0 - legendaryChance;
    const rareChanceBase = itemLevel >= 25 ? 0.20 : 0.10; // Example: 20% / 10% OF REMAINING
    const magicChanceBase = 0.50;                   // Example: 50% OF REMAINING

    const rareChanceAbsolute = remainingProb * rareChanceBase;
    const magicChanceAbsolute = remainingProb * magicChanceBase;

    if (roll < legendaryChance + rareChanceAbsolute) return 'Raro';
    if (roll < legendaryChance + rareChanceAbsolute + magicChanceAbsolute) return 'Mágico';

    return 'Normal';
}

// --- Tier Calculation Placeholder ---
function calculateTier(itemLevel: number): number {
    return Math.max(1, Math.ceil(itemLevel / 10)); // Example: Tier increases every 10 levels
}

// Function to calculate value based on tier (Placeholder Scaling)
function getTierScaledValue(baseValue: number, tier: number, isPercent: boolean = false): number {
    // Example: +10% value per tier above 1 for percentages, +1 flat per tier for others
    // Simple linear scaling for placeholder
    const scaleFactor = isPercent ? 0.10 : 1 * (tier > 1 ? 0.5 * (tier-1) : 0); // Adjusted flat scaling
    return Math.round(baseValue + (baseValue * scaleFactor));
    // A more complex system would have specific tables per mod type and tier
}

// --- Modifier Generation (Refactored with Tiered Legendary Mod Count) ---
function generateModifiers(rarity: ItemRarity, itemLevel: number): Modifier[] {
  const selectedModifiers: Modifier[] = [];
  const availablePrefixes = [...PREFIX_POOL];
  const availableSuffixes = [...SUFFIX_POOL];
  const tier = calculateTier(itemLevel);
  let targetPrefixes = 0;
  let targetSuffixes = 0;
  let forceBothOnMagicTwo = false;
  let numTotalMods = 0;

  switch (rarity) {
    case 'Mágico':
      const numMagicMods = getRandomInt(1, 2);
      numTotalMods = numMagicMods;
       if (numMagicMods === 1) {
         if (Math.random() < 0.5 && availablePrefixes.length > 0) targetPrefixes = 1;
         else if (availableSuffixes.length > 0) targetSuffixes = 1;
         else if (availablePrefixes.length > 0) targetPrefixes = 1;
       } else {
         targetPrefixes = 1; targetSuffixes = 1; forceBothOnMagicTwo = true;
       }
      break;
    case 'Raro':
      const numRareMods = getRandomInt(4, 6);
      numTotalMods = numRareMods;
      let prefixesAssigned = 0;
      let suffixesAssigned = 0;
      for (let i = 0; i < numRareMods; i++) {
          if ((Math.random() < 0.5 || suffixesAssigned >= 3) && prefixesAssigned < 3) { targetPrefixes++; prefixesAssigned++; }
          else if (suffixesAssigned < 3) { targetSuffixes++; suffixesAssigned++; }
          else if (prefixesAssigned < 3) { targetPrefixes++; prefixesAssigned++; }
      }
      break;
    case 'Lendário':
      // Tiered mod count for Legendary
      if (itemLevel >= 75) {
          numTotalMods = getRandomInt(10, 15);
      } else if (itemLevel >= 50) {
          numTotalMods = getRandomInt(8, 10);
      } else {
          numTotalMods = getRandomInt(7, 8);
      }
      // Distribute randomly
      let prefixesAssignedL = 0;
      let suffixesAssignedL = 0;
      for (let i = 0; i < numTotalMods; i++) {
          const canAddPrefix = availablePrefixes.length > prefixesAssignedL;
          const canAddSuffix = availableSuffixes.length > suffixesAssignedL;
          if (canAddPrefix && (!canAddSuffix || Math.random() < 0.5)) {
              targetPrefixes++; prefixesAssignedL++;
          } else if (canAddSuffix) {
              targetSuffixes++; suffixesAssignedL++;
          } else if (canAddPrefix) {
              targetPrefixes++; prefixesAssignedL++;
          }
      }
      break;
  }

  // --- Add Mods (Helper and Logic) ---
  const addRandomMod = (pool: ModifierDefinition[], targetCount: number, currentCount: number, type: 'prefix' | 'suffix'): number => {
    let added = 0;
    while (currentCount < targetCount && pool.length > 0) {
        const randomIndex = getRandomInt(0, pool.length - 1);
        const modDef = pool[randomIndex];
        const baseMin = modDef.baseMin ?? modDef.baseMax;
        const baseMax = modDef.baseMax;
        const isPercent = modDef.type.startsWith('Increased') || modDef.type === 'AttackSpeed' || modDef.type === 'LifeLeech';
        const tierMin = getTierScaledValue(baseMin, tier, isPercent);
        const tierMax = getTierScaledValue(baseMax, tier, isPercent);
        let finalValue = 0;
        let finalValueMin: number | undefined = undefined;
        let finalValueMax: number | undefined = undefined;
        if (modDef.isRange) {
          finalValueMin = getRandomInt(tierMin, tierMax);
          finalValueMax = getRandomInt(finalValueMin, tierMax);
        } else {
          finalValue = getRandomInt(tierMin, tierMax);
        }
        selectedModifiers.push({ type: modDef.type, value: finalValue, valueMin: finalValueMin, valueMax: finalValueMax, tier: tier });
        pool.splice(randomIndex, 1);
        currentCount++;
        added++;
    }
    console.log(`Added ${added} ${type}(s). Pool remaining: ${pool.length}`);
    return currentCount;
  };
  let currentPrefixes = 0;
  let currentSuffixes = 0;

  console.log(`Targeting P: ${targetPrefixes}, S: ${targetSuffixes} for ${rarity} iLvl ${itemLevel} (Total Attempted: ${numTotalMods})`);

  // --- TODO: Insert Smart/Synergy Logic Here (Optional Enhancement) ---
  // Before randomly adding, could analyze target counts and available pools
  // to bias towards certain combinations for Legendaries.

  currentPrefixes = addRandomMod(availablePrefixes, targetPrefixes, currentPrefixes, 'prefix');
  currentSuffixes = addRandomMod(availableSuffixes, targetSuffixes, currentSuffixes, 'suffix');

  if (rarity === 'Mágico' && forceBothOnMagicTwo && selectedModifiers.length < 2) {
     console.log("Azul forceBoth failed due to pool limit, attempting to add other type...");
     if (currentPrefixes === 0 && targetPrefixes > 0) { currentPrefixes = addRandomMod(availablePrefixes, 1, currentPrefixes, 'prefix'); }
     else if (currentSuffixes === 0 && targetSuffixes > 0) { currentSuffixes = addRandomMod(availableSuffixes, 1, currentSuffixes, 'suffix'); }
   }

  console.log(`[generateModifiers Refactored] Generated ${selectedModifiers.length} mods for ${rarity} iLvl ${itemLevel}. (P: ${currentPrefixes}, S: ${currentSuffixes})`);
  return selectedModifiers;
}

// --- Main Drop Generation Function ---
export function generateDrop(monsterLevel: number): EquippableItem | null {
    const levelVariance = getRandomInt(-1, 1);
    const itemLevel = Math.max(1, monsterLevel + levelVariance);

    // TODO: Update item data/getEligibleItemBases if needed
    const eligibleBases = getEligibleItemBases(itemLevel, 'TwoHandedSword'); // Example type
    if (eligibleBases.length === 0) {
        console.warn(`[GenerateDrop] No eligible bases found for type 'TwoHandedSword' at itemLevel ${itemLevel}`);
        return null; // Warn instead of log
    }
    // Select the base with the highest minLevel among eligible ones
    const baseTemplate = eligibleBases.reduce((best, current) => {
        return current.minLevel > best.minLevel ? current : best;
    }, eligibleBases[0]);

    const rarity = determineRarity(itemLevel);
    const modifiers = generateModifiers(rarity, itemLevel);

    // Add log to inspect the template and the new item
    console.log("[GenerateDrop Details] Base Template Used:", baseTemplate);
    console.log("[GenerateDrop Details] Base Template Requirements:", baseTemplate.requirements);

    const newItem: EquippableItem = {
        id: uuidv4(),
        baseId: baseTemplate.baseId,
        name: `${rarity !== 'Normal' ? `${rarity} ` : ''}${baseTemplate.name}`,
        rarity: rarity,
        itemType: baseTemplate.itemType,
        icon: baseTemplate.icon,
        modifiers: modifiers,
        baseMinDamage: baseTemplate.baseMinDamage,
        baseMaxDamage: baseTemplate.baseMaxDamage,
        baseAttackSpeed: baseTemplate.baseAttackSpeed,
        requirements: baseTemplate.requirements,
        baseCriticalStrikeChance: baseTemplate.baseCriticalStrikeChance, // Pass base crit if defined
        baseArmor: baseTemplate.baseArmor, // Pass base armor if defined
    };

    console.log("[GenerateDrop Details] Final New Item Requirements:", newItem.requirements);
    console.log(`[GenerateDrop] Generated Item: ${newItem.name} (iLvl: ${itemLevel}, Rarity: ${rarity}, Mods: ${modifiers.length})`);
    return newItem;
}

// Restore the border class function
export const getRarityBorderClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "border-gray-600"; // Default border
  switch (rarity) {
    case "Normal":
      return "border-gray-600"; // Normal border
    case "Lendário":
      return "border-red-600"; // Red border
    case "Raro":
      return "border-yellow-400"; // Yellow border
    case "Mágico":
      return "border-blue-500"; // Blue border (using 500 for better visibility)
    default:
      return "border-gray-600";
  }
};

// NEW: Helper to get rarity TEXT color class
export const getRarityTextColorClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "text-white";
  switch (rarity) {
    case "Normal":
      return "text-white";
    case "Lendário":
      return "text-red-500";
    case "Raro":
      return "text-yellow-400";
    case "Mágico":
      return "text-blue-400";
    default:
      return "text-white";
  }
};

// NEW: Helper to get rarity INNER GLOW class (moved from components)
export const getRarityInnerGlowClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "";
  switch (rarity) {
    case "Normal":
      return "";
    case "Lendário":
      return "[box-shadow:inset_0_0_10px_2px_rgba(220,38,38,0.6)]"; // Red glow
    case "Raro":
      return "[box-shadow:inset_0_0_10px_2px_rgba(250,204,21,0.6)]";
    case "Mágico":
      return "[box-shadow:inset_0_0_10px_2px_rgba(96,165,250,0.6)]";
    default:
      return ""; // Branco
  }
}; 