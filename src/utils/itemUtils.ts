import { v4 as uuidv4 } from 'uuid';
import {
  EquippableItem,
  Modifier,
  ModifierType,
  ItemRarity,
  PREFIX_MODIFIERS,
  SUFFIX_MODIFIERS,
  EquipmentSlotId,
  WeaponClassification,
  // PLATE_HELM_T1, // Not needed directly if using BaseItemTemplate
  // PLATE_HELM_T2,
  // PLATE_HELM_T3,
  // Import new sword tiers
  // SHORT_SWORD_T1, SHORT_SWORD_T2, SHORT_SWORD_T3,
  // LONG_SWORD_T1, LONG_SWORD_T2, LONG_SWORD_T3,
  // Import new armor tiers
  // PLATE_ARMOR_T1, PLATE_ARMOR_T2, PLATE_ARMOR_T3,
  // Import new evasion/barrier armor tiers
  // LEATHER_VEST_T1, LEATHER_VEST_T2, LEATHER_VEST_T3,
  // SILK_ROBE_T1, SILK_ROBE_T2, SILK_ROBE_T3,
  // Import new shield tiers
  // PLATE_SHIELD_T1, PLATE_SHIELD_T2, PLATE_SHIELD_T3,
} from '../types/gameData';
import { BaseItemTemplate, ALL_ITEM_BASES } from '../data/items'; // <<< IMPORT BaseItemTemplate & ALL_ITEM_BASES

// --- Define BaseItem locally for generateModifiers --- 
interface BaseItem { // <<< Add local interface
  baseId: string;
  name: string;
  itemType: string;
  icon: string;
  baseArmor?: number;
  baseEvasion?: number;
  baseBarrier?: number;
  baseAttackSpeed?: number;
  baseCriticalStrikeChance?: number;
  baseBlockChance?: number;
  requirements?: { level?: number; strength?: number; dexterity?: number; intelligence?: number; };
  classification?: WeaponClassification;
  id: string; // Placeholder required by BaseItem type in original call
  rarity: ItemRarity; // Placeholder required by BaseItem type in original call
}
// -----------------------------------------------------

