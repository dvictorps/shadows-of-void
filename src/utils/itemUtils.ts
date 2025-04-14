import { v4 as uuidv4 } from 'uuid';
import {
  EquippableItem,
  Modifier,
  ModifierType,
  ItemRarity,
  PREFIX_MODIFIERS,
  SUFFIX_MODIFIERS,
} from '../types/gameData';
import { getEligibleItemBases, BaseItemTemplate } from '../data/items';

// --- Helpers ---
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- ADD Set definition here and export ---
export const TWO_HANDED_WEAPON_TYPES = new Set([
  "TwoHandedSword",
  "TwoHandedAxe",
  "TwoHandedMace",
  "Bow",
  "Staff",
]);

// NEW: Define display order for modifiers (moved from components)
export const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  // Prefixes (Lower numbers first)
  IncreasedPhysicalDamage: 10,
  AddsFlatPhysicalDamage: 20,
  AddsFlatFireDamage: 30,
  AddsFlatColdDamage: 40,
  AddsFlatLightningDamage: 50,
  AddsFlatVoidDamage: 60,
  MaxHealth: 70,              // Added
  IncreasedLocalArmor: 80,    // Added
  FlatLocalArmor: 90,         // Added
  ThornsDamage: 95,           // Added

  // Suffixes (Higher numbers first, within suffixes)
  AttackSpeed: 100,
  IncreasedLocalCriticalStrikeChance: 110, // Renamed
  IncreasedGlobalCriticalStrikeChance: 115, // Added
  IncreasedCriticalStrikeMultiplier: 120,
  IncreasedElementalDamage: 130,
  IncreasedFireDamage: 131, // Added
  IncreasedColdDamage: 132, // Added
  IncreasedLightningDamage: 133, // Added
  IncreasedVoidDamage: 134, // Added
  LifeLeech: 140,
  FireResistance: 150,        // Added
  ColdResistance: 160,        // Added
  LightningResistance: 170, // Added
  VoidResistance: 180,      // Added
  FlatLifeRegen: 190,       // Added
  PercentLifeRegen: 195,    // Added
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

