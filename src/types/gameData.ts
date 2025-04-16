// src/types/gameData.ts

import { FaHome, FaTree, FaMountain, FaWater, FaCrosshairs, FaSnowflake } from 'react-icons/fa'; // Added FaSnowflake

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
  baseMaxHealth: number; // <<< ADD TRUE BASE HEALTH FIELD
  maxHealth: number;
  currentHealth: number;
  currentBarrier: number; // <<< ADD CURRENT BARRIER

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
  teleportStones: number; // <<< ADD NEW FIELD
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
  unlocks?: string[]; // <<< ADD THIS LINE: Areas unlocked by completing this one
}

// Define the structure for an enemy type (base data)
export interface EnemyType {
  id: string;
  name: string;
  emoji: string; // Add emoji representation
  damageType: EnemyDamageType;
  baseHealthLvl1: number; // Changed from Lvl2
  baseDamageLvl1: number; // Changed from Lvl2
  healthIncreasePerLevel: number;
  damageIncreasePerLevel: number; // Will adjust values below
  attackSpeed: number; // Attacks per second
  baseXP: number; // Base XP awarded at its level
  baseAccuracyLvl1: number;
  accuracyIncreasePerLevel: number;
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
  accuracy: number;
  isDying?: boolean; // ADDED for death animation control
}

// Define overall game data structure
export interface OverallGameData {
  currencies: {
    ruby: number;
    sapphire: number;
    voidCrystals: number; // <<< ADD VOID CRYSTALS
  };
  lastPlayedCharacterId: number | null; // Optional: track last selected
  // Add other global fields later (settings, unlocked features, etc.)
}

// Default values when no data is found in localStorage
export const defaultOverallData: OverallGameData = {
  currencies: {
    ruby: 0,
    sapphire: 0,
    voidCrystals: 0, // <<< INITIALIZE VOID CRYSTALS
  },
  lastPlayedCharacterId: null,
};

export const defaultCharacters: Character[] = [];

