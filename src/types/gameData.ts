// src/types/gameData.ts

import { FaHome, FaTree, FaMountain, FaWater, FaCrosshairs } from 'react-icons/fa'; // Example Icons

// Define possible character classes
export type CharacterClass = "Guerreiro" | "Ladino" | "Mago";

// Define damage types
export type EnemyDamageType = "physical" | "cold" | "void";

// Define Equipment Slots
export type EquipmentSlotId =
  | "helm"
  | "bodyArmor"
  | "gloves"
  | "boots"
  | "weapon1"
  | "weapon2" // Ou offhand/shield
  | "ring1"
  | "ring2"
  | "amulet"
  | "belt";

// Define the structure for a character
export interface Character {
  id: number;
  name: string;
  class: CharacterClass;
  level: number; // Max Level 100
  currentXP: number; // Current XP towards next level
  currentAct: number; // Current act player is in
  currentAreaId: string; // ID of the specific area within the act
  unlockedAreaIds: string[]; // IDs of areas player has access to

  // Base Stats
  strength: number;
  dexterity: number;
  intelligence: number;

  // Defensive Stats
  armor: number;
  evasion: number;
  barrier: number; // Or maybe energy shield?
  blockChance: number; // Percentage (Max 75%)
  maxHealth: number;
  currentHealth: number;

  // Resistances (Percentage - Max 75% each)
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  voidResistance: number;

  // Offensive Stats (Base Character)
  minBaseDamage: number; // NEW
  maxBaseDamage: number; // NEW
  // attackDamage: number; // REMOVED (Replaced by min/max)
  criticalStrikeChance: number; // Base crit chance (percentage)
  criticalStrikeMultiplier: number; // Base crit multiplier (percentage, e.g., 150 for 1.5x)

  // Type specific base damages (might be 0 if not applicable)
  projectileDamage: number;
  spellDamage: number;
  fireDamage: number;
  coldDamage: number;
  lightningDamage: number;
  voidDamage: number;

  movementSpeed: number; // Percentage bonus (0 = base)
  attackSpeed: number; // Base attacks per second
  castSpeed: number; // Base casts per second
  healthPotions: number; // Number of available health potions
  inventory: EquippableItem[]; // Backpack/Stash
  equipment: Partial<Record<EquipmentSlotId, EquippableItem | null>>; // Equipped items

  // inventory: InventoryItem[]; // Add later if needed
  // skills: Skill[]; // Add later if needed
  // Add other relevant fields like experience, currency, etc.
}

// Define the structure for a map location (with combat fields)
export interface MapLocation {
  id: string;
  name: string;
  description: string;
  act: number;
  position: { top: string; left: string };
  icon?: React.ComponentType<{ className?: string }>;
  connections: string[];
  level: number; // Nível da área
  possibleEnemies: string[]; // IDs de EnemyType que podem aparecer
}

// Define the structure for an enemy type (base data)
export interface EnemyType {
  id: string;
  name: string;
  emoji: string; // Add emoji representation
  damageType: EnemyDamageType;
  baseHealthLvl2: number;
  baseDamageLvl2: number;
  healthIncreasePerLevel: number;
  damageIncreasePerLevel: number;
  attackSpeed: number; // Attacks per second
  baseXP: number; // Base XP awarded at its level
}

// Define the structure for an enemy instance in combat
export interface EnemyInstance {
  instanceId: string;
  typeId: string;
  name: string; // Copied from type for convenience
  emoji: string; // Copied from type
  level: number;
  maxHealth: number;
  currentHealth: number;
  damage: number;
  attackSpeed: number;
  damageType: EnemyDamageType;
}

// Define overall game data structure
export interface OverallGameData {
  currencies: {
    ruby: number;
    sapphire: number;
    voidCrystals: number;
  };
  lastPlayedCharacterId: number | null; // Optional: track last selected
  // Add other global fields later (settings, unlocked features, etc.)
}

// Default values when no data is found in localStorage
export const defaultOverallData: OverallGameData = {
  currencies: {
    ruby: 0,
    sapphire: 0,
    voidCrystals: 0,
  },
  lastPlayedCharacterId: null,
};

export const defaultCharacters: Character[] = [];

// Enemy Type Data
export const enemyTypes: EnemyType[] = [
  { id: 'goblin', name: 'Goblin', emoji: '👺', damageType: 'physical', baseHealthLvl2: 38, baseDamageLvl2: 12, healthIncreasePerLevel: 30, damageIncreasePerLevel: 8, attackSpeed: 1.5, baseXP: 5 },
  { id: 'ice_witch', name: 'Bruxa do Gelo', emoji: '🧙‍♀️', damageType: 'cold', baseHealthLvl2: 27, baseDamageLvl2: 15, healthIncreasePerLevel: 27, damageIncreasePerLevel: 10, attackSpeed: 0.7, baseXP: 8 },
  { id: 'stone_golem', name: 'Golem de Pedra', emoji: '🗿', damageType: 'physical', baseHealthLvl2: 75, baseDamageLvl2: 8, healthIncreasePerLevel: 53, damageIncreasePerLevel: 7, attackSpeed: 0.5, baseXP: 15 },
  { id: 'spider', name: 'Aranha Gigante', emoji: '🕷️', damageType: 'physical', baseHealthLvl2: 33, baseDamageLvl2: 10, healthIncreasePerLevel: 33, damageIncreasePerLevel: 9, attackSpeed: 1.0, baseXP: 6 },
  { id: 'zombie', name: 'Zumbi', emoji: '🧟', damageType: 'physical', baseHealthLvl2: 45, baseDamageLvl2: 9, healthIncreasePerLevel: 38, damageIncreasePerLevel: 8, attackSpeed: 0.6, baseXP: 7 },
  { id: 'bat', name: 'Morcego Sanguessuga', emoji: '🦇', damageType: 'physical', baseHealthLvl2: 23, baseDamageLvl2: 8, healthIncreasePerLevel: 23, damageIncreasePerLevel: 7, attackSpeed: 1.0, baseXP: 4 },
  { id: 'vampire_spawn', name: 'Cria Vampírica', emoji: '🧛', damageType: 'physical', baseHealthLvl2: 60, baseDamageLvl2: 18, healthIncreasePerLevel: 45, damageIncreasePerLevel: 12, attackSpeed: 0.9, baseXP: 20 },
  { id: 'void_horror', name: 'Horror do Vazio', emoji: '👾', damageType: 'void', baseHealthLvl2: 90, baseDamageLvl2: 25, healthIncreasePerLevel: 45, damageIncreasePerLevel: 15, attackSpeed: 0.8, baseXP: 30 },
];