// --- Modifier Generation (Refactored) ---
function generateModifiers(rarity: ItemRarity, baseTemplate: BaseItemTemplate): Modifier[] {
  const selectedModifiers: Modifier[] = [];
  // Use allowed modifiers from the specific base template
  const allowedMods = [...(baseTemplate.allowedModifiers || [])]; // Add safety check
  const availablePrefixes = allowedMods.filter(modDef => PREFIX_MODIFIERS.has(modDef.type));
  const availableSuffixes = allowedMods.filter(modDef => SUFFIX_MODIFIERS.has(modDef.type));

  // --- Determine Number of Mods Based on Rarity --- 
  let targetPrefixes = 0;
  let targetSuffixes = 0;
  let numTotalMods = 0;
  let forceBothOnMagicTwo = false;

  switch (rarity) {
    case 'Mágico':
      numTotalMods = getRandomInt(1, 2);
      if (numTotalMods === 1) {
        if (Math.random() < 0.5 && availablePrefixes.length > 0) targetPrefixes = 1;
        else if (availableSuffixes.length > 0) targetSuffixes = 1;
        else if (availablePrefixes.length > 0) targetPrefixes = 1; // Fallback if suffixes run out
      } else { // numTotalMods === 2
        targetPrefixes = 1; targetSuffixes = 1; forceBothOnMagicTwo = true;
      }
      break;
    case 'Raro':
      numTotalMods = getRandomInt(4, 6);
      // Try to balance prefixes/suffixes up to 3 each
      let prefixesAssigned = 0;
      let suffixesAssigned = 0;
      for (let i = 0; i < numTotalMods; i++) {
          const canAddPrefix = availablePrefixes.length > prefixesAssigned;
          const canAddSuffix = availableSuffixes.length > suffixesAssigned;
          if (canAddPrefix && prefixesAssigned < 3 && (Math.random() < 0.5 || suffixesAssigned >= 3 || !canAddSuffix)) {
            targetPrefixes++; prefixesAssigned++;
          } else if (canAddSuffix && suffixesAssigned < 3) {
            targetSuffixes++; suffixesAssigned++;
          } else if (canAddPrefix && prefixesAssigned < 3) { // Fallback if suffix choice failed but prefix possible
             targetPrefixes++; prefixesAssigned++;
          } else if (canAddSuffix && suffixesAssigned < 3) { // Fallback if prefix choice failed but suffix possible
             targetSuffixes++; suffixesAssigned++;
          }
      }
      break;
    case 'Lendário':
      // Use item level from base template for tiered mod count
      const itemLevel = baseTemplate.requirements?.level ?? baseTemplate.minLevel; // Use req level or min drop level
      if (itemLevel >= 75) {
          numTotalMods = getRandomInt(10, 15); // Potentially higher for high-level legendaries
      } else if (itemLevel >= 50) {
          numTotalMods = getRandomInt(8, 10);
      } else {
          numTotalMods = getRandomInt(7, 8);
      }
       // Distribute mods somewhat randomly, but still respecting prefix/suffix limits if desired (e.g., max 3 prefixes still?)
       // For now, simple random distribution based on pool availability
       let prefixesAssignedL = 0;
       let suffixesAssignedL = 0;
       for (let i = 0; i < numTotalMods; i++) {
           const canAddPrefix = availablePrefixes.length > prefixesAssignedL;
           const canAddSuffix = availableSuffixes.length > suffixesAssignedL;
           if (canAddPrefix && (!canAddSuffix || Math.random() < 0.5)) {
               targetPrefixes++; prefixesAssignedL++;
           } else if (canAddSuffix) {
               targetSuffixes++; suffixesAssignedL++;
           } else if (canAddPrefix) { // Fallback
               targetPrefixes++; prefixesAssignedL++;
           }
       }
      break;
  }

  // --- Add Mods (Helper and Logic - Uses Base Template Values) ---
  const addRandomMod = (pool: BaseItemTemplate['allowedModifiers'], targetCount: number, currentCount: number): number => { 
    let currentAddedCount = 0; // Use a different name than the outer scope variable
    while (currentCount < targetCount && pool.length > 0) {
      const randomIndex = getRandomInt(0, pool.length - 1);
      const modDef = pool[randomIndex];
      
      // Roll value directly using minVal/maxVal from the base template's allowed mod
      let finalValue = 0;
      let finalValueMin: number | undefined = undefined;
      let finalValueMax: number | undefined = undefined;

      if (modDef.isRange) { // e.g., AddsFlat... damage
        finalValueMin = getRandomInt(modDef.minVal, modDef.maxVal);
        finalValueMax = getRandomInt(finalValueMin, modDef.maxVal); // Ensure max >= min
         // For range mods, 'value' might be unused or could store the average/midpoint? Setting to 0 for now.
      } else {
        // Handle potential floating point values for PercentLifeRegen etc.
        if (modDef.type === 'PercentLifeRegen') {
            // Example: Roll between 0.1 and 0.5 => roll between 1 and 5, then divide by 10
            const factor = 10;
            const rolledInt = getRandomInt(modDef.minVal * factor, modDef.maxVal * factor);
            finalValue = rolledInt / factor;
        } else {
             finalValue = getRandomInt(modDef.minVal, modDef.maxVal);
        }
      }

      selectedModifiers.push({ 
          type: modDef.type, 
          value: finalValue, 
          valueMin: finalValueMin, 
          valueMax: finalValueMax, 
          // Tier might not be relevant anymore if values are directly from base 
      });
      pool.splice(randomIndex, 1); // Remove from available pool for this item
      currentCount++;
      currentAddedCount++; // Increment local count
    }
    return currentAddedCount; // Return the number added in this call
  };

  let currentPrefixes = 0;
  let currentSuffixes = 0;

  // Pass available pools directly
  addRandomMod(availablePrefixes, targetPrefixes, currentPrefixes); // We don't need the returned count here yet
  addRandomMod(availableSuffixes, targetSuffixes, currentSuffixes);

  // Re-calculate actual counts based on selectedModifiers length for safety
  currentPrefixes = selectedModifiers.filter(m => PREFIX_MODIFIERS.has(m.type)).length;
  currentSuffixes = selectedModifiers.filter(m => SUFFIX_MODIFIERS.has(m.type)).length;


  // Handle Magic item needing both prefix/suffix if possible
  if (rarity === 'Mágico' && forceBothOnMagicTwo && selectedModifiers.length < 2) {
    if (currentPrefixes === 0 && targetPrefixes > 0 && availablePrefixes.length > 0) {
      addRandomMod(availablePrefixes, 1, currentPrefixes); // Add one more prefix
    } else if (currentSuffixes === 0 && targetSuffixes > 0 && availableSuffixes.length > 0) {
      addRandomMod(availableSuffixes, 1, currentSuffixes); // Add one more suffix
    }
  }

  return selectedModifiers;
}