// --- Helpers ---
// Remove unused function
// function getRandomInt(min: number, max: number): number {
//   min = Math.ceil(min);
//   max = Math.floor(max);
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// <<< NEW Helper for biased random int >>>
function getBiasedRandomInt(min: number, max: number, biasFactor: number): number {
  // biasFactor should be between 0 (no bias) and 1 (max bias towards max value)
  // Ensure biasFactor is clamped between 0 and 1
  const clampedBias = Math.max(0, Math.min(1, biasFactor));

  // Generate a random number, then apply the bias
  // A simple approach: skew the random number generation
  const random = Math.random();
  // Power function can create bias: lower exponent biases towards 1, higher biases towards 0
  // To bias towards higher values (max), we want the random number to be higher on average
  const biasedRandom = Math.pow(random, 1 - clampedBias * 0.8); // Adjust 0.8 to control bias strength

  // Map the biased random number (0-1) to the desired range [min, max]
  const value = min + Math.floor(biasedRandom * (max - min + 1));

  // Clamp the result just in case of floating point issues
  return Math.max(min, Math.min(max, value));
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
  IncreasedLocalPhysicalDamage: 15,
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
  IncreasedGlobalAttackSpeed: 120,
  IncreasedLocalAttackSpeed: 120,
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
export function determineRarity(itemLevel: number): ItemRarity {
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
// REMOVED OLD BASE_ITEMS structure
// const BASE_ITEMS: Record<string, Omit<BaseItem, 'id' | 'rarity'>[]> = {
//   OneHandedSword: [],
//   TwoHandedSword: [],
//   Helm: [],
//   BodyArmor: [],
//   Shield: [],
//   // TODO: Add base items for other slots (Gloves, Boots, Amulet, Ring, Belt)
//   // Ensure at least one of each desired slot type has a level 1 requirement if they should drop early.
// };

// NEW: Generic mods for two-handed weapons
const GENERIC_TWO_HANDED_WEAPON_MODS: ModifierType[] = [
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.IncreasedLocalPhysicalDamage,
  ModifierType.IncreasedPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
  ModifierType.IncreasedLocalAttackSpeed,
  ModifierType.IncreasedLocalCriticalStrikeChance,
  ModifierType.IncreasedCriticalStrikeMultiplier,
  ModifierType.IncreasedElementalDamage,
  ModifierType.IncreasedFireDamage,
  ModifierType.IncreasedColdDamage,
  ModifierType.IncreasedLightningDamage,
  ModifierType.IncreasedVoidDamage,
  ModifierType.LifeLeech,
  ModifierType.Strength,
  ModifierType.Dexterity,
  ModifierType.Intelligence,
];

// NEW: Generic mods for one-handed weapons (similar base for now)
const GENERIC_ONE_HANDED_WEAPON_MODS: ModifierType[] = [
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.IncreasedLocalPhysicalDamage,
  ModifierType.IncreasedPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
  ModifierType.IncreasedLocalAttackSpeed,
  ModifierType.IncreasedLocalCriticalStrikeChance,
  ModifierType.IncreasedCriticalStrikeMultiplier,
  ModifierType.IncreasedElementalDamage,
  ModifierType.IncreasedFireDamage,
  ModifierType.IncreasedColdDamage,
  ModifierType.IncreasedLightningDamage,
  ModifierType.IncreasedVoidDamage,
  ModifierType.LifeLeech,
  ModifierType.Strength, // Maybe exclude attributes later?
  ModifierType.Dexterity,
  ModifierType.Intelligence,
];

// EXPANDED: Add new armor mods
const GENERIC_ARMOUR_MODS: ModifierType[] = [
  // Attributes
  ModifierType.Strength, ModifierType.Dexterity, ModifierType.Intelligence,
  // Health (May be filtered later for Barrier items)
  ModifierType.MaxHealth,
  ModifierType.FlatLifeRegen,
  ModifierType.PercentLifeRegen,
  // Defenses
  ModifierType.FlatLocalArmor, ModifierType.IncreasedLocalArmor,
  ModifierType.FlatLocalEvasion, ModifierType.IncreasedLocalEvasion, // Added
  ModifierType.FlatLocalBarrier, ModifierType.IncreasedLocalBarrier, // Added
  // Resistances
  ModifierType.FireResistance, ModifierType.ColdResistance, ModifierType.LightningResistance, ModifierType.VoidResistance,
];

// Define possible mods per item type (Corrected to use Enum)
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
    ModifierType.PhysDamageTakenAsElement, ModifierType.ReducedPhysDamageTaken,
  ],
  BodyArmor: [
    ...GENERIC_ARMOUR_MODS,
    ModifierType.ThornsDamage,
    // Specific mods already defined in GENERIC list
  ],
  Shield: [
    ...GENERIC_ARMOUR_MODS,
    ModifierType.IncreasedBlockChance,
  ],
  // --- UPDATED JEWELRY MODS --- 
  Amulet: [
    // Flat Damage
    ModifierType.AddsFlatPhysicalDamage,
    ModifierType.AddsFlatFireDamage,
    ModifierType.AddsFlatColdDamage,
    ModifierType.AddsFlatLightningDamage,
    ModifierType.AddsFlatVoidDamage,
    // Health
    ModifierType.MaxHealth,
    // Thorns
    ModifierType.ThornsDamage,
    // Resistances
    ModifierType.FireResistance,
    ModifierType.ColdResistance,
    ModifierType.LightningResistance,
    ModifierType.VoidResistance,
    // Attributes
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.Intelligence,
    // Flat Defenses
    ModifierType.FlatLocalArmor,
    ModifierType.FlatLocalEvasion,
    ModifierType.FlatLocalBarrier,
  ],
  Ring: [
    // Health
    ModifierType.MaxHealth,
    // Flat Damage
    ModifierType.AddsFlatPhysicalDamage,
    ModifierType.AddsFlatFireDamage,
    ModifierType.AddsFlatColdDamage,
    ModifierType.AddsFlatLightningDamage,
    ModifierType.AddsFlatVoidDamage,
    // Resistances
    ModifierType.FireResistance,
    ModifierType.ColdResistance,
    ModifierType.LightningResistance,
    ModifierType.VoidResistance,
    // Attributes
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.Intelligence,
    // Thorns
    ModifierType.ThornsDamage,
    // Flat Defenses
    ModifierType.FlatLocalArmor,
    ModifierType.FlatLocalEvasion,
    ModifierType.FlatLocalBarrier,
    // Crit
    ModifierType.IncreasedGlobalCriticalStrikeChance,
    ModifierType.IncreasedCriticalStrikeMultiplier,
  ],
  Belt: [
    // Health
    ModifierType.MaxHealth,
    ModifierType.FlatLifeRegen,
    // Flat Defenses
    ModifierType.FlatLocalArmor,
    ModifierType.FlatLocalEvasion,
    ModifierType.FlatLocalBarrier,
    // Resistances
    ModifierType.FireResistance,
    ModifierType.ColdResistance,
    ModifierType.LightningResistance,
    ModifierType.VoidResistance,
    // Attributes
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.Intelligence,
    // Thorns
    ModifierType.ThornsDamage,
  ],
  // --- END UPDATED JEWELRY MODS --- 
  Gloves: [
    ModifierType.Strength, ModifierType.Dexterity, ModifierType.Intelligence,
    ModifierType.FlatLocalArmor, ModifierType.IncreasedLocalArmor,
    ModifierType.FlatLocalEvasion, ModifierType.IncreasedLocalEvasion,
    ModifierType.FlatLocalBarrier, ModifierType.IncreasedLocalBarrier,
    ModifierType.IncreasedGlobalAttackSpeed, // GLOBAL Atk Speed
    ModifierType.AddsFlatPhysicalDamage, // GLOBAL Flat Phys
    ModifierType.AddsFlatFireDamage, ModifierType.AddsFlatColdDamage, ModifierType.AddsFlatLightningDamage, ModifierType.AddsFlatVoidDamage, // GLOBAL Elemental Flat
    ModifierType.FireResistance, ModifierType.ColdResistance, ModifierType.LightningResistance, ModifierType.VoidResistance,
  ],
  Boots: [
    ModifierType.Strength, ModifierType.Dexterity, ModifierType.Intelligence,
    ModifierType.FlatLocalArmor, ModifierType.IncreasedLocalArmor,
    ModifierType.FlatLocalEvasion, ModifierType.IncreasedLocalEvasion,
    ModifierType.FlatLocalBarrier, ModifierType.IncreasedLocalBarrier,
    // Movement Speed (Placeholder - Need ModifierType)
    ModifierType.FireResistance, ModifierType.ColdResistance, ModifierType.LightningResistance, ModifierType.VoidResistance,
  ]
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
  IncreasedGlobalAttackSpeed: [
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
    { valueMin: 1, valueMax: 1.5 }, { valueMin: 1.6, valueMax: 2 }, { valueMin: 2.1, valueMax: 2.5 }, // Stored as 10-50, divided by 100 in calculation
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
  IncreasedLocalPhysicalDamage: [
    { valueMin: 15, valueMax: 30 }, // T1
    { valueMin: 31, valueMax: 55 }, // T2
    { valueMin: 56, valueMax: 80 }, // T3 - Using ranges from gameData.ts
  ],
  IncreasedLocalAttackSpeed: [ // Ensure ranges exist for new local
    { valueMin: 3, valueMax: 5 }, { valueMin: 6, valueMax: 8 }, { valueMin: 9, valueMax: 12 },
  ],
};

// Helper Set for Flat Damage Mod Types
const FLAT_DAMAGE_MOD_TYPES: Set<ModifierType> = new Set([
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
]);

// --- Tier definitions (for calculating bias) ---
const TIER_LEVELS = [
  { start: 1, end: 20, index: 0 },   // Tier 1
  { start: 21, end: 45, index: 1 },  // Tier 2
  { start: 46, end: 100, index: 2 }, // Tier 3
];

// Updated getItemTier to return the full tier info
const getItemTierInfo = (level: number): { start: number; end: number; index: number } => {
  return TIER_LEVELS.find(tier => level >= tier.start && level <= tier.end) ?? TIER_LEVELS[TIER_LEVELS.length - 1]; // Fallback to last tier
};

// UPDATED generateModifiers to use biased random rolls AND SCALED RANGES
export const generateModifiers = (
  baseItem: BaseItem, // <<< Use local BaseItem type
  rarity: ItemRarity,
  itemLevel: number
): Modifier[] => {

  // --- Remove unused variable --- 
  // const isOneHandedWeapon = ONE_HANDED_WEAPON_TYPES.has(baseItem.itemType);
  const isArmorBase = baseItem.baseArmor !== undefined && baseItem.baseArmor > 0;
  const isEvasionBase = baseItem.baseEvasion !== undefined && baseItem.baseEvasion > 0;
  const isBarrierBase = baseItem.baseBarrier !== undefined && baseItem.baseBarrier > 0;
  // ----------------------------------

  let possibleMods = ITEM_TYPE_MODIFIERS[baseItem.itemType] || [];

  // --- Filtering logic based on specific base type --- 
  if (isArmorBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalEvasion", "IncreasedLocalEvasion", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
    );
  } else if (isEvasionBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
    );
  } else if (isBarrierBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalEvasion", "IncreasedLocalEvasion",
        ModifierType.MaxHealth, ModifierType.FlatLifeRegen, ModifierType.PercentLifeRegen]
        .includes(mod)
    );
  }
  // ---------------------------------------------

  // --- Filter Global Phys Damage for Non-Legendary Weapons --- 
  const isWeapon = ONE_HANDED_WEAPON_TYPES.has(baseItem.itemType) || TWO_HANDED_WEAPON_TYPES.has(baseItem.itemType);
  if (isWeapon && rarity !== 'Lendário') {
    possibleMods = possibleMods.filter(modType => modType !== ModifierType.IncreasedPhysicalDamage);
  }
  // -----------------------------------------------------------

  if (!possibleMods.length) {
    return [];
  }

  let numPrefixes = 0;
  let numSuffixes = 0;

  switch (rarity) {
    case "Mágico":
      // Decide if 1 or 2 mods (e.g., 50/50 chance)
      const numTotalMods = Math.random() < 0.5 ? 1 : 2;
      if (numTotalMods === 1) {
        // If 1 mod, 50% chance prefix, 50% chance suffix
        numPrefixes = Math.random() < 0.5 ? 1 : 0;
        numSuffixes = 1 - numPrefixes;
      } else {
        // If 2 mods, always 1 prefix and 1 suffix
        numPrefixes = 1;
        numSuffixes = 1;
      }
      break;
    case "Raro":
      numPrefixes = Math.random() < 0.6 ? 2 : 1;
      numSuffixes = 3 - numPrefixes;
      break;
    case "Lendário":
      numPrefixes = Math.random() < 0.5 ? 3 : 2;
      numSuffixes = 5 - numPrefixes;
      break;
    default: return [];
  }

  // --- Get Tier Info and Calculate Bias --- 
  const tierInfo = getItemTierInfo(itemLevel);
  const tierIndex = tierInfo.index; // 0 for T1, 1 for T2, 2 for T3
  // Ensure levelProgress is calculated relative to the current tier's range
  const levelProgress = (itemLevel - tierInfo.start) / Math.max(1, tierInfo.end - tierInfo.start); 
  const biasFactor = Math.pow(Math.max(0, Math.min(1, levelProgress)), 2); // Bias towards higher end more strongly
  console.log(`[generateModifiers] Lvl: ${itemLevel}, TierIdx: ${tierIndex}, LvlProgress: ${levelProgress.toFixed(2)}, BiasFactor: ${biasFactor.toFixed(2)}`); // Log bias factor
  // -----------------------------------------

  const generatedModifiers: Modifier[] = [];
  const availablePrefixes = possibleMods.filter((mod) => PREFIX_MODIFIERS.has(mod));
  const availableSuffixes = possibleMods.filter((mod) => SUFFIX_MODIFIERS.has(mod));

  // --- Helper to get absolute max value for a mod type ---
  const getAbsoluteMaxValue = (modType: ModifierType): number | null => {
    const ranges = MODIFIER_RANGES[modType];
    if (!ranges || ranges.length === 0) return null;
    return ranges[ranges.length - 1].valueMax; // Max value from the last defined tier
  };
  // ----------------------------------------------------

  // --- UPDATED Function to handle rolling value with SCALED RANGE and BIAS ---
  const rollModifierValue = (modType: ModifierType) => { 
    const tierRanges = MODIFIER_RANGES[modType];
    if (!tierRanges || tierRanges.length === 0) {
         console.warn(`Missing ranges for mod ${modType}`);
         return; 
    }

    // Use the range for the determined tierIndex to get the BASE MINIMUM for this tier
    const currentTierRange = tierRanges[tierIndex]; 
    if (!currentTierRange) {
        console.warn(`Missing range for mod ${modType} at tier index ${tierIndex}`);
        return; 
    }
    const baseMinForTier = currentTierRange.valueMin; // Min value for the current tier

    // Get the absolute maximum value this mod can ever reach (from the highest tier)
    const absoluteMax = getAbsoluteMaxValue(modType);
    // If absoluteMax can't be determined, fallback to current tier max for safety
    const effectiveAbsoluteMax = absoluteMax ?? currentTierRange.valueMax;

    // Calculate the scaled maximum roll possible based on progress within the tier
    // ScaledMax starts at baseMinForTier and moves towards effectiveAbsoluteMax based on levelProgress
    let scaledMax = baseMinForTier + (effectiveAbsoluteMax - baseMinForTier) * levelProgress;
    scaledMax = Math.min(effectiveAbsoluteMax, Math.max(baseMinForTier, scaledMax)); // Clamp between baseMinForTier and effectiveAbsoluteMax

    // Define the final range for rolling this mod at this itemLevel
    const rollMin = baseMinForTier; // Always roll from the base minimum of the current tier
    const rollMax = Math.round(scaledMax); // Roll up to the calculated scaled maximum

    console.log(`[rollModifierValue] Mod: ${modType}, Lvl: ${itemLevel}, TierIdx: ${tierIndex}, BaseMin: ${baseMinForTier}, ScaledRollRange: [${rollMin}-${rollMax}], AbsMax: ${effectiveAbsoluteMax}, Bias: ${biasFactor.toFixed(2)}`);

    // Roll using bias within the SCALED range [rollMin, rollMax]
    if (FLAT_DAMAGE_MOD_TYPES.has(modType)) {
      const rolledMin = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      // Ensure max roll is at least the min roll
      const rolledMax = getBiasedRandomInt(rolledMin, rollMax, biasFactor);
      generatedModifiers.push({
        type: modType,
        valueMin: Math.min(rolledMin, rolledMax), // Ensure min <= max
        valueMax: Math.max(rolledMin, rolledMax)
      });
       console.log(` -> Rolled Range: [${Math.min(rolledMin, rolledMax)}-${Math.max(rolledMin, rolledMax)}]`);
    } else {
      const value = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      generatedModifiers.push({ type: modType, value });
      console.log(` -> Rolled Value: ${value}`);
    }
  };
  // --- END UPDATED Roll Function ---

  // Generate Prefixes
  for (let i = 0; i < numPrefixes && availablePrefixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availablePrefixes.length);
    const modType = availablePrefixes.splice(modIndex, 1)[0];
    rollModifierValue(modType); // Call the updated roll function
  }

  // Generate Suffixes
  for (let i = 0; i < numSuffixes && availableSuffixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availableSuffixes.length);
    const modType = availableSuffixes.splice(modIndex, 1)[0];
    rollModifierValue(modType); // Call the updated roll function
  }

  return generatedModifiers;
};

