import { EquippableItem, ModifierType } from "../types/gameData";

// --- Define BaseModifierDefinition ---
interface BaseModifierDefinition {
    type: ModifierType;
    minVal: number;
    maxVal: number;
    isRange?: boolean; // For flat damage mods
    isPercentage?: boolean; // For percentage mods
}

// Update the type alias to include allowedModifiers
export type BaseItemTemplate = Omit<EquippableItem, 'id' | 'modifiers' | 'rarity'> & {
  minLevel: number; // Minimum area/monster level for this base to drop
  maxLevel?: number; // Optional max level
  allowedModifiers: BaseModifierDefinition[]; // Add this line
  requirements?: EquippableItem['requirements'];
  classification?: EquippableItem['classification']; // Ensure classification is here
};

// Change itemBases structure to be an array for easier filtering/mapping
// export const itemBases: Record<string, BaseItemTemplate> = { ... };
export const ALL_ITEM_BASES: BaseItemTemplate[] = [
  // --- Armaduras de Placas ---
  {
    baseId: "plate_armor_t1",
    name: "Armadura de Placas",
    itemType: "BodyArmor",
    icon: "/sprites/armour_plate.png",
    minLevel: 1,
    maxLevel: 19,
    baseArmor: 20,
    requirements: { level: 1, strength: 10 },
    allowedModifiers: [
      // Prefixes
      { type: "MaxHealth", minVal: 10, maxVal: 40 },
      { type: "IncreasedLocalArmor", minVal: 5, maxVal: 15, isPercentage: true },
      { type: "FlatLocalArmor", minVal: 5, maxVal: 20 },
      { type: "ThornsDamage", minVal: 1, maxVal: 3 },
      // Suffixes
      { type: "FireResistance", minVal: 5, maxVal: 18, isPercentage: true },
      { type: "ColdResistance", minVal: 5, maxVal: 18, isPercentage: true },
      { type: "LightningResistance", minVal: 5, maxVal: 18, isPercentage: true },
      { type: "VoidResistance", minVal: 5, maxVal: 18, isPercentage: true },
      { type: "FlatLifeRegen", minVal: 1, maxVal: 5 },
      { type: "PercentLifeRegen", minVal: 0.1, maxVal: 0.5, isPercentage: true },
      { type: "Strength", minVal: 1, maxVal: 7 },
      { type: "Dexterity", minVal: 1, maxVal: 7 },
      { type: "Intelligence", minVal: 1, maxVal: 7 },
    ]
  },
  {
    baseId: "plate_armor_t2",
    name: "Armadura de Placas Avançada",
    itemType: "BodyArmor",
    icon: "/sprites/armour_plate.png",
    minLevel: 20,
    maxLevel: 49,
    baseArmor: 80,
    requirements: { level: 20, strength: 50 },
    allowedModifiers: [
      { type: "MaxHealth", minVal: 40, maxVal: 70 },
      { type: "IncreasedLocalArmor", minVal: 25, maxVal: 50, isPercentage: true },
      { type: "FlatLocalArmor", minVal: 45, maxVal: 90 },
      { type: "ThornsDamage", minVal: 5, maxVal: 20 },
      { type: "FireResistance", minVal: 10, maxVal: 30, isPercentage: true },
      { type: "ColdResistance", minVal: 10, maxVal: 30, isPercentage: true },
      { type: "LightningResistance", minVal: 10, maxVal: 30, isPercentage: true },
      { type: "VoidResistance", minVal: 10, maxVal: 30, isPercentage: true },
      { type: "FlatLifeRegen", minVal: 10, maxVal: 20 },
      { type: "PercentLifeRegen", minVal: 0.5, maxVal: 1.5, isPercentage: true },
      { type: "Strength", minVal: 7, maxVal: 20 },
      { type: "Dexterity", minVal: 7, maxVal: 20 },
      { type: "Intelligence", minVal: 7, maxVal: 20 },
    ]
  },
  {
    baseId: "plate_armor_t3",
    name: "Armadura de Placas Expert",
    itemType: "BodyArmor",
    icon: "/sprites/armour_plate.png",
    minLevel: 50,
    baseArmor: 300,
    requirements: { level: 50, strength: 100 },
    allowedModifiers: [
      { type: "MaxHealth", minVal: 60, maxVal: 90 },
      { type: "IncreasedLocalArmor", minVal: 45, maxVal: 80, isPercentage: true },
      { type: "FlatLocalArmor", minVal: 45, maxVal: 130 },
      { type: "ThornsDamage", minVal: 10, maxVal: 40 },
      { type: "FireResistance", minVal: 20, maxVal: 45, isPercentage: true },
      { type: "ColdResistance", minVal: 20, maxVal: 45, isPercentage: true },
      { type: "LightningResistance", minVal: 20, maxVal: 45, isPercentage: true },
      { type: "VoidResistance", minVal: 20, maxVal: 45, isPercentage: true },
      { type: "FlatLifeRegen", minVal: 20, maxVal: 40 },
      { type: "PercentLifeRegen", minVal: 1.0, maxVal: 2.0, isPercentage: true },
      { type: "Strength", minVal: 10, maxVal: 30 },
      { type: "Dexterity", minVal: 10, maxVal: 30 },
      { type: "Intelligence", minVal: 10, maxVal: 30 },
    ]
  },

  // --- Espadas de Duas Mãos ---
  {
    baseId: 'basic_two_handed_sword',
    name: 'Espada de Duas Mãos',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: 'sprites/two_handed_sword.png',
    baseMinDamage: 5,
    baseMaxDamage: 10,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5, // Add base crit chance
    minLevel: 1,
    maxLevel: 19, // Example max level
    requirements: { level: 1, strength: 10 }, // Add level requirement
    allowedModifiers: [
        { type: 'AddsFlatPhysicalDamage', minVal: 1, maxVal: 5, isRange: true },
        { type: 'IncreasedPhysicalDamage', minVal: 5, maxVal: 15, isPercentage: true },
        { type: 'AddsFlatFireDamage', minVal: 1, maxVal: 5, isRange: true },
        { type: 'AddsFlatColdDamage', minVal: 1, maxVal: 5, isRange: true },
        { type: 'AddsFlatLightningDamage', minVal: 1, maxVal: 5, isRange: true },
        { type: 'AddsFlatVoidDamage', minVal: 1, maxVal: 5, isRange: true },
        { type: 'AttackSpeed', minVal: 3, maxVal: 7, isPercentage: true },
        { type: 'IncreasedLocalCriticalStrikeChance', minVal: 5, maxVal: 10, isPercentage: true },
        { type: 'IncreasedCriticalStrikeMultiplier', minVal: 8, maxVal: 15, isPercentage: true },
        { type: 'LifeLeech', minVal: 1, maxVal: 2, isPercentage: true },
        { type: 'Strength', minVal: 1, maxVal: 7 },
        { type: 'Dexterity', minVal: 1, maxVal: 7 },
    ]
  },
  {
    baseId: 'advanced_two_handed_sword',
    name: 'Espada de Duas Mãos Avançada',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: 'sprites/two_handed_sword.png',
    baseMinDamage: 20,
    baseMaxDamage: 40,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5,
    minLevel: 20,
    maxLevel: 44,
    requirements: { level: 20, strength: 50 },
    allowedModifiers: [ // Define appropriate mods/ranges for T2 sword
        { type: 'AddsFlatPhysicalDamage', minVal: 5, maxVal: 15, isRange: true },
        { type: 'IncreasedPhysicalDamage', minVal: 10, maxVal: 25, isPercentage: true },
        { type: 'AddsFlatFireDamage', minVal: 5, maxVal: 15, isRange: true },
        { type: 'AddsFlatColdDamage', minVal: 5, maxVal: 15, isRange: true },
        { type: 'AddsFlatLightningDamage', minVal: 5, maxVal: 15, isRange: true },
        { type: 'AddsFlatVoidDamage', minVal: 5, maxVal: 15, isRange: true },
        { type: 'AttackSpeed', minVal: 5, maxVal: 10, isPercentage: true },
        { type: 'IncreasedLocalCriticalStrikeChance', minVal: 8, maxVal: 15, isPercentage: true },
        { type: 'IncreasedCriticalStrikeMultiplier', minVal: 12, maxVal: 20, isPercentage: true },
        { type: 'LifeLeech', minVal: 2, maxVal: 4, isPercentage: true },
        { type: 'Strength', minVal: 5, maxVal: 15 },
        { type: 'Dexterity', minVal: 5, maxVal: 15 },
    ]
  },
  {
    baseId: 'expert_two_handed_sword',
    name: 'Espada de Duas Mãos Expert',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: 'sprites/two_handed_sword.png',
    baseMinDamage: 40,
    baseMaxDamage: 80,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5,
    minLevel: 45,
    requirements: { level: 45, strength: 100 },
    allowedModifiers: [ // Define appropriate mods/ranges for T3 sword
        { type: 'AddsFlatPhysicalDamage', minVal: 10, maxVal: 30, isRange: true },
        { type: 'IncreasedPhysicalDamage', minVal: 20, maxVal: 40, isPercentage: true },
        { type: 'AddsFlatFireDamage', minVal: 10, maxVal: 30, isRange: true },
        { type: 'AddsFlatColdDamage', minVal: 10, maxVal: 30, isRange: true },
        { type: 'AddsFlatLightningDamage', minVal: 10, maxVal: 30, isRange: true },
        { type: 'AddsFlatVoidDamage', minVal: 10, maxVal: 30, isRange: true },
        { type: 'AttackSpeed', minVal: 8, maxVal: 15, isPercentage: true },
        { type: 'IncreasedLocalCriticalStrikeChance', minVal: 12, maxVal: 20, isPercentage: true },
        { type: 'IncreasedCriticalStrikeMultiplier', minVal: 18, maxVal: 30, isPercentage: true },
        { type: 'LifeLeech', minVal: 3, maxVal: 5, isPercentage: true },
        { type: 'Strength', minVal: 10, maxVal: 25 },
        { type: 'Dexterity', minVal: 10, maxVal: 25 },
    ]
  },
];

// Helper para pegar bases elegíveis por nível
export function getEligibleItemBases(
    dropLevel: number,
    itemTypeFilter?: string
): BaseItemTemplate[] {
    return ALL_ITEM_BASES.filter(base => // Use the new array name
        base.minLevel <= dropLevel &&
        (base.maxLevel === undefined || dropLevel <= base.maxLevel) &&
        (!itemTypeFilter || base.itemType === itemTypeFilter)
    );
} 