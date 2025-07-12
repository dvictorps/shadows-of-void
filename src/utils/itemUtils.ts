import { v4 as uuidv4 } from 'uuid';
import {
  EquippableItem,
  Modifier,
  ModifierType,
  ItemRarity,
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
import { MODIFIER_DISPLAY_NAMES } from '../types/gameData';

// --- Define ValueRange Interface --- ADDED
export interface ValueRange {
  valueMin: number;
  valueMax: number;
}
// -----------------------------------

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

// --- Helper Sets for Modifiers (Keep PRIVATE unless needed elsewhere) ---
const PREFIX_MODIFIERS: Set<ModifierType> = new Set([
  ModifierType.IncreasedPhysicalDamage,
  ModifierType.IncreasedLocalPhysicalDamage,
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
  ModifierType.MaxHealth,
  ModifierType.MaxMana, // <<< NOVO PREFIXO
  ModifierType.FlatLocalArmor,
  ModifierType.IncreasedLocalArmor,
  ModifierType.FlatLocalEvasion,
  ModifierType.IncreasedLocalEvasion,
  ModifierType.FlatLocalBarrier,
  ModifierType.IncreasedLocalBarrier,
  ModifierType.ThornsDamage,
]);

const SUFFIX_MODIFIERS: Set<ModifierType> = new Set([
  ModifierType.IncreasedGlobalAttackSpeed,
  ModifierType.IncreasedLocalAttackSpeed,
  ModifierType.IncreasedLocalCriticalStrikeChance,
  ModifierType.IncreasedGlobalCriticalStrikeChance,
  ModifierType.IncreasedCriticalStrikeMultiplier,
  ModifierType.IncreasedBlockChance,
  ModifierType.IncreasedElementalDamage,
  ModifierType.IncreasedFireDamage,
  ModifierType.IncreasedColdDamage,
  ModifierType.IncreasedLightningDamage,
  ModifierType.IncreasedVoidDamage,
  ModifierType.LifeLeech,
  ModifierType.FireResistance,
  ModifierType.ColdResistance,
  ModifierType.LightningResistance,
  ModifierType.VoidResistance,
  ModifierType.FlatLifeRegen,
  ModifierType.PercentLifeRegen,
  ModifierType.FlatManaRegen, // <<< NOVO SUFIXO
  ModifierType.PercentManaRegen, // <<< NOVO SUFIXO
  ModifierType.ManaShield, // <<< NOVO SUFIXO DE CAPACETE
  ModifierType.PhysDamageTakenAsElement,
  ModifierType.ReducedPhysDamageTaken,
  ModifierType.IncreasedMovementSpeed,
  ModifierType.Strength,
  ModifierType.Dexterity,
  ModifierType.Intelligence,
]);
// --- Export the sets for testing --- <<< ADD EXPORT
export { PREFIX_MODIFIERS, SUFFIX_MODIFIERS };

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
  "Staff", // Cajados são sempre duas mãos
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
  "Tome", // Novo tipo de offhand arcano
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
  AddsFlatSpellFireDamage: 31,
  AddsFlatSpellColdDamage: 41,
  AddsFlatSpellLightningDamage: 51,
  AddsFlatSpellVoidDamage: 61,
  IncreasedSpellDamage: 155,
  IncreasedCastSpeed: 156,
  IncreasedSpellCriticalStrikeChance: 157,
  MaxHealth: 70,
  MaxMana: 71, // <<< NOVO
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
  FlatManaRegen: 216, // <<< NOVO
  PercentManaRegen: 217, // <<< NOVO
  ManaShield: 218, // Após PercentManaRegen
  PhysDamageTakenAsElement: 220,
  ReducedPhysDamageTaken: 230,
  // Attributes last
  IncreasedMovementSpeed: 235,
  Strength: 240,
  Dexterity: 250,
  Intelligence: 260,
  ReducedLifeLeechRecovery: 52,
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

// Definir mods possíveis para Tome: igual ao Shield, mas com mais peso para mods de barreira/cast
const GENERIC_TOME_MODS: ModifierType[] = [
  // Mods de barreira e cast com mais peso
  ModifierType.FlatLocalBarrier,
  ModifierType.IncreasedLocalBarrier,
  ModifierType.IncreasedCastSpeed,
  ModifierType.IncreasedSpellDamage,
  // Restante igual ao escudo
  ...GENERIC_ARMOUR_MODS,
  ModifierType.IncreasedBlockChance,
];

// Define possible mods per item type (Corrected to use Enum)
const ITEM_TYPE_MODIFIERS: Record<string, ModifierType[]> = {
  OneHandedSword: [
    ...GENERIC_ONE_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 1H Swords ONLY here
  ],
  OneHandedAxe: [
    ...GENERIC_ONE_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 1H Axes ONLY here (e.g., more Strength?)
  ],
  TwoHandedSword: [
    ...GENERIC_TWO_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 2H Swords ONLY here
  ],
  TwoHandedAxe: [
    ...GENERIC_TWO_HANDED_WEAPON_MODS,
    // Add any mods SPECIFIC to 2H Axes ONLY here (e.g., more Strength?)
  ],
  Helm: [
    ...GENERIC_ARMOUR_MODS,
    ModifierType.PhysDamageTakenAsElement, ModifierType.ReducedPhysDamageTaken,
    ModifierType.ManaShield, // <<< ADICIONAR À POOL DE CAPACETE
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
  Tome: [
    ...GENERIC_TOME_MODS.filter(mod => mod !== ModifierType.LifeLeech),
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
    // Movement & Flat Defenses
    ModifierType.IncreasedMovementSpeed,
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
    // Movement & Flat Defenses
    ModifierType.IncreasedMovementSpeed,
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
    // Movement & Flat Defenses
    ModifierType.IncreasedMovementSpeed,
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
    ModifierType.IncreasedGlobalAttackSpeed, // <<< ENSURE THIS IS PRESENT
    ModifierType.AddsFlatPhysicalDamage, // <<< ADD FLAT DAMAGE
    ModifierType.AddsFlatFireDamage, ModifierType.AddsFlatColdDamage, ModifierType.AddsFlatLightningDamage, ModifierType.AddsFlatVoidDamage, // <<< ADD FLAT DAMAGE
    ModifierType.FireResistance, ModifierType.ColdResistance, ModifierType.LightningResistance, ModifierType.VoidResistance,
    ModifierType.MaxHealth, // <<< ADD MaxHealth to gloves
    ModifierType.IncreasedMovementSpeed, // <<< NEW: Make MS mod more common on gloves
  ],
  Boots: [
    ModifierType.Strength, ModifierType.Dexterity, ModifierType.Intelligence,
    ModifierType.FlatLocalArmor, ModifierType.IncreasedLocalArmor,
    ModifierType.FlatLocalEvasion, ModifierType.IncreasedLocalEvasion,
    ModifierType.FlatLocalBarrier, ModifierType.IncreasedLocalBarrier,
    ModifierType.IncreasedMovementSpeed, // <<< ADD MOVEMENT SPEED
    ModifierType.FireResistance, ModifierType.ColdResistance, ModifierType.LightningResistance, ModifierType.VoidResistance,
    ModifierType.MaxHealth, // <<< ADD MaxHealth to boots
  ],
  // NOVO: Staff (Cajado)
  Staff: [
    ModifierType.AddsFlatSpellFireDamage,
    ModifierType.AddsFlatSpellColdDamage,
    ModifierType.AddsFlatSpellLightningDamage,
    ModifierType.AddsFlatSpellVoidDamage,
    ModifierType.IncreasedSpellDamage,
    ModifierType.IncreasedCastSpeed,
    ModifierType.IncreasedSpellCriticalStrikeChance,
    ModifierType.MaxMana,
    ModifierType.FlatManaRegen,
    ModifierType.PercentManaRegen,
    ModifierType.Intelligence,
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.IncreasedElementalDamage,
    ModifierType.IncreasedFireDamage,
    ModifierType.IncreasedColdDamage,
    ModifierType.IncreasedLightningDamage,
    ModifierType.IncreasedVoidDamage,
  ],
  // NOVO: Wand (Varinha)
  Wand: [
    ModifierType.AddsFlatSpellFireDamage,
    ModifierType.AddsFlatSpellColdDamage,
    ModifierType.AddsFlatSpellLightningDamage,
    ModifierType.AddsFlatSpellVoidDamage,
    ModifierType.IncreasedSpellDamage,
    ModifierType.IncreasedCastSpeed,
    ModifierType.IncreasedSpellCriticalStrikeChance,
    ModifierType.MaxMana,
    ModifierType.FlatManaRegen,
    ModifierType.PercentManaRegen,
    ModifierType.Intelligence,
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.IncreasedElementalDamage,
    ModifierType.IncreasedFireDamage,
    ModifierType.IncreasedColdDamage,
    ModifierType.IncreasedLightningDamage,
    ModifierType.IncreasedVoidDamage,
  ],
  // NOVO: Sceptre (Cetro) - se existir
  Sceptre: [
    ModifierType.AddsFlatSpellFireDamage,
    ModifierType.AddsFlatSpellColdDamage,
    ModifierType.AddsFlatSpellLightningDamage,
    ModifierType.AddsFlatSpellVoidDamage,
    ModifierType.IncreasedSpellDamage,
    ModifierType.IncreasedCastSpeed,
    ModifierType.IncreasedSpellCriticalStrikeChance,
    ModifierType.MaxMana,
    ModifierType.FlatManaRegen,
    ModifierType.PercentManaRegen,
    ModifierType.Intelligence,
    ModifierType.Strength,
    ModifierType.Dexterity,
    ModifierType.IncreasedElementalDamage,
    ModifierType.IncreasedFireDamage,
    ModifierType.IncreasedColdDamage,
    ModifierType.IncreasedLightningDamage,
    ModifierType.IncreasedVoidDamage,
  ],
};

// Define value ranges per modifier type and tier (T1, T2, T3)
// FULL DEFINITION
export const MODIFIER_RANGES: { [key in ModifierType]?: ValueRange[] } = {
  // Attributes
  [ModifierType.Strength]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],
  [ModifierType.Dexterity]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],
  [ModifierType.Intelligence]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],

  // Health
  [ModifierType.MaxHealth]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 30 }, // T4
    { valueMin: 31, valueMax: 40 }, // T3
    { valueMin: 41, valueMax: 50 }, // T2
    { valueMin: 51, valueMax: 60 }, // T1
  ],
  [ModifierType.FlatLifeRegen]: [
    { valueMin: 0.5, valueMax: 1.0 }, // T6
    { valueMin: 1.1, valueMax: 2.0 }, // T5
    { valueMin: 2.1, valueMax: 3.0 }, // T4
    { valueMin: 3.1, valueMax: 4.0 }, // T3
    { valueMin: 4.1, valueMax: 5.0 }, // T2
    { valueMin: 5.1, valueMax: 6.0 }, // T1
  ],
  [ModifierType.PercentLifeRegen]: [
    { valueMin: 0.1, valueMax: 0.2 }, // T6
    { valueMin: 0.3, valueMax: 0.4 }, // T5
    { valueMin: 0.5, valueMax: 0.6 }, // T4
    { valueMin: 0.7, valueMax: 0.8 }, // T3
    { valueMin: 0.9, valueMax: 1.0 }, // T2
    { valueMin: 1.1, valueMax: 1.2 }, // T1
  ],

  // Resistances
  [ModifierType.FireResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.ColdResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.LightningResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.VoidResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],

  // Local Defenses
  [ModifierType.FlatLocalArmor]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 35 }, // T4
    { valueMin: 36, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 70 }, // T2
    { valueMin: 71, valueMax: 90 }, // T1
  ],
  [ModifierType.IncreasedLocalArmor]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],
  [ModifierType.FlatLocalEvasion]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 35 }, // T4
    { valueMin: 36, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 70 }, // T2
    { valueMin: 71, valueMax: 90 }, // T1
  ],
  [ModifierType.IncreasedLocalEvasion]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],
  [ModifierType.FlatLocalBarrier]: [
    { valueMin: 3, valueMax: 6 }, // T6
    { valueMin: 7, valueMax: 12 }, // T5
    { valueMin: 13, valueMax: 18 }, // T4
    { valueMin: 19, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 36 }, // T1
  ],
  [ModifierType.IncreasedLocalBarrier]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],

  // Physical Damage (Local & Global)
  [ModifierType.AddsFlatPhysicalDamage]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 3, valueMax: 4 }, // T5
    { valueMin: 5, valueMax: 7 }, // T4
    { valueMin: 8, valueMax: 10 }, // T3
    { valueMin: 11, valueMax: 13 }, // T2
    { valueMin: 14, valueMax: 16 }, // T1
  ],
  [ModifierType.IncreasedLocalPhysicalDamage]: [
    { valueMin: 10, valueMax: 19 }, // T6
    { valueMin: 20, valueMax: 29 }, // T5
    { valueMin: 30, valueMax: 39 }, // T4
    { valueMin: 40, valueMax: 49 }, // T3
    { valueMin: 50, valueMax: 59 }, // T2
    { valueMin: 60, valueMax: 70 }, // T1
  ],
  [ModifierType.IncreasedPhysicalDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Elemental Damage (Flat & Global)
  [ModifierType.AddsFlatFireDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatColdDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatLightningDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatVoidDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.IncreasedElementalDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedFireDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedColdDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedLightningDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedVoidDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Attack Speed (Local & Global)
  [ModifierType.IncreasedLocalAttackSpeed]: [
    { valueMin: 3, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 8 }, // T5
    { valueMin: 9, valueMax: 11 }, // T4
    { valueMin: 12, valueMax: 14 }, // T3
    { valueMin: 15, valueMax: 17 }, // T2
    { valueMin: 18, valueMax: 20 }, // T1
  ],
  [ModifierType.IncreasedGlobalAttackSpeed]: [
    { valueMin: 2, valueMax: 4 }, // T6
    { valueMin: 5, valueMax: 7 }, // T5
    { valueMin: 8, valueMax: 10 }, // T4
    { valueMin: 11, valueMax: 13 }, // T3
    { valueMin: 14, valueMax: 16 }, // T2
    { valueMin: 17, valueMax: 19 }, // T1
  ],

  // Critical Strike (Local & Global)
  [ModifierType.IncreasedLocalCriticalStrikeChance]: [
    { valueMin: 10, valueMax: 19 }, // T6
    { valueMin: 20, valueMax: 29 }, // T5
    { valueMin: 30, valueMax: 39 }, // T4
    { valueMin: 40, valueMax: 49 }, // T3
    { valueMin: 50, valueMax: 59 }, // T2
    { valueMin: 60, valueMax: 70 }, // T1
  ],
  [ModifierType.IncreasedGlobalCriticalStrikeChance]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedCriticalStrikeMultiplier]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Movement Speed
  [ModifierType.IncreasedMovementSpeed]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],

  // Other Utility
  [ModifierType.IncreasedBlockChance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.LifeLeech]: [
    { valueMin: 0.1, valueMax: 0.5 }, // T6
    { valueMin: 0.6, valueMax: 1.0 }, // T5
    { valueMin: 1.1, valueMax: 1.5 }, // T4
    { valueMin: 1.6, valueMax: 2.0 }, // T3
    { valueMin: 2.1, valueMax: 2.5 }, // T2
    { valueMin: 2.6, valueMax: 3.0 }, // T1
  ],
  [ModifierType.ThornsDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.ReducedPhysDamageTaken]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 3, valueMax: 4 }, // T5
    { valueMin: 5, valueMax: 6 }, // T4
    { valueMin: 7, valueMax: 8 }, // T3
    { valueMin: 9, valueMax: 10 }, // T2
    { valueMin: 11, valueMax: 12 }, // T1
  ],
  [ModifierType.PhysDamageTakenAsElement]: [ // Assuming 'Element' refers to a specific type like Fire, Cold, etc.
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.MaxMana]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 30 }, // T4
    { valueMin: 31, valueMax: 40 }, // T3
    { valueMin: 41, valueMax: 50 }, // T2
    { valueMin: 51, valueMax: 60 }, // T1
  ],
  [ModifierType.FlatManaRegen]: [
    { valueMin: 0.2, valueMax: 0.5 }, // T6
    { valueMin: 0.6, valueMax: 1.0 }, // T5
    { valueMin: 1.1, valueMax: 1.5 }, // T4
    { valueMin: 1.6, valueMax: 2.0 }, // T3
    { valueMin: 2.1, valueMax: 2.5 }, // T2
    { valueMin: 2.6, valueMax: 3.0 }, // T1
  ],
  [ModifierType.PercentManaRegen]: [
    { valueMin: 0.5, valueMax: 1.5 }, // T6
    { valueMin: 1.6, valueMax: 2.5 }, // T5
    { valueMin: 2.6, valueMax: 4.0 }, // T4
    { valueMin: 4.1, valueMax: 6.0 }, // T3
    { valueMin: 6.1, valueMax: 8.0 }, // T2
    { valueMin: 8.1, valueMax: 10.0 }, // T1 (LIMITADO A 10%)
  ],
  [ModifierType.ManaShield]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 2.1, valueMax: 4 }, // T5
    { valueMin: 4.1, valueMax: 6 }, // T4
    { valueMin: 6.1, valueMax: 7 }, // T3
    { valueMin: 7.1, valueMax: 9 }, // T2
    { valueMin: 9.1, valueMax: 10 }, // T1 (LIMITADO A 10%)
  ],
  [ModifierType.ReducedLifeLeechRecovery]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
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
      const numTotalModsMagic = Math.random() < 0.5 ? 1 : 2;
      if (numTotalModsMagic === 1) {
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
      // New logic: 1-3 prefixes AND 1-3 suffixes randomly
      let numPrefixesRaro = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
      let numSuffixesRaro = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
      let totalModsRaro = numPrefixesRaro + numSuffixesRaro;

      // Ensure minimum of 3 mods total
      while (totalModsRaro < 3) {
        // Randomly try to add a prefix or suffix if not already maxed out
        const canAddPrefix = numPrefixesRaro < 3;
        const canAddSuffix = numSuffixesRaro < 3;
        
        if (!canAddPrefix && !canAddSuffix) {
           // Should theoretically not happen if totalModsRaro < 3, but safety break.
           break; 
        }

        const addPrefixAttempt = Math.random() < 0.5; // 50% chance to try prefix first

        if (addPrefixAttempt && canAddPrefix) {
          numPrefixesRaro++;
          totalModsRaro++;
        } else if (canAddSuffix) { // Try suffix if prefix attempt failed or wasn't chosen
          numSuffixesRaro++;
          totalModsRaro++;
        } else if (canAddPrefix) { // Fallback: add prefix if suffix couldn't be added
           numPrefixesRaro++;
           totalModsRaro++;
        }
      }
      // Assign final calculated counts
      numPrefixes = numPrefixesRaro;
      numSuffixes = numSuffixesRaro;
      break;
    case "Lendário":
      // Old logic: exactly 5 mods
      // numPrefixes = Math.random() < 0.5 ? 3 : 2;
      // numSuffixes = 5 - numPrefixes;
      // New logic for Legendary (e.g., always 3 prefixes, 3 suffixes? or keep 5?)
      // Let's keep Legendary at 5 mods for now, maybe 3p/2s or 2p/3s?
      // For consistency with max Rare, let's try 5-6 mods for Legendary
      const numTotalModsLegendary = 5 + Math.floor(Math.random() * 2); // 5 or 6
      if (numTotalModsLegendary === 5) {
          numPrefixes = Math.random() < 0.5 ? 3 : 2; // 3p/2s or 2p/3s
          numSuffixes = 5 - numPrefixes;
      } else { // 6 mods
          numPrefixes = 3;
          numSuffixes = 3;
      }
      break;
    default: return [];
  }

  // --- Get Tier Info and Calculate Bias --- 
  const tierInfo = getItemTierInfo(itemLevel);
  const tierIndex = tierInfo.index; // 0 for T1, 1 for T2, 2 for T3
  // Ensure levelProgress is calculated relative to the current tier's range
  const levelProgress = (itemLevel - tierInfo.start) / Math.max(1, tierInfo.end - tierInfo.start); 
  const biasFactor = Math.pow(Math.max(0, Math.min(1, levelProgress)), 2); // Bias towards higher end more strongly
  // -----------------------------------------

  // --- PESOS ESPECIAIS PARA ESCUDOS DE BARREIRA ---
  // Se for um escudo com baseBarrier, aumentar chance de mods de barreira/cast
  const generatedModifiers: Modifier[] = [];
  let modWeightMap: Record<string, number> | undefined;
  if ((baseItem.itemType === 'Shield' && isBarrierBase) || baseItem.itemType === 'Tome') {
    modWeightMap = {};
    for (const mod of possibleMods) {
      if (
        mod === ModifierType.FlatLocalBarrier ||
        mod === ModifierType.IncreasedLocalBarrier ||
        mod === ModifierType.IncreasedCastSpeed ||
        mod === ModifierType.IncreasedSpellDamage
      ) {
        modWeightMap[mod] = 4; // Peso maior
      } else {
        modWeightMap[mod] = 1;
      }
    }
  }
  // Se for escudo de barreira, usar pesos diferenciados
  let availablePrefixes: ModifierType[] = [];
  let availableSuffixes: ModifierType[] = [];
  if (((baseItem.itemType === 'Shield' && isBarrierBase) || baseItem.itemType === 'Tome') && modWeightMap) {
    // Replicar mods conforme peso
    for (const mod of possibleMods) {
      const weight = modWeightMap[mod] || 1;
      if (PREFIX_MODIFIERS.has(mod)) {
        for (let i = 0; i < weight; i++) availablePrefixes.push(mod);
      }
      if (SUFFIX_MODIFIERS.has(mod)) {
        for (let i = 0; i < weight; i++) availableSuffixes.push(mod);
      }
    }
  } else {
    availablePrefixes = possibleMods.filter((mod) => PREFIX_MODIFIERS.has(mod));
    availableSuffixes = possibleMods.filter((mod) => SUFFIX_MODIFIERS.has(mod));
  }

  // --- UPDATED Function to handle rolling value with SCALED RANGE and BIAS ---
  const rollModifierValue = (modType: ModifierType) => { 
    const tierRanges = MODIFIER_RANGES[modType];
    if (!tierRanges || tierRanges.length === 0) {
         return; 
    }

    // Use the range for the determined tierIndex to get the BASE MINIMUM for this tier
    const currentTierRange = tierRanges[tierIndex]; 
    if (!currentTierRange) {
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
    } else {
      let value = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      // --- Safeguard for Life Leech --- 
      if (modType === ModifierType.LifeLeech && value < 1) {
        value = 1; 
      }
      // --- End Safeguard ---
      generatedModifiers.push({ type: modType, value });
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
  forcedRarity?: ItemRarity, // <<< ADD Optional parameter for forced rarity
  forcedBossId?: string // <<< NOVO: id do boss que está forçando o drop
): EquippableItem | null => {
  // Filter eligible item types from ALL_ITEM_BASES
  const possibleBaseItems = ALL_ITEM_BASES.filter(base =>
    base.baseId !== 'starter_2h_sword_base' &&
    base.minLevel <= monsterLevel && // Check min drop level
    (base.maxLevel === undefined || monsterLevel <= base.maxLevel) && // Check max drop level (if defined)
    (!forceItemType || base.itemType === forceItemType) &&
    // Excluir bases únicas exclusivas de boss do drop normal
    (!base.bossDropOnly)
  );

  // --- Lógica especial para drop único de boss ---
  // Se for drop forçado de boss, buscar a base correta
  if (forcedRarity === 'Único' && forcedBossId) {
    const uniqueBase = ALL_ITEM_BASES.find(
      b => b.bossDropOnly && b.bossDropId === forcedBossId && b.baseId === forceItemType
    );
    if (uniqueBase) {
      return {
        ...(JSON.parse(JSON.stringify(uniqueBase))),
        id: uuidv4(),
        rarity: 'Único',
        modifiers: [
          { type: ModifierType.LifeLeech, value: 20 },
          { type: ModifierType.ReducedLifeLeechRecovery, value: 20 },
        ],
        implicitModifier: null,
        name: uniqueBase.name,
        requirements: {
          ...(uniqueBase.requirements),
          level: monsterLevel
        },
        uniqueText: uniqueBase.uniqueText,
      };
    }
    // Se não achou, retorna null
    return null;
  }
  // -----------------------------------------------------

  if (!possibleBaseItems.length) {
    return null;
  }

  // Select a base
  const selectedBaseTemplate = possibleBaseItems[Math.floor(Math.random() * possibleBaseItems.length)];

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
    case "Único":
      return "border-orange-500";
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
    case "Único":
      return "text-orange-400";
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
    case "Único":
      return "[box-shadow:inset_0_0_10px_2px_rgba(251,146,60,0.7)]"; // Orange glow
    default:
      return ""; // Branco
  }
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

  // --- Correção para mods locais de defesa ---
  if (mod.type === ModifierType.IncreasedLocalArmor) {
    return `+${value}% Armadura Aumentada`;
  }
  if (mod.type === ModifierType.IncreasedLocalEvasion) {
    return `+${value}% Evasão Aumentada`;
  }
  if (mod.type === ModifierType.IncreasedLocalBarrier) {
    return `+${value}% Barreira Aumentada`;
  }
  if (mod.type === ModifierType.IncreasedLocalPhysicalDamage) {
    return `+${value}% Dano Físico Aumentado`;
  }
  if (mod.type === ModifierType.FlatLocalArmor) {
    return `+${value} Armadura`;
  }
  if (mod.type === ModifierType.FlatLocalEvasion) {
    return `+${value} Evasão`;
  }
  if (mod.type === ModifierType.FlatLocalBarrier) {
    return `+${value} Barreira`;
  }
  // Padronizar todos os mods 'Increased' como incremento (%)
  if (mod.type.includes('Increased')) {
    // Pega o nome do display, remove 'Local' e 'Global' se houver
    const displayName = (MODIFIER_DISPLAY_NAMES[mod.type] || mod.type)
      .replace('Local', '').replace('Global', '').replace(/\s+/g, ' ').trim();
    return `+${value}% ${displayName}`;
  }

  // --- NOVO: Regeneração de Vida/Mana Flat e % ---
  if (mod.type === ModifierType.FlatLifeRegen || mod.type === ModifierType.FlatManaRegen) {
    return `${value} ${name}`;
  }
  if (mod.type === ModifierType.PercentLifeRegen || mod.type === ModifierType.PercentManaRegen) {
    return `${value}% ${name}`;
  }

  // Format Percentages
  if (name.includes("%") || name.includes("Roubado") || name.includes("Resistência") || name.includes("Chance") || name.includes("Multiplicador") || name.includes("Redução") || name.includes("Dano de Fogo") || name.includes("Dano de Gelo") || name.includes("Dano de Raios") || name.includes("Dano de Vazio")) {
    let displayValue = value;
    const isNegative = typeof value === 'number' && value < 0;
    const absValue = isNegative ? Math.abs(Number(value)) : value;
    const suffix = "%";
    const prefix = isNegative ? "-" : "+";
    const namePart = name.replace("% ", "").replace("%", "").trim();
    if (mod.type === ModifierType.LifeLeech) {
      displayValue = value !== "?" ? (Number(value) / 10).toFixed(1) : "?";
      return `${displayValue}% ${namePart}`;
    }
    if (mod.type === ModifierType.PhysDamageTakenAsElement || mod.type === ModifierType.ReducedPhysDamageTaken) {
      const isNegative = typeof value === 'number' && value < 0;
      const absValue = isNegative ? Math.abs(Number(value)) : value;
      const prefix = isNegative ? '-' : '+';
      return `${prefix}${absValue}% ${namePart}`;
    }
    // --- NOVO: wording para mods negativos de dano elemental ---
    if (isNegative && (mod.type === ModifierType.IncreasedFireDamage || mod.type === ModifierType.IncreasedColdDamage || mod.type === ModifierType.IncreasedLightningDamage || mod.type === ModifierType.IncreasedVoidDamage)) {
      return `-${absValue}% ${namePart} Reduzido`;
    }
    // General percentage format
    return `${prefix}${absValue}${suffix} ${namePart}`;
  }

  // Format Flat Values (Attributes, Flat Regen, Thorns, etc.)
  // Example: "+5 Força"
  // Example: "+10 Vida Regenerada por segundo"
  // Example: "5 Dano Físico Refletido (Corpo a Corpo)"

  // --- CORRECTED LOGIC --- 
  if (mod.type === ModifierType.ThornsDamage) {
    // Thorns: Use value and the full display name (no prefix)
    return `${value} ${MODIFIER_DISPLAY_NAMES[mod.type]}`;
  } else if (mod.type === "ReducedLifeLeechRecovery") {
    return `-${mod.value ?? 0}% Recuperação de Vida por Roubo`;
  }
  else {
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
  if (item.itemType === "Tome") return "weapon2"; // Adiciona Tome ao slot weapon2

  // Depois, checa categorias de armas
  if (ONE_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (TWO_HANDED_WEAPON_TYPES.has(item.itemType)) return "weapon1";
  if (OFF_HAND_TYPES.has(item.itemType)) return "weapon2";

  // Fallback se nenhum tipo corresponder
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
  return Math.max(1, price); // Ensure minimum price of 1
};
// -----------------------------------------------------

// --- Helper to get absolute max value for a mod type ---
const getAbsoluteMaxValue = (modType: ModifierType): number | null => {
  const ranges = MODIFIER_RANGES[modType];
  if (!ranges || ranges.length === 0) return null;
  return ranges[ranges.length - 1].valueMax;
};