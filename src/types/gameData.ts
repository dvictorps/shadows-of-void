// src/types/gameData.ts

import { FaHome, FaTree, FaMountain, FaWater, FaCrosshairs, FaSnowflake } from 'react-icons/fa'; // Added FaSnowflake

// Define possible character classes
export type CharacterClass = "Guerreiro" | "Ladino" | "Mago";

// Define damage types
export type EnemyDamageType = "physical" | "cold" | "void" | "fire" | "lightning";

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
  // lastPlayedCharacterId: number | null; // REMOVED - Moved to UserGameData
  // stash: EquippableItem[]; // REMOVED - Moved to UserGameData
  // Add other global fields later (settings, unlocked features, etc.)
}

// <<< ADD Jewelry Item Type >>>
export type JewelryItemType = "Ring" | "Amulet" | "Belt";
// -------------------------

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
  killsToComplete?: number;
  currentKills?: number; // <<< ADD THIS FIELD FOR TRACKING PROGRESS
}

// Define the structure for an enemy type (base data)
export interface EnemyType {
  id: string;
  name: string;
  emoji?: string;
  iconPath?: string;
  damageType: EnemyDamageType;
  baseHealthLvl1: number; // Changed from Lvl2
  baseDamageLvl1: number; // Changed from Lvl2
  healthIncreasePerLevel: number;
  damageIncreasePerLevel: number; // Will adjust values below
  attackSpeed: number; // Attacks per second
  baseXP: number; // Base XP awarded at its level
  baseAccuracyLvl1: number;
  accuracyIncreasePerLevel: number;
  guaranteedItemDropBaseId?: string; // <<< ADDED
  guaranteedItemDropRarity?: ItemRarity; // <<< ADDED
  isDying?: boolean; // ADDED for death animation control
}

// Define the structure for an enemy instance in combat
export interface EnemyInstance {
  instanceId: string;
  typeId: string;
  name: string; // Copied from type for convenience
  emoji?: string;
  iconPath?: string;
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
    windCrystals: number; // <<< ADD WIND CRYSTALS >>>
  };
  gold: number;
  souls: number;
  lastPlayedCharacterId: number | null;
  stash: EquippableItem[];
  // Add other global fields later (settings, unlocked features, etc.)
}

// --- NEW: User-specific game data including all characters and shared stash ---
export interface UserGameData {
  characters: Character[];
  lastPlayedCharacterId: number | null;
  stash: EquippableItem[];
}

export const initialUserGameData: UserGameData = {
  characters: [],
  lastPlayedCharacterId: null,
  stash: [],
};
// ----------------------------------------------------------------------------

// Default values when no data is found in localStorage
export const defaultOverallData: OverallGameData = {
  currencies: {
    ruby: 0,
    sapphire: 0,
    voidCrystals: 0, // <<< INITIALIZE VOID CRYSTALS
    windCrystals: 0, // <<< INITIALIZE WIND CRYSTALS >>>
  },
  gold: 0,
  souls: 0,
  lastPlayedCharacterId: null,
  stash: [],
};

export const defaultCharacters: Character[] = [];