// Enemy Type Data (Balancing Act 1 based on ~261 HP @ Lvl 14)
export const enemyTypes: EnemyType[] = [
  // Early enemies - Less change
  { id: 'goblin', name: 'Goblin', emoji: '👺', damageType: 'physical', baseHealthLvl1: 8, baseDamageLvl1: 5, healthIncreasePerLevel: 11, damageIncreasePerLevel: 3, attackSpeed: 1.5, baseXP: 5, baseAccuracyLvl1: 50, accuracyIncreasePerLevel: 4 }, // Slightly increased dmg scaling
  { id: 'spider', name: 'Aranha Gigante', emoji: '🕷️', damageType: 'physical', baseHealthLvl1: 6, baseDamageLvl1: 4, healthIncreasePerLevel: 12, damageIncreasePerLevel: 3, attackSpeed: 1.0, baseXP: 6, baseAccuracyLvl1: 55, accuracyIncreasePerLevel: 5 }, // Slightly increased dmg scaling
  { id: 'bat', name: 'Morcego Sanguessuga', emoji: '🦇', damageType: 'physical', baseHealthLvl1: 18, baseDamageLvl1: 6, healthIncreasePerLevel: 14, damageIncreasePerLevel: 3, attackSpeed: 1.0, baseXP: 4, baseAccuracyLvl1: 50, accuracyIncreasePerLevel: 4 }, // Keep dmg scaling lower
  // Mid-level enemies - Moderate increase
  { id: 'ice_witch', name: 'Bruxa do Gelo', emoji: '🧙‍♀️', damageType: 'cold', baseHealthLvl1: 7, baseDamageLvl1: 8, healthIncreasePerLevel: 14, damageIncreasePerLevel: 3, attackSpeed: 0.7, baseXP: 8, baseAccuracyLvl1: 60, accuracyIncreasePerLevel: 6 }, // Increased base dmg and scaling
  { id: 'zombie', name: 'Zumbi', emoji: '🧟', damageType: 'physical', baseHealthLvl1: 8, baseDamageLvl1: 9, healthIncreasePerLevel: 11, damageIncreasePerLevel: 3, attackSpeed: 0.6, baseXP: 7, baseAccuracyLvl1: 45, accuracyIncreasePerLevel: 4 }, // Increased base dmg and scaling
  // Late Act 1 enemies - Significant increase
  { id: 'stone_golem', name: 'Golem de Pedra', emoji: '🗿', damageType: 'physical', baseHealthLvl1: 25, baseDamageLvl1: 7, healthIncreasePerLevel: 11, damageIncreasePerLevel: 5, attackSpeed: 0.5, baseXP: 15, baseAccuracyLvl1: 70, accuracyIncreasePerLevel: 7 }, // Increased base dmg and scaling
  { id: 'vampire_spawn', name: 'Cria Vampírica', emoji: '🧛', damageType: 'physical', baseHealthLvl1: 20, baseDamageLvl1: 12, healthIncreasePerLevel: 15, damageIncreasePerLevel: 5, attackSpeed: 0.9, baseXP: 20, baseAccuracyLvl1: 80, accuracyIncreasePerLevel: 8 }, // Increased base dmg and scaling
  { id: 'void_horror', name: 'Horror do Vazio', emoji: '👾', damageType: 'void', baseHealthLvl1: 50, baseDamageLvl1: 25, healthIncreasePerLevel: 30, damageIncreasePerLevel: 6, attackSpeed: 0.8, baseXP: 30, baseAccuracyLvl1: 90, accuracyIncreasePerLevel: 9 }, // Increased base dmg and scaling
  // Boss - Keep as is, already strong
  { 
    id: 'ice_dragon_boss', 
    name: 'Dragão de Gelo (Boss)', 
    emoji: '🐉', 
    damageType: 'cold', 
    baseHealthLvl1: 50, 
    baseDamageLvl1: 5, 
    healthIncreasePerLevel: 22, // ~358 HP at level 15
    damageIncreasePerLevel: 4, // ~20.4 Damage at level 15
    attackSpeed: 1.25, // 1 / 0.8 seconds
    baseXP: 100, 
    baseAccuracyLvl1: 120, // Bosses tend to be accurate
    accuracyIncreasePerLevel: 10 
  },
];

// Location Data (with combat fields)
export const act1Locations: MapLocation[] = [
  { id: "cidade_principal", name: "Cidade Principal", description: "A última fortaleza da civilização neste ato.", act: 1, position: { top: "70%", left: "20%" }, icon: FaHome, connections: ["floresta_sombria"], level: 1, possibleEnemies: [] },
  { 
    id: "floresta_sombria", 
    name: "Floresta Sombria", 
    description: "Uma floresta antiga e perigosa.", 
    act: 1, 
    position: { top: "50%", left: "50%" }, 
    icon: FaTree, 
    connections: ["cidade_principal", "colinas_ecoantes"], 
    level: 1, 
    possibleEnemies: ['goblin', 'spider', 'bat'],
    unlocks: ['colinas_ecoantes']
  },
  {
    id: "colinas_ecoantes",
    name: "Colinas Ecoantes",
    description: "Ventos uivantes carregam segredos antigos.",
    act: 1,
    position: { top: "30%", left: "30%" },
    icon: FaMountain,
    connections: ["floresta_sombria", "rio_esquecido"],
    level: 3,
    possibleEnemies: ['goblin', 'spider', 'zombie', 'ice_witch'],
    unlocks: ['rio_esquecido']
  },
  {
    id: "rio_esquecido",
    name: "Rio Esquecido",
    description: "Águas turvas escondem perigos submersos.",
    act: 1,
    position: { top: "65%", left: "75%" },
    icon: FaWater,
    connections: ["colinas_ecoantes", "acampamento_cacadores"],
    level: 9,
    possibleEnemies: ['stone_golem', 'zombie', 'ice_witch', 'vampire_spawn'],
    unlocks: ['acampamento_cacadores']
  },
  {
    id: "acampamento_cacadores",
    name: "Acampamento de Caçadores",
    description: "Um pequeno refúgio para batedores experientes.",
    act: 1,
    position: { top: "40%", left: "80%" },
    icon: FaCrosshairs,
    connections: ["rio_esquecido", "pico_congelado"],
    level: 12,
    possibleEnemies: ['stone_golem', 'vampire_spawn', 'void_horror'],
    unlocks: ['pico_congelado']
  },
  {
    id: "pico_congelado",
    name: "Pico Congelado",
    description: "O pico gelado onde reside a fera.",
    act: 1,
    position: { top: "15%", left: "70%" },
    icon: FaSnowflake,
    connections: ["acampamento_cacadores"],
    level: 15,
    possibleEnemies: ['ice_dragon_boss']
  },
];

