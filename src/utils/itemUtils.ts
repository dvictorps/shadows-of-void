import { v4 as uuidv4 } from 'uuid';
import {
  EquippableItem,
  Modifier,
  ModifierType,
  ItemRarity,
  PREFIX_MODIFIERS,
  SUFFIX_MODIFIERS,
  BaseItem,
  PLATE_HELM_T1,
  PLATE_HELM_T2,
  PLATE_HELM_T3,
  // Import new sword tiers
  SHORT_SWORD_T1, SHORT_SWORD_T2, SHORT_SWORD_T3,
  LONG_SWORD_T1, LONG_SWORD_T2, LONG_SWORD_T3,
  // Import new armor tiers
  PLATE_ARMOR_T1, PLATE_ARMOR_T2, PLATE_ARMOR_T3,
  // Import new evasion/barrier armor tiers
  LEATHER_VEST_T1, LEATHER_VEST_T2, LEATHER_VEST_T3,
  SILK_ROBE_T1, SILK_ROBE_T2, SILK_ROBE_T3,
  // Import new shield tiers
  PLATE_SHIELD_T1, PLATE_SHIELD_T2, PLATE_SHIELD_T3,
} from '../types/gameData';

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

// --- ADD Set for One-Handed Weapons --- NEW
export const ONE_HANDED_WEAPON_TYPES = new Set([
    "OneHandedSword",
    "OneHandedAxe",
    "OneHandedMace",
    "Dagger",
    "Wand",
    "Sceptre",
]);

// --- ADD Set for Off-Hand Types --- NEW
export const OFF_HAND_TYPES = new Set([
    "Shield",
    // Add Quiver, Catalyst, etc. later if needed
]);

// NEW: Define display order for modifiers (moved from components)
// FULL DEFINITION - ADDED EVASION/BARRIER
export const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  // Prefixes (Lower numbers first)
  IncreasedPhysicalDamage: 10,
  AddsFlatPhysicalDamage: 20,
  AddsFlatFireDamage: 30,
  AddsFlatColdDamage: 40,
  AddsFlatLightningDamage: 50,
  AddsFlatVoidDamage: 60,
  MaxHealth: 70,
  FlatLocalArmor: 80,
  IncreasedLocalArmor: 85,
  FlatLocalEvasion: 90,
  IncreasedLocalEvasion: 95,
  FlatLocalBarrier: 100,
  IncreasedLocalBarrier: 105,
  ThornsDamage: 110,

  // Suffixes (Higher numbers first, within suffixes)
  AttackSpeed: 120,
  IncreasedLocalCriticalStrikeChance: 130,
  IncreasedGlobalCriticalStrikeChance: 135,
  IncreasedCriticalStrikeMultiplier: 140,
  IncreasedBlockChance: 145,
  IncreasedElementalDamage: 150,
  IncreasedFireDamage: 151,
  IncreasedColdDamage: 152,
  IncreasedLightningDamage: 153,
  IncreasedVoidDamage: 154,
  LifeLeech: 160,
  FireResistance: 170,
  ColdResistance: 180,
  LightningResistance: 190,
  VoidResistance: 200,
  FlatLifeRegen: 210,
  PercentLifeRegen: 215,
  PhysDamageTakenAsElement: 220,
  ReducedPhysDamageTaken: 230,
  // Attributes last
  Strength: 240,
  Dexterity: 250,
  Intelligence: 260,
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

// Define base items (Corrected)
const BASE_ITEMS: Record<string, Omit<BaseItem, 'id' | 'rarity'>[]> = {
  OneHandedSword: [
    SHORT_SWORD_T1, SHORT_SWORD_T2, SHORT_SWORD_T3,
    // Add other distinct 1h sword types here if needed (e.g., Dagger_T1...)
  ],
  TwoHandedSword: [
    LONG_SWORD_T1, LONG_SWORD_T2, LONG_SWORD_T3,
    // Add other distinct 2h sword types here if needed (e.g., GreatSword_T1...)
  ],
  Helm: [PLATE_HELM_T1, PLATE_HELM_T2, PLATE_HELM_T3],
  BodyArmor: [
      PLATE_ARMOR_T1, PLATE_ARMOR_T2, PLATE_ARMOR_T3, // Armor
      LEATHER_VEST_T1, LEATHER_VEST_T2, LEATHER_VEST_T3, // Evasion
      SILK_ROBE_T1, SILK_ROBE_T2, SILK_ROBE_T3, // Barrier
  ],
  Shield: [PLATE_SHIELD_T1, PLATE_SHIELD_T2, PLATE_SHIELD_T3],
  // TODO: Add base items for other slots (Gloves, Boots, Amulet, Ring, Belt)
  // Ensure at least one of each desired slot type has a level 1 requirement if they should drop early.
};