// UPDATED generateDrop function
export const generateDrop = (
  monsterLevel: number,
  forceItemType?: string, // Keep this optional parameter
  forcedRarity?: ItemRarity // <<< ADD Optional parameter for forced rarity
): EquippableItem | null => {
  // Filter eligible item types from ALL_ITEM_BASES
  const possibleBaseItems = ALL_ITEM_BASES.filter(base =>
    (base.requirements?.level ?? 0) <= monsterLevel &&
    (!forceItemType || base.itemType === forceItemType)
  );

  if (!possibleBaseItems.length) {
    console.error(`[GenerateDrop] No possible item bases found for monsterLevel ${monsterLevel} and type ${forceItemType ?? 'any'}.`);
    return null;
  }

  // Select a base
  const selectedBaseTemplate = possibleBaseItems[Math.floor(Math.random() * possibleBaseItems.length)];

  console.log(`[GenerateDrop] Selected TEMPLATE: BaseID=${selectedBaseTemplate.baseId}`); // Simplified log

  const itemLevel = monsterLevel; // Use monsterLevel for modifier tier calculation

  // <<< Use forcedRarity if provided, otherwise determine normally >>>
  const rarity = forcedRarity ?? determineRarity(itemLevel);

  // --- Generate IMPLICIT Modifier (if applicable) ---
  let implicitMod: Modifier | null = null;
  // <<< Cast selectedBaseTemplate to access implicitModifierPool >>>
  const templateWithPool = selectedBaseTemplate as BaseItemTemplate;
  if (templateWithPool.implicitModifierPool && templateWithPool.implicitModifierPool.length > 0) {
    const pool = templateWithPool.implicitModifierPool;
    const totalWeight = pool.reduce((sum: number, mod: { type: ModifierType; weight: number; }) => sum + mod.weight, 0); // <<< Add types
    let randomWeight = Math.random() * totalWeight;
    let chosenImplicitType: ModifierType | null = null;

    for (const modOption of pool) {
      randomWeight -= modOption.weight;
      if (randomWeight <= 0) {
        chosenImplicitType = modOption.type;
        break;
      }
    }

    if (chosenImplicitType) {
      const tierInfo = getItemTierInfo(itemLevel);
      const baseRange = MODIFIER_RANGES[chosenImplicitType]?.[tierInfo.index];
      if (baseRange) {
        const biasFactor = Math.max(0, Math.min(1, (itemLevel - tierInfo.start) / Math.max(1, tierInfo.end - tierInfo.start)));
        const minValue = baseRange.valueMin;
        const maxValue = baseRange.valueMax;

        if (FLAT_DAMAGE_MOD_TYPES.has(chosenImplicitType)) {
          const rolledMin = getBiasedRandomInt(minValue, maxValue, biasFactor);
          const rolledMax = getBiasedRandomInt(minValue, maxValue, biasFactor);
          implicitMod = {
            type: chosenImplicitType,
            valueMin: Math.min(rolledMin, rolledMax),
            valueMax: Math.max(rolledMin, rolledMax)
          };
        } else {
          const value = getBiasedRandomInt(minValue, maxValue, biasFactor);
          implicitMod = { type: chosenImplicitType, value };
        }
        console.log(`[GenerateDrop] Generated Implicit: ${JSON.stringify(implicitMod)}`);
      } else {
        console.warn(`[GenerateDrop] Missing range for implicit ${chosenImplicitType} at tier index ${tierInfo.index}`);
      }
    } else {
      console.warn("[GenerateDrop] Failed to choose an implicit modifier despite pool existing.");
    }
  }
  // -----------------------------------------------------

  // Generate EXPLICIT modifiers
  const modifiers = generateModifiers(
    // <<< Create a temporary BaseItem object >>>
    {
      // Copy relevant fields from selectedBaseTemplate
      baseId: selectedBaseTemplate.baseId,
      name: selectedBaseTemplate.name,
      itemType: selectedBaseTemplate.itemType,
      icon: selectedBaseTemplate.icon,
      baseArmor: selectedBaseTemplate.baseArmor,
      baseEvasion: selectedBaseTemplate.baseEvasion,
      baseBarrier: selectedBaseTemplate.baseBarrier,
      baseAttackSpeed: selectedBaseTemplate.baseAttackSpeed,
      baseCriticalStrikeChance: selectedBaseTemplate.baseCriticalStrikeChance,
      baseBlockChance: selectedBaseTemplate.baseBlockChance,
      requirements: selectedBaseTemplate.requirements,
      classification: selectedBaseTemplate.classification,
      // Add placeholder fields required by BaseItem but not BaseItemTemplate
      id: '',
      rarity: 'Normal',
    },
    rarity, // Use the determined or forced rarity
    itemLevel
  );

  // Construct the final item
  const newItem: EquippableItem = {
    ...(JSON.parse(JSON.stringify(selectedBaseTemplate))), // Deep copy the template
    id: uuidv4(),
    rarity,
    modifiers,
    implicitModifier: implicitMod, // <<< ASSIGN Generated Implicit Mod
    name: `${rarity !== 'Normal' ? `${rarity} ` : ''}${selectedBaseTemplate.name}`,
    // <<< OVERWRITE requirements >>>
    requirements: {
      ...(selectedBaseTemplate.requirements), // Keep existing STR/DEX/INT reqs
      level: monsterLevel // Set level requirement to monster level
    }
  };

  console.log(`[GenerateDrop] Generated Item Details: ID=${newItem.id}, Name=${newItem.name}, BaseID=${newItem.baseId}, LvlReq=${newItem.requirements?.level}`);

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
  // Revert display names to Portuguese, incorporating Local/Global distinction
  AddsFlatPhysicalDamage: "Adiciona Dano Físico",
  IncreasedPhysicalDamage: "% Dano Físico Global Aumentado", // GLOBAL
  IncreasedLocalPhysicalDamage: "% Dano Físico Aumentado", // LOCAL
  AddsFlatFireDamage: "Adiciona Dano de Fogo",
  AddsFlatColdDamage: "Adiciona Dano de Frio",
  AddsFlatLightningDamage: "Adiciona Dano de Raio",
  AddsFlatVoidDamage: "Adiciona Dano de Vazio",
  IncreasedGlobalAttackSpeed: "% Velocidade de Ataque Global Aumentada", // GLOBAL
  IncreasedLocalAttackSpeed: "% Velocidade de Ataque Aumentada", // LOCAL
  IncreasedLocalCriticalStrikeChance: "% Chance de Crítico Aumentada", // LOCAL
  IncreasedGlobalCriticalStrikeChance: "% Chance de Crítico Global Aumentada", // GLOBAL
  IncreasedCriticalStrikeMultiplier: "% Multiplicador de Dano Crítico", // Implicitly Global
  IncreasedElementalDamage: "% Dano Elemental Aumentado", // Implicitly Global
  IncreasedFireDamage: "% Dano de Fogo Aumentado", // Implicitly Global
  IncreasedColdDamage: "% Dano de Frio Aumentado", // Implicitly Global
  IncreasedLightningDamage: "% Dano de Raio Aumentado", // Implicitly Global
  IncreasedVoidDamage: "% Dano de Vazio Aumentado", // Implicitly Global
  LifeLeech: "% do Dano Físico de Ataque Roubado como Vida",
  Strength: "Força",
  Dexterity: "Destreza",
  Intelligence: "Inteligência",
  MaxHealth: "Vida Máxima",
  IncreasedLocalArmor: "% Armadura Aumentada",
  FlatLocalArmor: "Adiciona Armadura",
  ThornsDamage: "Dano Físico Refletido (Corpo a Corpo)",
  FireResistance: "% Resistência a Fogo",
  ColdResistance: "% Resistência a Frio",
  LightningResistance: "% Resistência a Raio",
  VoidResistance: "% Resistência a Vazio",
  FlatLifeRegen: "Vida Regenerada por segundo",
  PercentLifeRegen: "% Vida Regenerada por segundo",
  PhysDamageTakenAsElement: "% do Dano Físico Recebido como Elemental",
  ReducedPhysDamageTaken: "% Redução do Dano Físico Recebido",
  FlatLocalEvasion: "Adiciona Evasão",
  IncreasedLocalEvasion: "% Evasão Aumentada",
  FlatLocalBarrier: "Adiciona Barreira",
  IncreasedLocalBarrier: "% Barreira Aumentada",
  IncreasedBlockChance: "% Chance de Bloqueio Aumentada",
};