// Utility function
export const calculateEnemyStats = (type: EnemyType, level: number): { health: number; damage: number; accuracy: number } => {
  const health = Math.max(1, Math.round(type.baseHealthLvl1 + ((level - 1) * type.healthIncreasePerLevel)));
  const damage = Math.max(1, Math.round(type.baseDamageLvl1 + ((level - 1) * type.damageIncreasePerLevel)));
  const accuracy = Math.max(10, Math.round(type.baseAccuracyLvl1 + ((level - 1) * type.accuracyIncreasePerLevel)));
  return { health, damage, accuracy };
};

// Placeholder Item interface
export interface Item { id: string; name?: string; }

// --- Item System Types ---

export type ItemRarity = "Normal" | "Mágico" | "Raro" | "Lendário";

export enum ModifierType {
  // Prefixes
  IncreasedPhysicalDamage = "IncreasedPhysicalDamage",
  IncreasedLocalPhysicalDamage = "IncreasedLocalPhysicalDamage", // Weapon Only
  AddsFlatPhysicalDamage = "AddsFlatPhysicalDamage",
  AddsFlatFireDamage = "AddsFlatFireDamage",
  AddsFlatColdDamage = "AddsFlatColdDamage",
  AddsFlatLightningDamage = "AddsFlatLightningDamage",
  AddsFlatVoidDamage = "AddsFlatVoidDamage",
  MaxHealth = "MaxHealth",
  FlatLocalArmor = "FlatLocalArmor", // Armor Only
  IncreasedLocalArmor = "IncreasedLocalArmor", // Armor Only
  FlatLocalEvasion = "FlatLocalEvasion", // Armor Only
  IncreasedLocalEvasion = "IncreasedLocalEvasion", // Armor Only
  FlatLocalBarrier = "FlatLocalBarrier", // Armor Only
  IncreasedLocalBarrier = "IncreasedLocalBarrier", // Armor Only
  ThornsDamage = "ThornsDamage",

  // Suffixes
  // AttackSpeed = "AttackSpeed", // <<< RENAME THIS
  IncreasedGlobalAttackSpeed = "IncreasedGlobalAttackSpeed", // <<< NEW NAME
  IncreasedLocalAttackSpeed = "IncreasedLocalAttackSpeed", // Weapon Only
  IncreasedLocalCriticalStrikeChance = "IncreasedLocalCriticalStrikeChance", // Weapon Only
  IncreasedGlobalCriticalStrikeChance = "IncreasedGlobalCriticalStrikeChance",
  IncreasedCriticalStrikeMultiplier = "IncreasedCriticalStrikeMultiplier",
  IncreasedBlockChance = "IncreasedBlockChance", // Shield Only
  IncreasedElementalDamage = "IncreasedElementalDamage",
  IncreasedFireDamage = "IncreasedFireDamage",
  IncreasedColdDamage = "IncreasedColdDamage",
  IncreasedLightningDamage = "IncreasedLightningDamage",
  IncreasedVoidDamage = "IncreasedVoidDamage",
  LifeLeech = "LifeLeech",
  Strength = "Strength",
  Dexterity = "Dexterity",
  Intelligence = "Intelligence",
  // Resistances and Regen (Confirming as Suffixes)
  FireResistance = "FireResistance",
  ColdResistance = "ColdResistance",
  LightningResistance = "LightningResistance",
  VoidResistance = "VoidResistance",
  FlatLifeRegen = "FlatLifeRegen",
  PercentLifeRegen = "PercentLifeRegen",
  // Helmet/Armor Specific Suffixes (Example placement)
  PhysDamageTakenAsElement = "PhysDamageTakenAsElement",
  ReducedPhysDamageTaken = "ReducedPhysDamageTaken",
}