// NEW: Generic mods for two-handed weapons
const GENERIC_TWO_HANDED_WEAPON_MODS: ModifierType[] = [
  "AddsFlatPhysicalDamage",
  "IncreasedPhysicalDamage",
  "AddsFlatFireDamage",
  "AddsFlatColdDamage",
  "AddsFlatLightningDamage",
  "AddsFlatVoidDamage",
  "AttackSpeed",
  "IncreasedLocalCriticalStrikeChance",
  "IncreasedCriticalStrikeMultiplier",
  "IncreasedElementalDamage",
  "IncreasedFireDamage",
  "IncreasedColdDamage",
  "IncreasedLightningDamage",
  "IncreasedVoidDamage",
  "LifeLeech",
  "Strength",
  "Dexterity",
  "Intelligence",
];

// NEW: Generic mods for one-handed weapons (similar base for now)
const GENERIC_ONE_HANDED_WEAPON_MODS: ModifierType[] = [
  "AddsFlatPhysicalDamage",
  "IncreasedPhysicalDamage",
  "AddsFlatFireDamage",
  "AddsFlatColdDamage",
  "AddsFlatLightningDamage",
  "AddsFlatVoidDamage",
  "AttackSpeed",
  "IncreasedLocalCriticalStrikeChance",
  "IncreasedCriticalStrikeMultiplier",
  "IncreasedElementalDamage",
  "IncreasedFireDamage",
  "IncreasedColdDamage",
  "IncreasedLightningDamage",
  "IncreasedVoidDamage",
  "LifeLeech",
  "Strength", // Maybe exclude attributes later?
  "Dexterity",
  "Intelligence",
];

// EXPANDED: Add new armor mods
const GENERIC_ARMOUR_MODS: ModifierType[] = [
  // Attributes
  "Strength", "Dexterity", "Intelligence",
  // Health (May be filtered later for Barrier items)
  "MaxHealth",
  "FlatLifeRegen",
  "PercentLifeRegen",
  // Defenses
  "FlatLocalArmor", "IncreasedLocalArmor",
  "FlatLocalEvasion", "IncreasedLocalEvasion", // Added
  "FlatLocalBarrier", "IncreasedLocalBarrier", // Added
  // Resistances
  "FireResistance", "ColdResistance", "LightningResistance", "VoidResistance",
];

// Define possible mods per item type
const ITEM_TYPE_MODIFIERS: Record<string, ModifierType[]> = {
  OneHandedSword: [
    ...GENERIC_ONE_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 1H Swords ONLY here
  ],
  TwoHandedSword: [
    ...GENERIC_TWO_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 2H Swords ONLY here
  ],
  Helm: [
    ...GENERIC_ARMOUR_MODS,
    "PhysDamageTakenAsElement", "ReducedPhysDamageTaken",
  ],
  BodyArmor: [
    ...GENERIC_ARMOUR_MODS,
    "ThornsDamage",
    // Specific mods already defined in GENERIC list
  ],
  Shield: [
      ...GENERIC_ARMOUR_MODS,
      "IncreasedBlockChance",
  ],
  // TODO: Define mods for Gloves, Boots, Amulet, Ring, Belt
};

// Define value ranges per modifier type and tier (T1, T2, T3)
// FULL DEFINITION
const MODIFIER_RANGES: Record<
  ModifierType,
  { valueMin: number; valueMax: number }[] | undefined // Allow undefined for types without ranges yet