// Update getModifierText (Restored and Fixed for optional value)
export const getModifierText = (mod: Modifier): string => {
  const name = MODIFIER_DISPLAY_NAMES[mod.type] || mod.type;

  // Format Ranges (Flat Damage)
  if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
    // Example: "Adiciona 1-5 Dano Físico"
    const nameWithoutPrefix = name.replace("Adiciona ", "");
    return `${nameWithoutPrefix}: ${mod.valueMin}-${mod.valueMax}`;
  }

  // Ensure value exists for single-value mods
  const value = mod.value !== undefined ? mod.value : "?";

  // Format Percentages
  if (name.includes("%") || name.includes("Roubado") || name.includes("Resistência") || name.includes("Chance") || name.includes("Multiplicador") || name.includes("Redução")) {
    let displayValue = value;
    // Use const for variables that are not reassigned
    const suffix = "%";
    const prefix = "+";
    const namePart = name.replace("% ", "").replace("%", "").trim(); // Remove % placeholder and trim

    if (mod.type === ModifierType.LifeLeech) {
      displayValue = value !== "?" ? (Number(value) / 10).toFixed(1) : "?";
      // Example: "0.5% do Dano Físico de Ataque Roubado como Vida"
      return `${displayValue}% ${namePart}`;
    }
    if (mod.type === ModifierType.PercentLifeRegen) {
      displayValue = value !== "?" ? Number(value).toFixed(1) : "?";
      // Example: "1.5% Vida Regenerada por segundo"
      return `${displayValue}% ${namePart}`;
    }
    if (mod.type === ModifierType.PhysDamageTakenAsElement || mod.type === ModifierType.ReducedPhysDamageTaken) {
      // Example: "10% do Dano Físico Recebido como Elemental"
      return `${value}% ${namePart}`;
    }
    // General percentage format
    // Example: "+10% Dano Físico Global Aumentado"
    // Example: "+5% Chance de Bloqueio Aumentada"
    return `${prefix}${value}${suffix} ${namePart}`;
  }

  // Format Flat Values (Attributes, Flat Regen, Thorns, etc.)
  // Example: "+5 Força"
  // Example: "+10 Vida Regenerada por segundo"
  // Example: "5 Dano Físico Refletido (Corpo a Corpo)"

  // --- CORRECTED LOGIC --- 
  if (mod.type === ModifierType.FlatLifeRegen) {
    // Flat Regen: Use value and the full display name (already includes 'por segundo')
    return `${value} ${MODIFIER_DISPLAY_NAMES[mod.type]}`;
  } else if (mod.type === ModifierType.ThornsDamage) {
    // Thorns: Use value and the full display name (no prefix)
    return `${value} ${MODIFIER_DISPLAY_NAMES[mod.type]}`;
  } else {
    // Other Flat Values (Attributes etc.): Add '+' prefix
    const prefix = "+";
    const namePart = name;
    return `${prefix}${value} ${namePart}`;
  }
  // --- END CORRECTED LOGIC ---
};
// --- END RESTORED HELPER FUNCTIONS ---