// Define which mods are prefixes and suffixes
export const PREFIX_MODIFIERS: Set<ModifierType> = new Set([
  ModifierType.IncreasedPhysicalDamage,
  ModifierType.IncreasedLocalPhysicalDamage,
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
  ModifierType.MaxHealth,
  ModifierType.IncreasedLocalArmor,
  ModifierType.FlatLocalArmor,
  ModifierType.ThornsDamage,
  ModifierType.FlatLocalEvasion,
  ModifierType.IncreasedLocalEvasion,
  ModifierType.FlatLocalBarrier,
  ModifierType.IncreasedLocalBarrier,
]);

export const SUFFIX_MODIFIERS: Set<ModifierType> = new Set([
  ModifierType.IncreasedGlobalAttackSpeed,
  ModifierType.IncreasedLocalAttackSpeed,
  ModifierType.IncreasedLocalCriticalStrikeChance,
  ModifierType.IncreasedElementalDamage,
  ModifierType.IncreasedFireDamage,
  ModifierType.IncreasedColdDamage,
  ModifierType.IncreasedLightningDamage,
  ModifierType.IncreasedVoidDamage,
  ModifierType.IncreasedGlobalCriticalStrikeChance,
  ModifierType.IncreasedCriticalStrikeMultiplier,
  ModifierType.LifeLeech,
  ModifierType.Strength,
  ModifierType.Dexterity,
  ModifierType.Intelligence,
  ModifierType.FireResistance,
  ModifierType.ColdResistance,
  ModifierType.LightningResistance,
  ModifierType.VoidResistance,
  ModifierType.FlatLifeRegen,
  ModifierType.PercentLifeRegen,
  ModifierType.PhysDamageTakenAsElement,
  ModifierType.ReducedPhysDamageTaken,
  ModifierType.IncreasedBlockChance,
]);

// Define Weapon Classifications
export type WeaponClassification = "Melee" | "Ranged" | "Spell" | "Throwable"; // Add more as needed

export interface Modifier {
  type: ModifierType;
  value?: number;
  valueMin?: number;
  valueMax?: number;
  tier?: number;
  classification?: WeaponClassification; // Add optional classification
}

export interface BaseItem {
  id: string; // Unique combination like 'helm_t1_str' or 'weapon_axe_t3'
  baseId: string; // The core base type identifier (e.g., 'plate_helm', 'iron_axe')
  name: string;
  rarity: ItemRarity;
  itemType: string; // e.g., "Helm", "BodyArmor", "OneHandedSword"
  icon: string;
  // Add base stats relevant to the item type
  baseArmor?: number;
  baseEvasion?: number;
  baseBarrier?: number;
  baseMinDamage?: number;
  baseMaxDamage?: number;
  baseAttackSpeed?: number;
  baseCriticalStrikeChance?: number;
  baseBlockChance?: number;
  requirements?: { // Optional requirements
    level?: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
  };
  classification?: WeaponClassification; // For weapons
}

export interface EquippableItem extends BaseItem {
  modifiers: Modifier[];
  // Base stats are inherited via BaseItem spreading now
}

