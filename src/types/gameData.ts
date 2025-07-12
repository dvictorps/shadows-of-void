// src/types/gameData.ts

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
  isHardcore: boolean;
  isDead?: boolean;
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
  baseMaxMana?: number; // <<< NOVO: base de mana para escalonamento
  maxMana: number; // <<< ADD MAX MANA
  currentMana: number; // <<< ADD CURRENT MANA

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
  distance?: number; // Distance multiplier for travel time (1 = base)
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
  deathSoundPath?: string;
  spawnSoundPath?: string;
  isBoss?: boolean;
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
  isBoss?: boolean;
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
    accuracyIncreasePerLevel: 4,
    deathSoundPath: '/sounds/creatures/goblin.wav'
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
    accuracyIncreasePerLevel: 4,
    deathSoundPath: '/sounds/creatures/bat.wav'
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
    accuracyIncreasePerLevel: 4,
    deathSoundPath: '/sounds/creatures/zombie.wav'
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
    accuracyIncreasePerLevel: 8,
    deathSoundPath: '/sounds/creatures/vampire.wav'
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
    accuracyIncreasePerLevel: 9,
    deathSoundPath: '/sounds/creatures/voidcreature.wav'
  },
  // Boss - Keep as is, already strong
  {
    id: 'ice_dragon_boss',
    name: 'Gralfor, the Snow Dragon (Boss)',
    iconPath: '/sprites/creatures/bosses/gralfor.png',
    damageType: 'cold',
    baseHealthLvl1: 100,
    baseDamageLvl1: 3,
    healthIncreasePerLevel: 50, // ~358 HP at level 15
    damageIncreasePerLevel: 3, // ~20.4 Damage at level 15
    attackSpeed: 1.25, // 1 / 0.8 seconds
    baseXP: 120,
    baseAccuracyLvl1: 120, // Bosses tend to be accurate
    accuracyIncreasePerLevel: 10,
    spawnSoundPath: '/sounds/creatures/bosses/gralfor.wav',
    deathSoundPath: '/sounds/creatures/bosses/gralfordead.wav',
    isBoss: true,
    guaranteedItemDropBaseId: "serralheiro_unique_2h_sword",
    guaranteedItemDropRarity: "Único",
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
    accuracyIncreasePerLevel: 4,
    deathSoundPath: '/sounds/creatures/gorilla.wav'
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
    accuracyIncreasePerLevel: 5,
    deathSoundPath: '/sounds/creatures/skeleton.wav'
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
    accuracyIncreasePerLevel: 6,
    deathSoundPath: '/sounds/creatures/eyeball.wav'
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
    accuracyIncreasePerLevel: 5,
    deathSoundPath: '/sounds/creatures/snake.wav'
  },
  {
    id: 'merman',
    name: 'Tritão do Lago',
    iconPath: '/sprites/creatures/merman.png',
    damageType: 'physical', // Could add poison later
    baseHealthLvl1: 16, // Lower HP
    baseDamageLvl1: 2,
    healthIncreasePerLevel: 9,
    damageIncreasePerLevel: 3,
    attackSpeed: 1.8, // Fast attack
    baseXP: 14,
    baseAccuracyLvl1: 60,
    accuracyIncreasePerLevel: 5,
    deathSoundPath: '/sounds/creatures/snake.wav'
  }
];

// Location Data moved to data module
export { act1Locations } from "@/data/act1Locations";

// Utility function
export const calculateEnemyStats = (type: EnemyType, level: number): { health: number; damage: number; accuracy: number } => {
  const health = Math.max(1, Math.round(type.baseHealthLvl1 + ((level - 1) * type.healthIncreasePerLevel)));
  const damage = Math.max(1, Math.round(type.baseDamageLvl1 + ((level - 1) * type.damageIncreasePerLevel)));
  const accuracy = Math.max(10, Math.round(type.baseAccuracyLvl1 + ((level - 1) * type.accuracyIncreasePerLevel)));
  return { health, damage, accuracy };
};

// Helper para calcular mana máxima do mago por nível
export function calculateMageMaxMana(level: number, base: number = 50, perLevel: number = 7): number {
  return base + (level - 1) * perLevel;
}

// Placeholder Item interface
export interface Item { id: string; name?: string; }

// --- Item System Types ---

export type ItemRarity = "Normal" | "Mágico" | "Raro" | "Lendário" | "Único";