// --- ADD getEquipmentSlotForItem Helper Function --- 
export const getEquipmentSlotForItem = (
  item: EquippableItem
): EquipmentSlotId | null => {
  // Primeiro, checa tipos específicos
  if (item.itemType === "Shield") return "weapon2";
  if (item.itemType === "Helm") return "helm";
  if (item.itemType === "BodyArmor") return "bodyArmor";
  if (item.itemType === "Gloves") return "gloves";
  if (item.itemType === "Boots") return "boots";
  if (item.itemType === "Belt") return "belt";
  if (item.itemType === "Amulet") return "amulet";
  if (item.itemType === "Ring") return "ring1"; // Simplificação: sempre tenta o anel 1 primeiro

  // Depois, checa categorias de armas
  if (ONE_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (TWO_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (OFF_HAND_TYPES.has(item.itemType)) return "weapon2";

  // Fallback se nenhum tipo corresponder
  console.warn(
    `Cannot determine equipment slot for item type: ${item.itemType}`
  );
  return null;
};
// -------------------------------------------------

// --- NEW: calculateSellPrice (Moved and Enhanced) ---
export const calculateSellPrice = (item: EquippableItem): number => {
  let price = 1; // Base price for Normal
  switch (item.rarity) {
    case "Mágico": price = 3; break;
    case "Raro": price = 7; break;
    case "Lendário": price = 15; break;
  }
  // Add bonus per modifier
  price += (item.modifiers?.length ?? 0) * 1; 
  // <<< ADD Level Scaling Bonus >>>
  const itemLevel = item.requirements?.level ?? 0;
  const levelBonus = Math.floor(itemLevel / 5); // +1 Ruby for every 5 levels
  price += levelBonus;
  console.log(`[calculateSellPrice] Item: ${item.name}, Rarity: ${item.rarity}, Mods: ${item.modifiers?.length ?? 0}, Lvl: ${itemLevel}, RarityPrice: ${price-levelBonus-(item.modifiers?.length ?? 0)}, ModBonus: ${item.modifiers?.length ?? 0}, LvlBonus: ${levelBonus}, FinalPrice: ${price}`);
  return Math.max(1, price); // Ensure minimum price of 1
};
// -----------------------------------------------------