// --- NEW: Base definitions for Plate Helms ---
export const PLATE_HELM_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_helm_t1',
  name: 'Elmo de Placas',
  itemType: 'Helm',
  icon: '/sprites/armour_helmet.png',
  baseArmor: 50,
  requirements: { level: 1, strength: 10 }
};

export const PLATE_HELM_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_helm_t2',
  name: 'Elmo de Placas Avançado',
  itemType: 'Helm',
  icon: '/sprites/armour_helmet.png', // Placeholder - use same icon for now
  baseArmor: 100,
  requirements: { level: 25, strength: 40 }
};

export const PLATE_HELM_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_helm_t3',
  name: 'Elmo de Placas Expert',
  itemType: 'Helm',
  icon: '/sprites/armour_helmet.png', // Placeholder - use same icon for now
  baseArmor: 200,
  requirements: { level: 50, strength: 80 }
};

// --- Base definitions for One-Handed Swords ---
export const SHORT_SWORD_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '1h_sword_t1',
  name: 'Espada Curta de Aço',
  itemType: 'OneHandedSword',
  icon: '/sprites/one_handed_sword.png',
  baseMinDamage: 5,
  baseMaxDamage: 10,
  baseAttackSpeed: 1.1,
  baseCriticalStrikeChance: 5,
  requirements: { level: 1 }
};

export const SHORT_SWORD_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '1h_sword_t2',
  name: 'Espada Curta de Aço Avançado',
  itemType: 'OneHandedSword',
  icon: '/sprites/one_handed_sword.png', // Placeholder icon
  baseMinDamage: 12,
  baseMaxDamage: 20,
  baseAttackSpeed: 1.1,
  baseCriticalStrikeChance: 5,
  requirements: { level: 15, dexterity: 10 } // Example reqs
};

export const SHORT_SWORD_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '1h_sword_t3',
  name: 'Espada Curta de Aço Expert',
  itemType: 'OneHandedSword',
  icon: '/sprites/one_handed_sword.png', // Placeholder icon
  baseMinDamage: 25,
  baseMaxDamage: 40,
  baseAttackSpeed: 1.1,
  baseCriticalStrikeChance: 5,
  requirements: { level: 35, dexterity: 30 } // Example reqs
};

// --- Base definitions for Two-Handed Swords ---
export const LONG_SWORD_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '2h_sword_t1',
  name: 'Espada Longa de Aço',
  itemType: 'TwoHandedSword',
  icon: '/sprites/two_handed_sword.png',
  baseMinDamage: 10,
  baseMaxDamage: 18,
  baseAttackSpeed: 0.9,
  baseCriticalStrikeChance: 5,
  requirements: { level: 1, strength: 10 }
};

export const LONG_SWORD_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '2h_sword_t2',
  name: 'Espada Longa de Aço Avançado',
  itemType: 'TwoHandedSword',
  icon: '/sprites/two_handed_sword.png', // Placeholder icon
  baseMinDamage: 22,
  baseMaxDamage: 35,
  baseAttackSpeed: 0.9,
  baseCriticalStrikeChance: 5,
  requirements: { level: 20, strength: 25 } // Example reqs
};

export const LONG_SWORD_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '2h_sword_t3',
  name: 'Espada Longa de Aço Expert',
  itemType: 'TwoHandedSword',
  icon: '/sprites/two_handed_sword.png', // Placeholder icon
  baseMinDamage: 45,
  baseMaxDamage: 70,
  baseAttackSpeed: 0.9,
  baseCriticalStrikeChance: 5,
  requirements: { level: 45, strength: 60 } // Example reqs
};

// --- Base definitions for Body Armor ---
export const PLATE_ARMOR_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_armor_t1',
  name: 'Armadura de Placas',
  itemType: 'BodyArmor',
  icon: '/sprites/armour_plate.png',
  baseArmor: 20,
  requirements: { level: 1, strength: 10 } // <<< REDUCE STRENGTH REQ
};