> = {
  AddsFlatPhysicalDamage: [
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  IncreasedPhysicalDamage: [
    { valueMin: 10, valueMax: 20 }, { valueMin: 21, valueMax: 40 }, { valueMin: 41, valueMax: 60 },
  ],
  AddsFlatFireDamage: [
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  AddsFlatColdDamage: [
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  AddsFlatLightningDamage: [
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  AddsFlatVoidDamage: [
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  AttackSpeed: [
    { valueMin: 3, valueMax: 5 }, { valueMin: 6, valueMax: 8 }, { valueMin: 9, valueMax: 12 },
  ],
  IncreasedLocalCriticalStrikeChance: [
     { valueMin: 10, valueMax: 15 }, { valueMin: 16, valueMax: 25 }, { valueMin: 26, valueMax: 35 },
  ],
  IncreasedCriticalStrikeMultiplier: [
    { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 30 },
  ],
  IncreasedElementalDamage: [
    { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 30 },
  ],
  IncreasedFireDamage: [
    { valueMin: 8, valueMax: 15 }, { valueMin: 16, valueMax: 25 }, { valueMin: 26, valueMax: 40 },
  ],
  IncreasedColdDamage: [
     { valueMin: 8, valueMax: 15 }, { valueMin: 16, valueMax: 25 }, { valueMin: 26, valueMax: 40 },
  ],
  IncreasedLightningDamage: [
     { valueMin: 8, valueMax: 15 }, { valueMin: 16, valueMax: 25 }, { valueMin: 26, valueMax: 40 },
  ],
  IncreasedVoidDamage: [
     { valueMin: 8, valueMax: 15 }, { valueMin: 16, valueMax: 25 }, { valueMin: 26, valueMax: 40 },
  ],
  IncreasedGlobalCriticalStrikeChance: [
     { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 30 },
  ],
  LifeLeech: [
    { valueMin: 10, valueMax: 20 }, { valueMin: 21, valueMax: 35 }, { valueMin: 36, valueMax: 50 }, // Stored as 10-50, represents 0.1% - 0.5%
  ],
  Strength: [
    { valueMin: 3, valueMax: 6 }, { valueMin: 7, valueMax: 12 }, { valueMin: 13, valueMax: 20 },
  ],
  Dexterity: [
     { valueMin: 3, valueMax: 6 }, { valueMin: 7, valueMax: 12 }, { valueMin: 13, valueMax: 20 },
  ],
  Intelligence: [
    { valueMin: 3, valueMax: 6 }, { valueMin: 7, valueMax: 12 }, { valueMin: 13, valueMax: 20 },
  ],
  MaxHealth: [
    { valueMin: 10, valueMax: 20 }, { valueMin: 21, valueMax: 40 }, { valueMin: 41, valueMax: 70 },
  ],
  IncreasedLocalArmor: [
    { valueMin: 10, valueMax: 25 }, { valueMin: 26, valueMax: 50 }, { valueMin: 51, valueMax: 100 },
  ],
  FlatLocalArmor: [
    { valueMin: 5, valueMax: 15 }, { valueMin: 16, valueMax: 40 }, { valueMin: 41, valueMax: 80 },
  ],
  ThornsDamage: [ // Ensure this exists if used elsewhere (e.g., BodyArmor)
    { valueMin: 1, valueMax: 3 }, { valueMin: 4, valueMax: 8 }, { valueMin: 9, valueMax: 15 },
  ],
  FireResistance: [
    { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 35 },
  ],
  ColdResistance: [
     { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 35 },
  ],
  LightningResistance: [
    { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 35 },
  ],
  VoidResistance: [
     { valueMin: 5, valueMax: 10 }, { valueMin: 11, valueMax: 20 }, { valueMin: 21, valueMax: 35 },
  ],
   FlatLifeRegen: [
    { valueMin: 1, valueMax: 2 }, { valueMin: 3, valueMax: 4 }, { valueMin: 5, valueMax: 7 },
  ],
  PercentLifeRegen: [
    { valueMin: 10, valueMax: 20 }, { valueMin: 21, valueMax: 35 }, { valueMin: 36, valueMax: 50 }, // Stored as 10-50, divided by 100 in calculation
  ],
  // --- NEW HELM MOD RANGES ---
  PhysDamageTakenAsElement: [
    { valueMin: 3, valueMax: 5 }, { valueMin: 6, valueMax: 9 }, { valueMin: 10, valueMax: 15 },
  ],
  ReducedPhysDamageTaken: [
    { valueMin: 2, valueMax: 3 }, { valueMin: 4, valueMax: 5 }, { valueMin: 6, valueMax: 7 },
  ],
  // --- NEW EVASION RANGES (Example values, adjust as needed) ---
  FlatLocalEvasion: [
    { valueMin: 10, valueMax: 25 }, { valueMin: 26, valueMax: 60 }, { valueMin: 61, valueMax: 120 },
  ],
  IncreasedLocalEvasion: [
    { valueMin: 10, valueMax: 25 }, { valueMin: 26, valueMax: 50 }, { valueMin: 51, valueMax: 100 }, // Same % as armor?
  ],
  // --- NEW BARRIER RANGES (Example values, adjust as needed) ---
  FlatLocalBarrier: [
    { valueMin: 8, valueMax: 20 }, { valueMin: 21, valueMax: 50 }, { valueMin: 51, valueMax: 100 },
  ],
  IncreasedLocalBarrier: [
    { valueMin: 10, valueMax: 25 }, { valueMin: 26, valueMax: 50 }, { valueMin: 51, valueMax: 100 }, // Same % as armor?
  ],
  IncreasedBlockChance: [
      { valueMin: 3, valueMax: 6 },   // T1: 3-6%
      { valueMin: 7, valueMax: 12 },  // T2: 7-12%
      { valueMin: 13, valueMax: 20 }, // T3: 13-20%
  ],
};

// Helper Set for Flat Damage Mod Types
const FLAT_DAMAGE_MOD_TYPES: Set<ModifierType> = new Set([
    "AddsFlatPhysicalDamage",
    "AddsFlatFireDamage",
    "AddsFlatColdDamage",
    "AddsFlatLightningDamage",
    "AddsFlatVoidDamage",
]);

// Helper function to determine tier based on item level (example)
const getItemTier = (level: number): number => {
  if (level <= 20) return 0; // Tier 1 ranges (index 0)
  if (level <= 45) return 1; // Tier 2 ranges (index 1)
  return 2; // Tier 3 ranges (index 2)
};

// UPDATED generateModifiers to filter mods for specific base types
export const generateModifiers = (
  baseItem: BaseItem,
  rarity: ItemRarity,
  itemLevel: number
): Modifier[] => {

  // --- Determine Base Type Flags --- 
  const isOneHandedWeapon = ONE_HANDED_WEAPON_TYPES.has(baseItem.itemType);
  const isArmorBase = baseItem.baseArmor !== undefined && baseItem.baseArmor > 0;
  const isEvasionBase = baseItem.baseEvasion !== undefined && baseItem.baseEvasion > 0;
  const isBarrierBase = baseItem.baseBarrier !== undefined && baseItem.baseBarrier > 0;
  // ----------------------------------

  // Get initial possible mods for the item type
  let possibleMods = ITEM_TYPE_MODIFIERS[baseItem.itemType] || [];

  // --- Filter mods based on specific base type --- NEW
  if (baseItem.itemType === 'BodyArmor') { // Apply filtering only to BodyArmor for now
      if (isArmorBase) {
          possibleMods = possibleMods.filter(mod =>
              !["FlatLocalEvasion", "IncreasedLocalEvasion", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
          );
          console.log(`[generateModifiers] Filtering Evasion/Barrier mods for Armor base ${baseItem.baseId}`);
      } else if (isEvasionBase) {
          possibleMods = possibleMods.filter(mod =>
              !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
          );
           console.log(`[generateModifiers] Filtering Armor/Barrier mods for Evasion base ${baseItem.baseId}`);
      } else if (isBarrierBase) {
          possibleMods = possibleMods.filter(mod =>
              !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalEvasion", "IncreasedLocalEvasion", // Exclude other defenses
                "MaxHealth", "FlatLifeRegen", "PercentLifeRegen"] // Also exclude health/regen
              .includes(mod)
          );
           console.log(`[generateModifiers] Filtering Armor/Evasion/Health mods for Barrier base ${baseItem.baseId}`);
      }
  }
  // ---------------------------------------------

  if (!possibleMods.length) {
      console.log(`[generateModifiers] No possible mods left for ${baseItem.baseId} after filtering.`);
      return [];
  }

  let numPrefixes = 0;
  let numSuffixes = 0;

  switch (rarity) {
    case "Mágico":
      numPrefixes = Math.random() < 0.5 ? 1 : 0;
      numSuffixes = 1 - numPrefixes;
      break;
    case "Raro":
      numPrefixes = Math.random() < 0.6 ? 2 : 1; // Bias towards 2 prefixes
      numSuffixes = 3 - numPrefixes;
      break;
    case "Lendário":
      numPrefixes = Math.random() < 0.5 ? 3 : 2; // Bias towards 3 prefixes
      numSuffixes = 5 - numPrefixes;
      break;
    default: // Normal
      return [];
  }

  const tierIndex = getItemTier(itemLevel);

  const generatedModifiers: Modifier[] = [];
  const availablePrefixes = possibleMods.filter((mod) => PREFIX_MODIFIERS.has(mod));
  const availableSuffixes = possibleMods.filter((mod) => SUFFIX_MODIFIERS.has(mod));

  const getScaledRange = (modType: ModifierType, baseRange: { valueMin: number; valueMax: number }) => {
      if (isOneHandedWeapon && FLAT_DAMAGE_MOD_TYPES.has(modType)) {
          const minValue = Math.max(1, Math.round(baseRange.valueMin * 0.5));
          const maxValue = Math.max(minValue, Math.round(baseRange.valueMax * 0.5));
          return { minValue, maxValue };
      }
      return { minValue: baseRange.valueMin, maxValue: baseRange.valueMax };
  };

  // Generate Prefixes
  for (let i = 0; i < numPrefixes && availablePrefixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availablePrefixes.length);
    const modType = availablePrefixes.splice(modIndex, 1)[0];
    const baseRange = MODIFIER_RANGES[modType]?.[tierIndex];
    if (baseRange) {
      const { minValue, maxValue } = getScaledRange(modType, baseRange);
      // --- MODIFIED: Use valueMin/valueMax for flat damage types ---
      if (FLAT_DAMAGE_MOD_TYPES.has(modType)) {
        generatedModifiers.push({ type: modType, valueMin: minValue, valueMax: maxValue });
      } else {
        const value = getRandomInt(minValue, maxValue);
        generatedModifiers.push({ type: modType, value });
      }
      // --------------------------------------------------------
    } else {
      console.warn(`Missing range for prefix ${modType} at tier index ${tierIndex}`);
    }
  }

  // Generate Suffixes
  for (let i = 0; i < numSuffixes && availableSuffixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availableSuffixes.length);
    const modType = availableSuffixes.splice(modIndex, 1)[0];
    const baseRange = MODIFIER_RANGES[modType]?.[tierIndex];
    if (baseRange) {
      const { minValue, maxValue } = getScaledRange(modType, baseRange);
        // --- MODIFIED: Use valueMin/valueMax for flat damage types ---
        // (Note: Flat damage mods are typically prefixes, but check here for safety/future changes)
       if (FLAT_DAMAGE_MOD_TYPES.has(modType)) {
         generatedModifiers.push({ type: modType, valueMin: minValue, valueMax: maxValue });
       } else {
         const value = getRandomInt(minValue, maxValue);
         generatedModifiers.push({ type: modType, value });
       }
       // --------------------------------------------------------
    } else {
      console.warn(`Missing range for suffix ${modType} at tier index ${tierIndex}`);
    }
  }

  return generatedModifiers;
};

// Generate Drop function (Cleaned up - logs removed)
export const generateDrop = (
  monsterLevel: number,
  forceItemType?: string
): EquippableItem | null => {
  // Filter eligible item types
  const possibleItemTypes = forceItemType
    ? [forceItemType]
    : Object.keys(BASE_ITEMS).filter(type =>
        BASE_ITEMS[type]?.some(base => (base.requirements?.level ?? 0) <= monsterLevel)
      );

  if (!possibleItemTypes.length) {
      console.error(`[GenerateDrop] No possible item types found for monsterLevel ${monsterLevel}.`);
      return null;
  }

  const itemType = possibleItemTypes[Math.floor(Math.random() * possibleItemTypes.length)];

  // Filter eligible bases for the chosen type based on monsterLevel
  const eligibleBases = BASE_ITEMS[itemType]?.filter(
    (base) => (base.requirements?.level ?? 0) <= monsterLevel
  ) ?? [];

  if (!eligibleBases.length) {
       console.error(`[GenerateDrop] No eligible bases found for type ${itemType} at monsterLevel ${monsterLevel}.`);
       return null;
  }

  // Select a base
  const selectedBaseTemplate = eligibleBases[Math.floor(Math.random() * eligibleBases.length)];

  const itemLevel = monsterLevel; // Use monsterLevel directly for tier calculation
  const rarity = determineRarity(itemLevel);

  // Generate modifiers
  const modifiers = generateModifiers(
      { ...selectedBaseTemplate, id: '', rarity: 'Normal' }, // Pass necessary BaseItem info
      rarity,
      itemLevel
  );

  // Construct the final item
  const newItem: EquippableItem = {
    ...selectedBaseTemplate,
    id: uuidv4(),
    rarity,
    modifiers,
    name: `${rarity !== 'Normal' ? `${rarity} ` : ''}${selectedBaseTemplate.name}`,
  };

  // console.log(`[GenerateDrop] Generated: ${newItem.name} (ID: ${newItem.id})`); // Optional: Keep for success logging
  return newItem;
};

// --- START RESTORED HELPER FUNCTIONS ---

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

// Display Names (Restored - Ensure it's the full version)
// EXPANDED: Add Evasion/Barrier names
// EXPORTED - NEW
export const MODIFIER_DISPLAY_NAMES: Record<ModifierType, string> = {
    AddsFlatPhysicalDamage: "Adiciona Dano Físico",
    IncreasedPhysicalDamage: "% Dano Físico Aumentado",
    AddsFlatFireDamage: "Adiciona Dano de Fogo",
    AddsFlatColdDamage: "Adiciona Dano de Frio",
    AddsFlatLightningDamage: "Adiciona Dano de Raio",
    AddsFlatVoidDamage: "Adiciona Dano de Vazio",
    AttackSpeed: "% Velocidade de Ataque Aumentada",
    IncreasedLocalCriticalStrikeChance: "% Chance de Crítico Aumentada (Local)",
    IncreasedCriticalStrikeMultiplier: "% Multiplicador de Crítico Aumentado",
    IncreasedElementalDamage: "% Dano Elemental Aumentado",
    IncreasedFireDamage: "% Dano de Fogo Aumentado",
    IncreasedColdDamage: "% Dano de Frio Aumentado",
    IncreasedLightningDamage: "% Dano de Raio Aumentado",
    IncreasedVoidDamage: "% Dano de Vazio Aumentado",
    IncreasedGlobalCriticalStrikeChance: "% Chance de Crítico Global Aumentada",
    LifeLeech: "% do Dano de Ataque Convertido em Vida",
    Strength: "Força",
    Dexterity: "Destreza",
    Intelligence: "Inteligência",
    MaxHealth: "Vida Máxima",
    IncreasedLocalArmor: "% Armadura Aumentada",
    FlatLocalArmor: "Armadura Adicional",
    ThornsDamage: "Dano de Espinhos",
    FireResistance: "% Resistência a Fogo",
    ColdResistance: "% Resistência a Frio",
    LightningResistance: "% Resistência a Raio",
    VoidResistance: "% Resistência a Vazio",
    FlatLifeRegen: "Regeneração de Vida Plana",
    PercentLifeRegen: "% Regeneração de Vida",
    PhysDamageTakenAsElement: "% do Dano Físico Recebido como Elemental",
    ReducedPhysDamageTaken: "% Redução de Dano Físico Recebido",
    // --- NEW ARMOR DISPLAY NAMES --- Remove (Local)
    FlatLocalEvasion: "Evasão Adicional",
    IncreasedLocalEvasion: "% Evasão Aumentada",
    FlatLocalBarrier: "Barreira Adicional",
    IncreasedLocalBarrier: "% Barreira Aumentada",
    IncreasedBlockChance: "% Chance de Bloqueio Aumentada",
};

// Update getModifierText (Restored and Fixed for optional value)
export const getModifierText = (mod: Modifier): string => {
  const name = MODIFIER_DISPLAY_NAMES[mod.type] || mod.type;
  // Handle ranges for damage mods
  if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
      return `${name}: ${mod.valueMin}-${mod.valueMax}`;
  }
  // Handle percentages
  if (name.includes("%")) {
       if (mod.type === 'LifeLeech') {
           // Ensure value exists for calculation
           const displayValue = mod.value !== undefined ? (mod.value / 10).toFixed(1) : "?";
           return `${displayValue}% do Dano de Ataque Convertido em Vida`;
       }
       if (mod.type === 'PercentLifeRegen') {
            // Ensure value exists for calculation
            const displayValue = mod.value !== undefined
                ? (mod.value < 1 ? (mod.value * 100).toFixed(1) : mod.value.toFixed(1))
                : "?";
           return `${displayValue}% Regeneração de Vida por segundo`;
       }
       if (mod.type === 'PhysDamageTakenAsElement' || mod.type === 'ReducedPhysDamageTaken') {
            // Ensure value exists
            const displayValue = mod.value !== undefined ? mod.value : "?";
            return `${name.replace('% do','').replace('%','').trim()}: ${displayValue}%`;
       }
      // General percentage format - ensure value exists
      const displayValue = mod.value !== undefined ? mod.value : "?";
      return `${name.replace("%", "").trim()}: +${displayValue}%`;
  }
  // Handle flat values - ensure value exists
  const displayValue = mod.value !== undefined ? mod.value : "?";
  return `${name}: +${displayValue}`;
};
// --- END RESTORED HELPER FUNCTIONS ---