export enum ModifierType {
  // Prefixes
  IncreasedPhysicalDamage = "IncreasedPhysicalDamage",
  IncreasedLocalPhysicalDamage = "IncreasedLocalPhysicalDamage", // Weapon Only
  AddsFlatPhysicalDamage = "AddsFlatPhysicalDamage",
  AddsFlatFireDamage = "AddsFlatFireDamage",
  AddsFlatColdDamage = "AddsFlatColdDamage",
  AddsFlatLightningDamage = "AddsFlatLightningDamage",
  AddsFlatVoidDamage = "AddsFlatVoidDamage",
  // --- SPELL DAMAGE MODS ---
  AddsFlatSpellFireDamage = "AddsFlatSpellFireDamage",
  AddsFlatSpellColdDamage = "AddsFlatSpellColdDamage",
  AddsFlatSpellLightningDamage = "AddsFlatSpellLightningDamage",
  AddsFlatSpellVoidDamage = "AddsFlatSpellVoidDamage",
  IncreasedSpellDamage = "IncreasedSpellDamage",
  IncreasedCastSpeed = "IncreasedCastSpeed",
  IncreasedSpellCriticalStrikeChance = "IncreasedSpellCriticalStrikeChance",
  MaxHealth = "MaxHealth",
  MaxMana = "MaxMana", // <<< NOVO PREFIXO
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
  FlatManaRegen = "FlatManaRegen", // <<< NOVO SUFIXO
  PercentManaRegen = "PercentManaRegen", // <<< NOVO SUFIXO
  ManaShield = "ManaShield", // <<< NOVO SUFIXO DE CAPACETE
  ReducedLifeLeechRecovery = "ReducedLifeLeechRecovery", // Reduz recuperação de vida do leech
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
  ModifierType.MaxMana, // <<< NOVO PREFIXO
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
  ModifierType.FlatManaRegen, // <<< NOVO SUFIXO
  ModifierType.PercentManaRegen, // <<< NOVO SUFIXO
  ModifierType.ManaShield, // <<< NOVO SUFIXO DE CAPACETE
  ModifierType.PhysDamageTakenAsElement,
  ModifierType.ReducedPhysDamageTaken,
  ModifierType.IncreasedBlockChance,
  ModifierType.IncreasedMovementSpeed,
  ModifierType.ReducedLifeLeechRecovery,
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
  // Base stats relevant to the item type
  baseArmor?: number;
  baseEvasion?: number;
  baseBarrier?: number;
  baseAttackSpeed?: number;
  baseCriticalStrikeChance?: number;
  baseBlockChance?: number;
  baseStrength?: number; // Keep for Amulet/Belt bases
  baseDexterity?: number; // Keep for Amulet/Belt bases
  baseIntelligence?: number; // Keep for Amulet/Belt bases
  // --- Dano base para armas físicas/ranged ---
  baseMinDamage?: number;
  baseMaxDamage?: number;
  // --- Dano base para armas arcanas (ex: varinhas) ---
  baseSpellMinDamage?: number;
  baseSpellMaxDamage?: number;
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

export interface BaseItemTemplate {
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
  // --- Dano base para armas físicas/ranged ---
  baseMinDamage?: number;
  baseMaxDamage?: number;
  // --- Dano base para armas arcanas (ex: varinhas) ---
  baseSpellMinDamage?: number;
  baseSpellMaxDamage?: number;
  requirements?: { level?: number; strength?: number; dexterity?: number; intelligence?: number; };
  classification?: WeaponClassification;
  minLevel: number;
  maxLevel?: number;
  allowedModifiers: any[];
  implicitModifierPool?: { type: ModifierType; weight: number; }[];
  uniqueText?: string;
  bossDropOnly?: boolean;
  bossDropId?: string;
}

export interface EquippableItem extends BaseItem {
  baseId: string;
  modifiers: Modifier[];
  implicitModifier: Modifier | null;
  // Base stats are inherited via BaseItem spreading now
  uniqueText?: string;
}

// Helper function to determine tier based on item level (example)

// Combat-related types

export interface HitEffectType {
  id: string;
  type: 'slash' | 'pierce' | 'hit' | 'fire' | 'ice' | 'lightning' | 'poison';
} 

export const MODIFIER_DISPLAY_NAMES: Record<ModifierType, string> = {
  IncreasedPhysicalDamage: "Dano Físico",
  IncreasedLocalPhysicalDamage: "Dano Físico Local",
  AddsFlatPhysicalDamage: "Dano Físico Adicional para Ataques",
  AddsFlatFireDamage: "Dano de Fogo Adicional para Ataques",
  AddsFlatColdDamage: "Dano de Gelo Adicional para Ataques",
  AddsFlatLightningDamage: "Dano de Raios Adicional para Ataques",
  AddsFlatVoidDamage: "Dano de Vazio Adicional para Ataques",
  AddsFlatSpellFireDamage: "Dano de Fogo Arcano Adicional",
  AddsFlatSpellColdDamage: "Dano de Gelo Arcano Adicional",
  AddsFlatSpellLightningDamage: "Dano de Raios Arcano Adicional",
  AddsFlatSpellVoidDamage: "Dano de Vazio Arcano Adicional",
  IncreasedSpellDamage: "Dano Arcano",
  IncreasedCastSpeed: "Velocidade de Conjuração",
  IncreasedSpellCriticalStrikeChance: "Chance de Crítico Arcano",
  MaxHealth: "Vida Máxima",
  MaxMana: "Mana Máxima",
  FlatLocalArmor: "Armadura Local",
  IncreasedLocalArmor: "Armadura Local",
  FlatLocalEvasion: "Evasão Local",
  IncreasedLocalEvasion: "Evasão Local",
  FlatLocalBarrier: "Barreira Local",
  IncreasedLocalBarrier: "Barreira Local",
  ThornsDamage: "Dano de Espinhos",
  IncreasedGlobalAttackSpeed: "Velocidade de Ataque Global",
  IncreasedLocalAttackSpeed: "Velocidade de Ataque Local",
  IncreasedLocalCriticalStrikeChance: "Chance de Crítico Local",
  IncreasedGlobalCriticalStrikeChance: "Chance de Crítico Global",
  IncreasedCriticalStrikeMultiplier: "Multiplicador de Crítico",
  IncreasedBlockChance: "Chance de Bloqueio",
  IncreasedElementalDamage: "Dano Elemental",
  IncreasedFireDamage: "Dano de Fogo",
  IncreasedColdDamage: "Dano de Gelo",
  IncreasedLightningDamage: "Dano de Raios",
  IncreasedVoidDamage: "Dano de Vazio",
  LifeLeech: "% de dano roubado como vida",
  Strength: "Força",
  Dexterity: "Destreza",
  Intelligence: "Inteligência",
  FireResistance: "Resistência de Fogo",
  ColdResistance: "Resistência de Gelo",
  LightningResistance: "Resistência de Raios",
  VoidResistance: "Resistência de Vazio",
  FlatLifeRegen: "de Vida regenerada por segundo",
  PercentLifeRegen: "% da Vida regenerada por segundo",
  FlatManaRegen: "de Mana regenerada por segundo",
  PercentManaRegen: "% da Mana regenerada por segundo",
  ManaShield: "% do Dano Recebido Removido da Mana Primeiro",
  ReducedLifeLeechRecovery: "% de Recuperação de Vida por Roubo Reduzida",
  PhysDamageTakenAsElement: "% de Dano Físico Tomado como Elemental",
  ReducedPhysDamageTaken: "% de Dano Físico Tomado Reduzido",
  IncreasedMovementSpeed: "% de Velocidade de Movimento",
} 

// Adicionar ManaShield ao MODIFIER_DISPLAY_ORDER se necessário
export const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  IncreasedPhysicalDamage: 1,
  IncreasedLocalPhysicalDamage: 2,
  AddsFlatPhysicalDamage: 3,
  AddsFlatFireDamage: 4,
  AddsFlatColdDamage: 5,
  AddsFlatLightningDamage: 6,
  AddsFlatVoidDamage: 7,
  AddsFlatSpellFireDamage: 8,
  AddsFlatSpellColdDamage: 9,
  AddsFlatSpellLightningDamage: 10,
  AddsFlatSpellVoidDamage: 11,
  IncreasedSpellDamage: 12,
  IncreasedCastSpeed: 13,
  IncreasedSpellCriticalStrikeChance: 14,
  MaxHealth: 15,
  MaxMana: 16,
  FlatLocalArmor: 17,
  IncreasedLocalArmor: 18,
  FlatLocalEvasion: 19,
  IncreasedLocalEvasion: 20,
  FlatLocalBarrier: 21,
  IncreasedLocalBarrier: 22,
  ThornsDamage: 23,
  IncreasedGlobalAttackSpeed: 24,
  IncreasedLocalAttackSpeed: 25,
  IncreasedLocalCriticalStrikeChance: 26,
  IncreasedGlobalCriticalStrikeChance: 27,
  IncreasedCriticalStrikeMultiplier: 28,
  IncreasedBlockChance: 29,
  IncreasedElementalDamage: 30,
  IncreasedFireDamage: 31,
  IncreasedColdDamage: 32,
  IncreasedLightningDamage: 33,
  IncreasedVoidDamage: 34,
  LifeLeech: 35,
  Strength: 36,
  Dexterity: 37,
  Intelligence: 38,
  FireResistance: 39,
  ColdResistance: 40,
  LightningResistance: 41,
  VoidResistance: 42,
  FlatLifeRegen: 43,
  PercentLifeRegen: 44,
  FlatManaRegen: 45,
  PercentManaRegen: 46,
  ManaShield: 47,
  ReducedLifeLeechRecovery: 48,
  PhysDamageTakenAsElement: 49,
  ReducedPhysDamageTaken: 50,
  IncreasedMovementSpeed: 51,
}; 