// Enemy Type Data (Balancing Act 1 based on ~261 HP @ Lvl 14)
export const enemyTypes: EnemyType[] = [
  // Early enemies - Less change
  {
    id: 'goblin',
    name: 'Goblin',
    iconPath: '/sprites/creatures/goblin.png',
    damageType: 'physical',
    baseHealthLvl1: 11,
    baseDamageLvl1: 3,
    healthIncreasePerLevel: 11,
    damageIncreasePerLevel: 3,
    attackSpeed: 1.5,
    baseXP: 5,
    baseAccuracyLvl1: 50,
    accuracyIncreasePerLevel: 4
  },
  {
    id: 'bat',
    name: 'Morcego Sanguessuga',
    iconPath: '/sprites/creatures/bat.png',
    damageType: 'physical',
    baseHealthLvl1: 18,
    baseDamageLvl1: 3.8,
    healthIncreasePerLevel: 10,
    damageIncreasePerLevel: 3,
    attackSpeed: 1.0,
    baseXP: 4,
    baseAccuracyLvl1: 50,
    accuracyIncreasePerLevel: 4
  },
  // Mid-level enemies - Moderate increase
  {
    id: 'zombie',
    name: 'Zumbi',
    iconPath: '/sprites/creatures/zombie.png',
    damageType: 'physical',
    baseHealthLvl1: 13,
    baseDamageLvl1: 4.5,
    healthIncreasePerLevel: 10,
    damageIncreasePerLevel: 3,
    attackSpeed: 0.6,
    baseXP: 7,
    baseAccuracyLvl1: 45,
    accuracyIncreasePerLevel: 4
  },
  // Late Act 1 enemies - Significant increase
  {
    id: 'vampire_spawn',
    name: 'Cria Vampírica',
    iconPath: '/sprites/creatures/vampire.png',
    damageType: 'fire',
    baseHealthLvl1: 21,
    baseDamageLvl1: 5.5,
    healthIncreasePerLevel: 9,
    damageIncreasePerLevel: 3,
    attackSpeed: 0.9,
    baseXP: 20,
    baseAccuracyLvl1: 80,
    accuracyIncreasePerLevel: 8
  },
  {
    id: 'void_horror',
    name: 'Horror do Vazio',
    iconPath: '/sprites/creatures/void_horror.png',
    damageType: 'void',
    baseHealthLvl1: 36,
    baseDamageLvl1: 5.8,
    healthIncreasePerLevel: 9,
    damageIncreasePerLevel:3,
    attackSpeed: 0.8,
    baseXP: 30,
    baseAccuracyLvl1: 90,
    accuracyIncreasePerLevel: 9
  },
  // Boss - Keep as is, already strong
  { 
    id: 'ice_dragon_boss', 
    name: 'Gralfor, the Snow Dragon (Boss)', 
    emoji: '🐉', 
    damageType: 'cold', 
    baseHealthLvl1: 68, 
    baseDamageLvl1: 6, 
    healthIncreasePerLevel: 35, // ~358 HP at level 15
    damageIncreasePerLevel: 4, // ~20.4 Damage at level 15
    attackSpeed: 1.25, // 1 / 0.8 seconds
    baseXP: 120, 
    baseAccuracyLvl1: 120, // Bosses tend to be accurate
    accuracyIncreasePerLevel: 10 
  },
  // Add after 'bat'
  {
    id: 'gorilla',
    name: 'Gorila Selvagem',
    iconPath: '/sprites/creatures/monkey.png', // Using monkey.png as specified
    damageType: 'physical',
    baseHealthLvl1: 20, // Tankier early
    baseDamageLvl1: 3.5,
    healthIncreasePerLevel: 12,
    damageIncreasePerLevel: 3,
    attackSpeed: 0.8, // Slower
    baseXP: 7,
    baseAccuracyLvl1: 50,
    accuracyIncreasePerLevel: 4
  },
  // Add after 'zombie'
  {
    id: 'skeleton',
    name: 'Esqueleto Guerreiro',
    iconPath: '/sprites/creatures/skeleton.png',
    damageType: 'physical',
    baseHealthLvl1: 14, // Standard
    baseDamageLvl1: 4.2,
    healthIncreasePerLevel: 10,
    damageIncreasePerLevel: 3,
    attackSpeed: 1.0,
    baseXP: 8,
    baseAccuracyLvl1: 55,
    accuracyIncreasePerLevel: 5
  },
  // Add after 'skeleton'
  {
    id: 'eye_horror',
    name: 'Horror Ocular',
    iconPath: '/sprites/creatures/eye_horror.png',
    damageType: 'void', // Void damage type
    baseHealthLvl1: 10, // Squishy
    baseDamageLvl1: 5,
    healthIncreasePerLevel: 8,
    damageIncreasePerLevel: 3.5,
    attackSpeed: 0.7, // Slower attack
    baseXP: 10,
    baseAccuracyLvl1: 65, // More accurate
    accuracyIncreasePerLevel: 6
  },
  // Add before 'ice_dragon_boss'
  {
    id: 'slime',
    name: 'Gosma Ácida',
    iconPath: '/sprites/creatures/slime.png',
    damageType: 'physical', // Or maybe 'cold' later?
    baseHealthLvl1: 25, // High HP
    baseDamageLvl1: 4,
    healthIncreasePerLevel: 15,
    damageIncreasePerLevel: 2.5, // Lower damage scaling
    attackSpeed: 0.7, // Slow
    baseXP: 12,
    baseAccuracyLvl1: 50,
    accuracyIncreasePerLevel: 4
  },
  // Add after 'slime'
  {
    id: 'snake',
    name: 'Serpente Venenosa',
    iconPath: '/sprites/creatures/snake.png',
    damageType: 'physical', // Could add poison later
    baseHealthLvl1: 15, // Lower HP
    baseDamageLvl1: 4.8,
    healthIncreasePerLevel: 9,
    damageIncreasePerLevel: 3,
    attackSpeed: 1.3, // Fast attack
    baseXP: 14,
    baseAccuracyLvl1: 60,
    accuracyIncreasePerLevel: 5
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
    possibleEnemies: ['goblin', 'bat', 'gorilla', 'snake'],
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
    possibleEnemies: ['goblin', 'zombie', 'skeleton', 'eye_horror'],
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
    possibleEnemies: ['zombie', 'vampire_spawn', 'slime', 'goblin'],
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
    possibleEnemies: ['vampire_spawn', 'void_horror', 'eye_horror', 'skeleton'],
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
    possibleEnemies: ['ice_dragon_boss'],
    killsToComplete: 1
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
  IncreasedMovementSpeed = "IncreasedMovementSpeed",
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
  ModifierType.IncreasedMovementSpeed,
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
  baseAttackSpeed?: number;
  baseCriticalStrikeChance?: number;
  baseBlockChance?: number;
  baseStrength?: number; // Keep for Amulet/Belt bases
  baseDexterity?: number; // Keep for Amulet/Belt bases
  baseIntelligence?: number; // Keep for Amulet/Belt bases
  // <<< REMOVED Jewelry Base Stats (Will use implicit for rings) >>>
  // baseFireResistance?: number;
  // baseColdResistance?: number;
  // baseLightningResistance?: number;
  // baseVoidResistance?: number;
  // ----------------------------
  requirements?: { // Optional requirements
    level?: number;
    strength?: number;
    dexterity?: number;
    intelligence?: number;
  };
  classification?: WeaponClassification; // For weapons
}

export interface EquippableItem extends BaseItem {
  baseId: string;
  modifiers: Modifier[];
  implicitModifier: Modifier | null;
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
  baseAttackSpeed: 1.1,
  baseCriticalStrikeChance: 5,
  requirements: { level: 1 }
};

export const SHORT_SWORD_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '1h_sword_t2',
  name: 'Espada Curta de Aço Avançado',
  itemType: 'OneHandedSword',
  icon: '/sprites/one_handed_sword.png', // Placeholder icon
  baseAttackSpeed: 1.1,
  baseCriticalStrikeChance: 5,
  requirements: { level: 15, dexterity: 10 } // Example reqs
};

export const SHORT_SWORD_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '1h_sword_t3',
  name: 'Espada Curta de Aço Expert',
  itemType: 'OneHandedSword',
  icon: '/sprites/one_handed_sword.png', // Placeholder icon
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
  baseAttackSpeed: 0.9,
  baseCriticalStrikeChance: 5,
  requirements: { level: 1, strength: 10 }
};

export const LONG_SWORD_T2: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '2h_sword_t2',
  name: 'Espada Longa de Aço Avançado',
  itemType: 'TwoHandedSword',
  icon: '/sprites/two_handed_sword.png', // Placeholder icon
  baseAttackSpeed: 0.9,
  baseCriticalStrikeChance: 5,
  requirements: { level: 20, strength: 25 } // Example reqs
};

export const LONG_SWORD_T3: Omit<BaseItem, 'id' | 'rarity'> = {
  baseId: '2h_sword_t3',
  name: 'Espada Longa de Aço Expert',
  itemType: 'TwoHandedSword',
  icon: '/sprites/two_handed_sword.png', // Placeholder icon
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

// Combat-related types

export interface HitEffectType {
  id: string;
  type: 'slash' | 'pierce' | 'hit' | 'fire' | 'ice' | 'lightning' | 'poison';
} 