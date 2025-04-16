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
  baseMinDamage?: number; // For weapon templates
  baseMaxDamage?: number; // For weapon templates
  requirements?: { level?: number; strength?: number; dexterity?: number; intelligence?: number; };
  classification?: EquippableItem['classification'];
  // Template specific fields
  minLevel: number;
  maxLevel?: number;
  allowedModifiers: BaseModifierDefinition[];
  implicitModifierPool?: { type: ModifierType; weight: number; }[];
}

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
    allowedModifiers: []
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
    allowedModifiers: []
  },
  {
    baseId: "plate_armor_t3",
    name: "Armadura de Placas Expert",
    itemType: "BodyArmor",
    icon: "/sprites/armour_plate.png",
    minLevel: 50,
    baseArmor: 300,
    requirements: { level: 50, strength: 100 },
    allowedModifiers: []
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
    allowedModifiers: []
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
    allowedModifiers: []
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
    allowedModifiers: []
  },

  // --- Espadas de Uma Mão ---
  {
    baseId: '1h_sword_t1',
    name: 'Espada Curta de Aço',
    itemType: 'OneHandedSword',
    classification: "Melee",
    icon: '/sprites/one_handed_sword.png',
    baseMinDamage: 5,
    baseMaxDamage: 10,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5,
    minLevel: 1,
    maxLevel: 19,
    requirements: { level: 1 },
    allowedModifiers: []
  },
  {
    baseId: '1h_sword_t2',
    name: 'Espada Curta de Aço Avançado',
    itemType: 'OneHandedSword',
    classification: "Melee",
    icon: '/sprites/one_handed_sword.png',
    baseMinDamage: 15,
    baseMaxDamage: 30,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5,
    minLevel: 20,
    maxLevel: 44,
    requirements: { level: 20, dexterity: 25 },
    allowedModifiers: []
  },
  {
    baseId: '1h_sword_t3',
    name: 'Espada Curta de Aço Expert',
    itemType: 'OneHandedSword',
    classification: "Melee",
    icon: '/sprites/one_handed_sword.png',
    baseMinDamage: 35,
    baseMaxDamage: 70,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5,
    minLevel: 45,
    requirements: { level: 45, dexterity: 70 },
    allowedModifiers: []
  },

  // --- <<< ADICIONAR CAPACETES AQUI >>> ---
  {
    baseId: "plate_helm_t1", // ID da base
    name: "Elmo de Placas",    // Nome exibido
    itemType: "Helm",         // TIPO CORRETO
    icon: "/sprites/armour_helmet.png", // Ícone
    minLevel: 1,              // Nível mínimo para dropar
    maxLevel: 24,             // Nível máximo (exemplo)
    baseArmor: 50,            // Armadura base
    requirements: { level: 1, strength: 10 }, // Requisitos
    allowedModifiers: []      // Defina os modificadores permitidos depois
  },
  {
    baseId: "plate_helm_t2",
    name: "Elmo de Placas Avançado",
    itemType: "Helm",
    icon: "/sprites/armour_helmet.png",
    minLevel: 25,
    maxLevel: 49,
    baseArmor: 100,
    requirements: { level: 25, strength: 40 },
    allowedModifiers: []
  },
  {
    baseId: "plate_helm_t3",
    name: "Elmo de Placas Expert",
    itemType: "Helm",
    icon: "/sprites/armour_helmet.png",
    minLevel: 50,
    baseArmor: 200,
    requirements: { level: 50, strength: 80 },
    allowedModifiers: []
  },

  // --- <<< JEWELRY SECTION >>> ---
  // --- Rings (No maxLevel) ---
  {
    baseId: "emerald_ring_t1",
    name: "Anel de Esmeralda",
    itemType: "Ring",
    icon: "/sprites/emerald_ring.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.FireResistance, weight: 3 },
      { type: ModifierType.ColdResistance, weight: 3 },
      { type: ModifierType.LightningResistance, weight: 3 },
      { type: ModifierType.VoidResistance, weight: 1 },
    ]
  },
  {
    baseId: "saphire_ring_t1",
    name: "Anel de Safira",
    itemType: "Ring",
    icon: "/sprites/saphire_ring.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.AddsFlatPhysicalDamage, weight: 3 },
      { type: ModifierType.AddsFlatFireDamage, weight: 3 },
      { type: ModifierType.AddsFlatColdDamage, weight: 3 },
      { type: ModifierType.AddsFlatLightningDamage, weight: 3 },
      { type: ModifierType.AddsFlatVoidDamage, weight: 1 },
    ]
  },

  // --- Belts (New Bases, No maxLevel) ---
  {
    baseId: "crystal_belt_t1",
    name: "Cinto de Cristal",
    itemType: "Belt",
    icon: "/sprites/crystal_belt.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.FlatLocalArmor, weight: 1 },
      { type: ModifierType.FlatLocalEvasion, weight: 1 },
      { type: ModifierType.FlatLocalBarrier, weight: 1 },
      { type: ModifierType.MaxHealth, weight: 1 },
    ]
  },
  {
    baseId: "knowledge_belt_t1",
    name: "Cinto do Conhecimento",
    itemType: "Belt",
    icon: "/sprites/knowledge_belt.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.Strength, weight: 1 },
      { type: ModifierType.Dexterity, weight: 1 },
      { type: ModifierType.Intelligence, weight: 1 },
    ]
  },

   // --- Amulets (New Bases, No maxLevel) ---
  {
    baseId: "crystal_amulet_t1",
    name: "Amuleto de Cristal",
    itemType: "Amulet",
    icon: "/sprites/crystal_amulet.png",
    minLevel: 5,
    requirements: { level: 5 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.FlatLocalArmor, weight: 1 },
      { type: ModifierType.FlatLocalEvasion, weight: 1 },
      { type: ModifierType.FlatLocalBarrier, weight: 1 },
      { type: ModifierType.MaxHealth, weight: 1 },
    ]
  },
   {
    baseId: "knowledge_amulet_t1",
    name: "Amuleto do Conhecimento",
    itemType: "Amulet",
    icon: "/sprites/knowledge_amulet.png",
    minLevel: 5,
    requirements: { level: 5 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.Strength, weight: 1 },
      { type: ModifierType.Dexterity, weight: 1 },
      { type: ModifierType.Intelligence, weight: 1 },
    ]
  },
 
  // --- <<< END JEWELRY SECTION >>> ---
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