export const PLATE_ARMOR_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_armor_t2',
  name: 'Armadura de Placas Avançada',
  itemType: 'BodyArmor',
  icon: '/sprites/armour_plate.png', // Placeholder icon
  baseArmor: 80,
  requirements: { level: 18, strength: 30 } // Example reqs
};

export const PLATE_ARMOR_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_armor_t3',
  name: 'Armadura de Placas Expert',
  itemType: 'BodyArmor',
  icon: '/sprites/armour_plate.png', // Placeholder icon
  baseArmor: 300,
  requirements: { level: 40, strength: 70 } // Example reqs
};

// --- Base definitions for Evasion Body Armor ---
export const LEATHER_VEST_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'leather_vest_t1',
  name: 'Colete de Couro',
  itemType: 'BodyArmor',
  icon: '/sprites/evasion_armour.png',
  baseEvasion: 40, // Example value
  requirements: { level: 1, dexterity: 10 } // <<< REDUCE DEXTERITY REQ
};

export const LEATHER_VEST_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'leather_vest_t2',
  name: 'Colete de Couro Avançado',
  itemType: 'BodyArmor',
  icon: '/sprites/evasion_armour.png', // Placeholder icon
  baseEvasion: 150, // Example value
  requirements: { level: 18, dexterity: 30 } // Example reqs
};

export const LEATHER_VEST_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'leather_vest_t3',
  name: 'Colete de Couro Expert',
  itemType: 'BodyArmor',
  icon: '/sprites/evasion_armour.png', // Placeholder icon
  baseEvasion: 400, // Example value
  requirements: { level: 40, dexterity: 70 } // Example reqs
};

// --- Base definitions for Barrier Body Armor ---
export const SILK_ROBE_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'silk_robe_t1',
  name: 'Robe de Seda',
  itemType: 'BodyArmor',
  icon: '/sprites/barrier_armour.png',
  baseBarrier: 30, // Example value
  requirements: { level: 1, intelligence: 10 } // <<< REDUCE INTELLIGENCE REQ
};

export const SILK_ROBE_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'silk_robe_t2',
  name: 'Robe de Seda Avançado',
  itemType: 'BodyArmor',
  icon: '/sprites/barrier_armour.png', // Placeholder icon
  baseBarrier: 100, // Example value
  requirements: { level: 18, intelligence: 30 } // Example reqs
};

export const SILK_ROBE_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'silk_robe_t3',
  name: 'Robe de Seda Expert',
  itemType: 'BodyArmor',
  icon: '/sprites/barrier_armour.png', // Placeholder icon
  baseBarrier: 250, // Example value
  requirements: { level: 40, intelligence: 70 } // Example reqs
};

// --- Base definitions for Shields ---
export const PLATE_SHIELD_T1: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_shield_t1',
  name: 'Escudo de Placas',
  itemType: 'Shield',
  icon: '/sprites/armour_shield.png',
  baseArmor: 30, // Shields have armor too
  baseBlockChance: 15, // 15% base block
  requirements: { level: 1, strength: 10 } // Drops from level 1
};

export const PLATE_SHIELD_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_shield_t2',
  name: 'Escudo de Placas Avançado',
  itemType: 'Shield',
  icon: '/sprites/armour_shield.png', // Placeholder icon
  baseArmor: 90,
  baseBlockChance: 20, // Increased base block
  requirements: { level: 22, strength: 35 } // Example reqs
};

export const PLATE_SHIELD_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: 'plate_shield_t3',
  name: 'Escudo de Placas Expert',
  itemType: 'Shield',
  icon: '/sprites/armour_shield.png', // Placeholder icon
  baseArmor: 250,
  baseBlockChance: 25, // Further increased base block
  requirements: { level: 48, strength: 75 } // Example reqs
};

// Helper function to determine tier based on item level (example) 