// Location Data (with combat fields)
export const act1Locations: MapLocation[] = [
  { id: "cidade_principal", name: "Cidade Principal", description: "A última fortaleza da civilização neste ato.", act: 1, position: { top: "70%", left: "20%" }, icon: FaHome, connections: ["floresta_sombria"], level: 1, possibleEnemies: [] },
  { id: "floresta_sombria", name: "Floresta Sombria", description: "Uma floresta antiga e perigosa.", act: 1, position: { top: "50%", left: "50%" }, icon: FaTree, connections: ["cidade_principal", "colinas_ecoantes"], level: 2, possibleEnemies: ['goblin', 'spider', 'bat'] },
  { id: "colinas_ecoantes", name: "Colinas Ecoantes", description: "Ventos uivantes carregam segredos antigos.", act: 1, position: { top: "30%", left: "30%" }, icon: FaMountain, connections: ["floresta_sombria", "rio_esquecido"], level: 5, possibleEnemies: ['goblin', 'spider', 'zombie', 'ice_witch'] },
  { id: "rio_esquecido", name: "Rio Esquecido", description: "Águas turvas escondem perigos submersos.", act: 1, position: { top: "65%", left: "75%" }, icon: FaWater, connections: ["colinas_ecoantes", "acampamento_cacadores"], level: 9, possibleEnemies: ['stone_golem', 'zombie', 'ice_witch', 'vampire_spawn'] },
  { id: "acampamento_cacadores", name: "Acampamento de Caçadores", description: "Um pequeno refúgio para batedores experientes.", act: 1, position: { top: "40%", left: "80%" }, icon: FaCrosshairs, connections: ["rio_esquecido"], level: 12, possibleEnemies: ['stone_golem', 'vampire_spawn', 'void_horror'] },
];

// Utility function
export const calculateEnemyStats = (type: EnemyType, level: number): { health: number; damage: number } => {
  const health = Math.max(1, Math.round(type.baseHealthLvl2 + ((level - 2) * type.healthIncreasePerLevel)));
  const damage = Math.max(1, Math.round(type.baseDamageLvl2 + ((level - 2) * type.damageIncreasePerLevel)));
  return { health, damage };
};

// Placeholder Item interface
export interface Item { id: string; name?: string; }

// --- Item System Types ---

export type ItemRarity = "Branco" | "Mágico" | "Raro" | "Lendário";

export type ModifierType =
  | "AddsFlatPhysicalDamage"
  | "IncreasedPhysicalDamage"
  | "AddsFlatFireDamage"
  | "AddsFlatColdDamage"
  | "AddsFlatLightningDamage"
  | "AddsFlatVoidDamage"
  | "AttackSpeed"
  | "IncreasedCriticalStrikeChance"
  | "IncreasedCriticalStrikeMultiplier"
  | "IncreasedElementalDamage"
  | "LifeLeech"
  | "Strength"
  | "Dexterity"
  | "Intelligence";

// Define which mods are prefixes and suffixes
export const PREFIX_MODIFIERS: Set<ModifierType> = new Set([
    "AddsFlatPhysicalDamage",
    "IncreasedPhysicalDamage",
    "AddsFlatFireDamage",
    "AddsFlatColdDamage",
    "AddsFlatLightningDamage",
    "AddsFlatVoidDamage",
]);

export const SUFFIX_MODIFIERS: Set<ModifierType> = new Set([
    "AttackSpeed",
    "IncreasedCriticalStrikeChance",
    "IncreasedCriticalStrikeMultiplier",
    "IncreasedElementalDamage",
    "LifeLeech",
    "Strength",
    "Dexterity",
    "Intelligence",
]);

export interface Modifier {
  type: ModifierType;
  value: number;
  valueMin?: number;
  valueMax?: number;
  tier?: number;
}

export interface BaseItem {
  id: string;
  baseId: string;
  name: string;
  rarity: ItemRarity;
  itemType: string;
  icon: string;
}

export interface EquippableItem extends BaseItem {
  itemLevel: number;
  modifiers: Modifier[];
  baseMinDamage?: number;
  baseMaxDamage?: number;
  baseAttackSpeed?: number;
  baseCriticalStrikeChance?: number;
  baseArmor?: number;
} 