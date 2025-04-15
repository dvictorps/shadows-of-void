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
      { type: ModifierType.MaxHealth, minVal: 10, maxVal: 40 },
      { type: ModifierType.IncreasedLocalArmor, minVal: 5, maxVal: 15, isPercentage: true },
      { type: ModifierType.FlatLocalArmor, minVal: 5, maxVal: 20 },
      { type: ModifierType.ThornsDamage, minVal: 1, maxVal: 3 },
      // Suffixes
      { type: ModifierType.FireResistance, minVal: 5, maxVal: 18, isPercentage: true },
      { type: ModifierType.ColdResistance, minVal: 5, maxVal: 18, isPercentage: true },
      { type: ModifierType.LightningResistance, minVal: 5, maxVal: 18, isPercentage: true },
      { type: ModifierType.VoidResistance, minVal: 5, maxVal: 18, isPercentage: true },
      { type: ModifierType.FlatLifeRegen, minVal: 1, maxVal: 5 },
      { type: ModifierType.PercentLifeRegen, minVal: 0.1, maxVal: 0.5, isPercentage: true },
      { type: ModifierType.Strength, minVal: 1, maxVal: 7 },
      { type: ModifierType.Dexterity, minVal: 1, maxVal: 7 },
      { type: ModifierType.Intelligence, minVal: 1, maxVal: 7 },
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
      { type: ModifierType.MaxHealth, minVal: 40, maxVal: 70 },
      { type: ModifierType.IncreasedLocalArmor, minVal: 25, maxVal: 50, isPercentage: true },
      { type: ModifierType.FlatLocalArmor, minVal: 45, maxVal: 90 },
      { type: ModifierType.ThornsDamage, minVal: 5, maxVal: 20 },
      { type: ModifierType.FireResistance, minVal: 10, maxVal: 30, isPercentage: true },
      { type: ModifierType.ColdResistance, minVal: 10, maxVal: 30, isPercentage: true },
      { type: ModifierType.LightningResistance, minVal: 10, maxVal: 30, isPercentage: true },
      { type: ModifierType.VoidResistance, minVal: 10, maxVal: 30, isPercentage: true },
      { type: ModifierType.FlatLifeRegen, minVal: 10, maxVal: 20 },
      { type: ModifierType.PercentLifeRegen, minVal: 0.5, maxVal: 1.5, isPercentage: true },
      { type: ModifierType.Strength, minVal: 7, maxVal: 20 },
      { type: ModifierType.Dexterity, minVal: 7, maxVal: 20 },
      { type: ModifierType.Intelligence, minVal: 7, maxVal: 20 },
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
      { type: ModifierType.MaxHealth, minVal: 60, maxVal: 90 },
      { type: ModifierType.IncreasedLocalArmor, minVal: 45, maxVal: 80, isPercentage: true },
      { type: ModifierType.FlatLocalArmor, minVal: 45, maxVal: 130 },
      { type: ModifierType.ThornsDamage, minVal: 10, maxVal: 40 },
      { type: ModifierType.FireResistance, minVal: 20, maxVal: 45, isPercentage: true },
      { type: ModifierType.ColdResistance, minVal: 20, maxVal: 45, isPercentage: true },
      { type: ModifierType.LightningResistance, minVal: 20, maxVal: 45, isPercentage: true },
      { type: ModifierType.VoidResistance, minVal: 20, maxVal: 45, isPercentage: true },
      { type: ModifierType.FlatLifeRegen, minVal: 20, maxVal: 40 },
      { type: ModifierType.PercentLifeRegen, minVal: 1.0, maxVal: 2.0, isPercentage: true },
      { type: ModifierType.Strength, minVal: 10, maxVal: 30 },
      { type: ModifierType.Dexterity, minVal: 10, maxVal: 30 },
      { type: ModifierType.Intelligence, minVal: 10, maxVal: 30 },
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
        { type: ModifierType.AddsFlatPhysicalDamage, minVal: 1, maxVal: 5, isRange: true },
        { type: ModifierType.IncreasedPhysicalDamage, minVal: 5, maxVal: 15, isPercentage: true },
        { type: ModifierType.AddsFlatFireDamage, minVal: 1, maxVal: 5, isRange: true },
        { type: ModifierType.AddsFlatColdDamage, minVal: 1, maxVal: 5, isRange: true },
        { type: ModifierType.AddsFlatLightningDamage, minVal: 1, maxVal: 5, isRange: true },
        { type: ModifierType.AddsFlatVoidDamage, minVal: 1, maxVal: 5, isRange: true },
        { type: ModifierType.IncreasedGlobalAttackSpeed, minVal: 3, maxVal: 7, isPercentage: true },
        { type: ModifierType.IncreasedLocalCriticalStrikeChance, minVal: 5, maxVal: 10, isPercentage: true },
        { type: ModifierType.IncreasedCriticalStrikeMultiplier, minVal: 8, maxVal: 15, isPercentage: true },
        { type: ModifierType.LifeLeech, minVal: 1, maxVal: 2, isPercentage: true },
        { type: ModifierType.Strength, minVal: 1, maxVal: 7 },
        { type: ModifierType.Dexterity, minVal: 1, maxVal: 7 },
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
        { type: ModifierType.AddsFlatPhysicalDamage, minVal: 5, maxVal: 15, isRange: true },
        { type: ModifierType.IncreasedPhysicalDamage, minVal: 10, maxVal: 25, isPercentage: true },
        { type: ModifierType.AddsFlatFireDamage, minVal: 5, maxVal: 15, isRange: true },
        { type: ModifierType.AddsFlatColdDamage, minVal: 5, maxVal: 15, isRange: true },
        { type: ModifierType.AddsFlatLightningDamage, minVal: 5, maxVal: 15, isRange: true },
        { type: ModifierType.AddsFlatVoidDamage, minVal: 5, maxVal: 15, isRange: true },
        { type: ModifierType.IncreasedGlobalAttackSpeed, minVal: 5, maxVal: 10, isPercentage: true },
        { type: ModifierType.IncreasedLocalCriticalStrikeChance, minVal: 8, maxVal: 15, isPercentage: true },
        { type: ModifierType.IncreasedCriticalStrikeMultiplier, minVal: 12, maxVal: 20, isPercentage: true },
        { type: ModifierType.LifeLeech, minVal: 2, maxVal: 4, isPercentage: true },
        { type: ModifierType.Strength, minVal: 5, maxVal: 15 },
        { type: ModifierType.Dexterity, minVal: 5, maxVal: 15 },
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
        { type: ModifierType.AddsFlatPhysicalDamage, minVal: 10, maxVal: 30, isRange: true },
        { type: ModifierType.IncreasedPhysicalDamage, minVal: 20, maxVal: 40, isPercentage: true },
        { type: ModifierType.AddsFlatFireDamage, minVal: 10, maxVal: 30, isRange: true },
        { type: ModifierType.AddsFlatColdDamage, minVal: 10, maxVal: 30, isRange: true },
        { type: ModifierType.AddsFlatLightningDamage, minVal: 10, maxVal: 30, isRange: true },
        { type: ModifierType.AddsFlatVoidDamage, minVal: 10, maxVal: 30, isRange: true },
        { type: ModifierType.IncreasedGlobalAttackSpeed, minVal: 8, maxVal: 15, isPercentage: true },
        { type: ModifierType.IncreasedLocalCriticalStrikeChance, minVal: 12, maxVal: 20, isPercentage: true },
        { type: ModifierType.IncreasedCriticalStrikeMultiplier, minVal: 18, maxVal: 30, isPercentage: true },
        { type: ModifierType.LifeLeech, minVal: 3, maxVal: 5, isPercentage: true },
        { type: ModifierType.Strength, minVal: 10, maxVal: 25 },
        { type: ModifierType.Dexterity, minVal: 10, maxVal: 25 },
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