// --- Main Drop Generation Function (Refactored) ---
export function generateDrop(monsterLevel: number, itemTypeFilter?: string): EquippableItem | null {
  const levelVariance = getRandomInt(-1, 1);
  const itemLevel = Math.max(1, monsterLevel + levelVariance); // Item level determination remains similar

  // Get eligible bases using the imported function and filter
  const eligibleBases = getEligibleItemBases(itemLevel, itemTypeFilter);

  if (eligibleBases.length === 0) {
    console.warn(`[GenerateDrop] No eligible bases found for type '${itemTypeFilter ?? 'Any'}' at itemLevel ${itemLevel}`);
    return null;
  }

  // --- Selection Strategy: Randomly pick from eligible bases --- 
  const baseTemplate = eligibleBases[getRandomInt(0, eligibleBases.length - 1)];

  const rarity = determineRarity(itemLevel);
  // Generate modifiers using the specific base template's allowed mods and ranges
  if (!baseTemplate.allowedModifiers) {
      console.error(`[Generate Drop] Base template ${baseTemplate.baseId} is missing allowedModifiers! Cannot generate item.`);
      return null;
  }
  const modifiers = generateModifiers(rarity, baseTemplate);

  // Create the final item, copying properties from the base template
  const newItem: EquippableItem = {
    id: uuidv4(),
    baseId: baseTemplate.baseId,
    name: `${rarity !== 'Normal' ? `${rarity} ` : ''}${baseTemplate.name}`,
    rarity: rarity,
    itemType: baseTemplate.itemType,
    icon: baseTemplate.icon,
    modifiers: modifiers,
    // Base Stats - Copy *only* if they exist on the template
    ...(baseTemplate.baseMinDamage !== undefined && { baseMinDamage: baseTemplate.baseMinDamage }),
    ...(baseTemplate.baseMaxDamage !== undefined && { baseMaxDamage: baseTemplate.baseMaxDamage }),
    ...(baseTemplate.baseAttackSpeed !== undefined && { baseAttackSpeed: baseTemplate.baseAttackSpeed }),
    ...(baseTemplate.baseCriticalStrikeChance !== undefined && { baseCriticalStrikeChance: baseTemplate.baseCriticalStrikeChance }),
    ...(baseTemplate.baseArmor !== undefined && { baseArmor: baseTemplate.baseArmor }),
    // Copy requirements and classification if they exist
    ...(baseTemplate.requirements && { requirements: { ...baseTemplate.requirements } }), 
    ...(baseTemplate.classification && { classification: baseTemplate.classification }),
  };

  console.log(`[GenerateDrop] Generated: ${newItem.name} (Base: ${newItem.baseId}, iLvl: ${itemLevel}, Rarity: ${rarity}, Mods: ${modifiers.length})`);
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