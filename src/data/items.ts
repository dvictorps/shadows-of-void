import { ModifierType, BaseItemTemplate } from "../types/gameData";

// Change itemBases structure to be an array for easier filtering/mapping
// export const itemBases: Record<string, BaseItemTemplate> = { ... };
export const ALL_ITEM_BASES: BaseItemTemplate[] = [
  // --- Armaduras de Placas (Rebalanced) ---
  {
    baseId: "plate_armor_t1",
    name: "Armadura de Placas",
    itemType: "BodyArmor",
    icon: "/sprites/armours/armour/armour_plate.png",
    minLevel: 1,
    maxLevel: 19,
    baseArmor: 50, // <<< REBALANCED
    requirements: { level: 1, strength: 10 },
    allowedModifiers: []
  },
  {
    baseId: "plate_armor_t2",
    name: "Armadura de Placas Avançada",
    itemType: "BodyArmor",
    icon: "/sprites/armours/armour/armour_plate.png",
    minLevel: 20,
    maxLevel: 49,
    baseArmor: 150, // <<< REBALANCED
    requirements: { level: 20, strength: 50 },
    allowedModifiers: []
  },
  {
    baseId: "plate_armor_t3",
    name: "Armadura de Placas Expert",
    itemType: "BodyArmor",
    icon: "/sprites/armours/armour/armour_plate.png",
    minLevel: 50,
    baseArmor: 400, // <<< REBALANCED
    requirements: { level: 50, strength: 100 },
    allowedModifiers: []
  },

  // --- Armaduras de Evasão (Rebalanced) ---
  {
    baseId: "evasion_plate_t1", // Keep baseId for now, maybe rename later?
    name: "Peitoral de Couro",
    itemType: "BodyArmor",
    icon: "/sprites/armours/evasion/evasion_armour.png",
    minLevel: 1,
    maxLevel: 19,
    baseEvasion: 75, // <<< REBALANCED
    requirements: { level: 1, dexterity: 10 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_plate_t2",
    name: "Peitoral de Couro Avançado",
    itemType: "BodyArmor",
    icon: "/sprites/armours/evasion/evasion_armour.png",
    minLevel: 20,
    maxLevel: 49,
    baseEvasion: 225, // <<< REBALANCED
    requirements: { level: 20, dexterity: 50 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_plate_t3",
    name: "Peitoral de Couro Expert",
    itemType: "BodyArmor",
    icon: "/sprites/armours/evasion/evasion_armour.png",
    minLevel: 50,
    baseEvasion: 600, // <<< REBALANCED
    requirements: { level: 50, dexterity: 100 },
    allowedModifiers: []
  },

  // --- Armaduras de Barreira (NEW) ---
  {
    baseId: "barrier_armour_t1",
    name: "Robe de Seda",
    itemType: "BodyArmor",
    icon: "/sprites/armours/barrier/barrier_armour.png", // Use pattern
    minLevel: 1,
    maxLevel: 19,
    baseBarrier: 40, // <<< Changed from 60 to 40
    requirements: { level: 1, intelligence: 10 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_armour_t2",
    name: "Robe de Seda Avançado",
    itemType: "BodyArmor",
    icon: "/sprites/armours/barrier/barrier_armour.png",
    minLevel: 20,
    maxLevel: 49,
    baseBarrier: 180,
    requirements: { level: 20, intelligence: 50 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_armour_t3",
    name: "Robe de Seda Expert",
    itemType: "BodyArmor",
    icon: "/sprites/armours/barrier/barrier_armour.png",
    minLevel: 50,
    baseBarrier: 480,
    requirements: { level: 50, intelligence: 100 },
    allowedModifiers: []
  },

  // --- Espadas de Duas Mãos (Normais) ---
  {
    baseId: 'basic_two_handed_sword', // Template normal T1
    name: 'Espada de Duas Mãos',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/weapons/melee/two_handed_sword.png',
    baseMinDamage: 10,
    baseMaxDamage: 18,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5.5,
    minLevel: 1,
    maxLevel: 19,
    requirements: { level: 1, strength: 10, dexterity: 8 }, // <<< Added dexterity requirement
    allowedModifiers: []
  },
  {
    baseId: 'heavy_2h_sword_t1',
    name: 'Espada Pesada',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/weapons/melee/heavy_long_sword.png',
    baseMinDamage: 15,
    baseMaxDamage: 30,
    baseAttackSpeed: 0.8, // Same as basic 2h sword
    baseCriticalStrikeChance: 5.5,
    minLevel: 10, // <<< CHANGED from 1
    maxLevel: 19, // Tier 1
    requirements: { level: 1, strength: 12 }, // Keep level 1 req to wield, but drops later
    allowedModifiers: []
  },
  {
    baseId: 'advanced_two_handed_sword',
    name: 'Espada de Duas Mãos Avançada',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/weapons/melee/two_handed_sword.png',
    baseMinDamage: 20,
    baseMaxDamage: 40,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5.5,
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
    icon: '/sprites/weapons/melee/two_handed_sword.png',
    baseMinDamage: 40,
    baseMaxDamage: 80,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5.5,
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
    icon: '/sprites/weapons/melee/one_handed_sword.png',
    baseMinDamage: 5,
    baseMaxDamage: 10,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5.5,
    minLevel: 1,
    maxLevel: 19,
    requirements: { level: 1, dexterity: 8, strength: 8 }, // Updated requirements
    allowedModifiers: []
  },
  {
    baseId: '1h_sword_t2',
    name: 'Espada Curta de Aço Avançado',
    itemType: 'OneHandedSword',
    classification: "Melee",
    icon: '/sprites/weapons/melee/one_handed_sword.png',
    baseMinDamage: 15,
    baseMaxDamage: 30,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5.5,
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
    icon: '/sprites/weapons/melee/one_handed_sword.png',
    baseMinDamage: 35,
    baseMaxDamage: 70,
    baseAttackSpeed: 1.1,
    baseCriticalStrikeChance: 5.5,
    minLevel: 45,
    requirements: { level: 45, dexterity: 70 },
    allowedModifiers: []
  },

  // --- <<< ADD ONE-HANDED AXES >>> ---
  {
    baseId: '1h_axe_t1',
    name: 'Machado de Mão',
    itemType: 'OneHandedAxe',
    classification: "Melee",
    icon: '/sprites/weapons/melee/one_handed_axe.png',
    baseMinDamage: 6,
    baseMaxDamage: 11,
    baseAttackSpeed: 1.0,
    baseCriticalStrikeChance: 5,
    minLevel: 1,
    maxLevel: 19,
    requirements: { level: 1, strength: 5 }, // Small str req
    allowedModifiers: []
  },
  // --- <<< END ONE-HANDED AXES >>> ---

  // --- <<< ADD TWO-HANDED AXES >>> ---
  {
    baseId: '2h_axe_t1',
    name: 'Machado de Lenhador',
    itemType: 'TwoHandedAxe', // <<< TYPE
    classification: "Melee",
    icon: '/sprites/weapons/melee/two_handed_axe.png', // <<< TODO: Add correct icon path
    baseMinDamage: 12,
    baseMaxDamage: 22, // Slightly higher avg damage than 2H Sword T1?
    baseAttackSpeed: 0.75, // Slower than 2H Sword
    baseCriticalStrikeChance: 4, // Slightly lower crit?
    minLevel: 1,
    maxLevel: 19,
    requirements: { level: 1, strength: 12 }, // Higher str req than 1H Axe
    allowedModifiers: []
  },
  // --- <<< END TWO-HANDED AXES >>> ---

  // --- <<< ADICIONAR CAPACETES AQUI >>> ---
  {
    baseId: "plate_helm_t1", // ID da base
    name: "Elmo de Placas",    // Nome exibido
    itemType: "Helm",         // TIPO CORRETO
    icon: "/sprites/armours/armour/armour_helmet.png", // Ícone
    minLevel: 1,              // Nível mínimo para dropar
    maxLevel: 24,             // Nível máximo (exemplo)
    baseArmor: 30,            // Armadura base
    requirements: { level: 1, strength: 10 }, // Requisitos
    allowedModifiers: []      // Defina os modificadores permitidos depois
  },
  {
    baseId: "plate_helm_t2",
    name: "Elmo de Placas Avançado",
    itemType: "Helm",
    icon: "/sprites/armours/armour/armour_helmet.png",
    minLevel: 25,
    maxLevel: 49,
    baseArmor: 90,            // Armadura base
    requirements: { level: 25, strength: 40 },
    allowedModifiers: []
  },
  {
    baseId: "plate_helm_t3",
    name: "Elmo de Placas Expert",
    itemType: "Helm",
    icon: "/sprites/armours/armour/armour_helmet.png",
    minLevel: 50,
    baseArmor: 240,            // Armadura base
    requirements: { level: 50, strength: 80 },
    allowedModifiers: []
  },

  // --- Evasion Helms ---
  {
    baseId: "evasion_helm_t1",
    name: "Capuz de Couro",
    itemType: "Helm",
    icon: "/sprites/armours/evasion/evasion_helmet.png",
    minLevel: 1,
    maxLevel: 24,
    baseEvasion: 45,            // Evasion base
    requirements: { level: 1, dexterity: 10 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_helm_t2",
    name: "Capuz de Couro Avançado",
    itemType: "Helm",
    icon: "/sprites/armours/evasion/evasion_helmet.png",
    minLevel: 25,
    maxLevel: 49,
    baseEvasion: 135,            // Evasion base
    requirements: { level: 25, dexterity: 40 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_helm_t3",
    name: "Capuz de Couro Expert",
    itemType: "Helm",
    icon: "/sprites/armours/evasion/evasion_helmet.png",
    minLevel: 50,
    baseEvasion: 360,            // Evasion base
    requirements: { level: 50, dexterity: 80 },
    allowedModifiers: []
  },

  // --- Barrier Helms (NEW) ---
  {
    baseId: "barrier_helmet_t1",
    name: "Tiara de Seda",
    itemType: "Helm",
    icon: "/sprites/armours/barrier/barrier_helmet.png",
    minLevel: 1,
    maxLevel: 24,
    baseBarrier: 36,
    requirements: { level: 1, intelligence: 10 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_helmet_t2",
    name: "Tiara de Seda Avançada",
    itemType: "Helm",
    icon: "/sprites/armours/barrier/barrier_helmet.png",
    minLevel: 25,
    maxLevel: 49,
    baseBarrier: 108,
    requirements: { level: 25, intelligence: 40 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_helmet_t3",
    name: "Tiara de Seda Expert",
    itemType: "Helm",
    icon: "/sprites/armours/barrier/barrier_helmet.png",
    minLevel: 50,
    baseBarrier: 288,
    requirements: { level: 50, intelligence: 80 },
    allowedModifiers: []
  },

  // --- <<< JEWELRY SECTION >>> ---
  // --- Rings (No maxLevel) ---
  {
    baseId: "emerald_ring_t1",
    name: "Anel de Esmeralda",
    itemType: "Ring",
    icon: "/sprites/jewelry/rings/emerald_ring.png",
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
    icon: "/sprites/jewelry/rings/saphire_ring.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.AddsFlatPhysicalDamage, weight: 5 },
      { type: ModifierType.AddsFlatFireDamage, weight: 5 },
      { type: ModifierType.AddsFlatColdDamage, weight: 5 },
      { type: ModifierType.AddsFlatLightningDamage, weight: 5 },
      { type: ModifierType.AddsFlatVoidDamage, weight: 1 },
    ]
  },
  {
    baseId: "fire_ring_t1",
    name: "Anel de Fogo",
    itemType: "Ring",
    icon: "/sprites/jewelry/rings/fire_ring.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.IncreasedCastSpeed, weight: 1 },
      { type: ModifierType.AddsFlatSpellFireDamage, weight: 5 },
    ]
  },
  {
    baseId: "skull_ring_t1",
    name: "Anel do Oculto",
    itemType: "Ring",
    icon: "/sprites/jewelry/rings/skull_ring.png",
    minLevel: 1,
    requirements: { level: 1 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.IncreasedCastSpeed, weight: 1 },
      { type: ModifierType.IncreasedSpellDamage, weight: 1 },
      { type: ModifierType.AddsFlatSpellFireDamage, weight: 5 },
      { type: ModifierType.AddsFlatSpellColdDamage, weight: 5 },
      { type: ModifierType.AddsFlatSpellLightningDamage, weight: 5 },
      { type: ModifierType.AddsFlatSpellVoidDamage, weight: 5 },
    ]
  },

  // --- Belts (New Bases, No maxLevel) ---
  {
    baseId: "crystal_belt_t1",
    name: "Cinto de Cristal",
    itemType: "Belt",
    icon: "/sprites/jewelry/belts/crystal_belt.png",
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
    icon: "/sprites/jewelry/belts/knowledge_belt.png",
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
    icon: "/sprites/jewelry/amulets/crystal_amulet.png",
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
    icon: "/sprites/jewelry/amulets/knowledge_amulet.png",
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
  
  // --- <<< GLOVES SECTION (Rebalanced & Added Barrier) >>> ---
  // --- Armor Gloves ---
  {
    baseId: "plate_gloves_t1",
    name: "Manoplas Pesadas",
    itemType: "Gloves",
    icon: "/sprites/armours/armour/armour_gloves.png",
    minLevel: 4,
    maxLevel: 20,
    baseArmor: 20,            // Armadura base
    requirements: { level: 4, strength: 10 },
    allowedModifiers: []
  },
  {
    baseId: "plate_gloves_t2",
    name: "Manoplas Pesadas Avançadas",
    itemType: "Gloves",
    icon: "/sprites/armours/armour/armour_gloves.png",
    minLevel: 21,
    maxLevel: 46,
    baseArmor: 60,            // Armadura base
    requirements: { level: 21, strength: 35 },
    allowedModifiers: []
  },
  {
    baseId: "plate_gloves_t3",
    name: "Manoplas Pesadas Expert",
    itemType: "Gloves",
    icon: "/sprites/armours/armour/armour_gloves.png",
    minLevel: 47,
    baseArmor: 160,            // Armadura base
    requirements: { level: 47, strength: 75 },
    allowedModifiers: []
  },
  // --- Evasion Gloves ---
  {
    baseId: "evasion_gloves_t1",
    name: "Luvas de Couro",
    itemType: "Gloves",
    icon: "/sprites/armours/evasion/evasion_gloves.png",
    minLevel: 4,
    maxLevel: 20,
    baseEvasion: 30,            // Evasion base
    requirements: { level: 4, dexterity: 10 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_gloves_t2",
    name: "Luvas de Couro Avançadas",
    itemType: "Gloves",
    icon: "/sprites/armours/evasion/evasion_gloves.png",
    minLevel: 21,
    maxLevel: 46,
    baseEvasion: 90,            // Evasion base
    requirements: { level: 21, dexterity: 35 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_gloves_t3",
    name: "Luvas de Couro Expert",
    itemType: "Gloves",
    icon: "/sprites/armours/evasion/evasion_gloves.png",
    minLevel: 47,
    baseEvasion: 240,            // Evasion base
    requirements: { level: 47, dexterity: 75 },
    allowedModifiers: []
  },

  // --- Barrier Gloves (NEW) ---
  {
    baseId: "barrier_gloves_t1",
    name: "Luvas de Seda",
    itemType: "Gloves",
    icon: "/sprites/armours/barrier/barrier_gloves.png",
    minLevel: 4,
    maxLevel: 20,
    baseBarrier: 24,
    requirements: { level: 4, intelligence: 10 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_gloves_t2",
    name: "Luvas de Seda Avançadas",
    itemType: "Gloves",
    icon: "/sprites/armours/barrier/barrier_gloves.png",
    minLevel: 21,
    maxLevel: 46,
    baseBarrier: 72,
    requirements: { level: 21, intelligence: 35 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_gloves_t3",
    name: "Luvas de Seda Expert",
    itemType: "Gloves",
    icon: "/sprites/armours/barrier/barrier_gloves.png",
    minLevel: 47,
    baseBarrier: 192,
    requirements: { level: 47, intelligence: 75 },
    allowedModifiers: []
  },

  // --- <<< BOOTS SECTION (Rebalanced & Added Barrier) >>> ---
  // --- Armor Boots ---
  {
    baseId: "plate_boots_t1",
    name: "Botas Pesadas de Placas",
    itemType: "Boots",
    icon: "/sprites/armours/armour/armour_boots.png",
    minLevel: 3,
    maxLevel: 20,
    baseArmor: 20,            // Armadura base
    requirements: { level: 3, strength: 10 },
    allowedModifiers: []
  },
  {
    baseId: "plate_boots_t2",
    name: "Botas Pesadas Avançadas",
    itemType: "Boots",
    icon: "/sprites/armours/armour/armour_boots.png",
    minLevel: 21,
    maxLevel: 46,
    baseArmor: 60,            // Armadura base
    requirements: { level: 21, strength: 35 },
    allowedModifiers: []
  },
  {
    baseId: "plate_boots_t3",
    name: "Botas Pesadas Expert",
    itemType: "Boots",
    icon: "/sprites/armours/armour/armour_boots.png",
    minLevel: 47,
    baseArmor: 160,            // Armadura base
    requirements: { level: 47, strength: 75 },
    allowedModifiers: []
  },
  // --- Evasion Boots ---
  {
    baseId: "evasion_boots_t1",
    name: "Botas de Couro",
    itemType: "Boots",
    icon: "/sprites/armours/evasion/evasion_boots.png",
    minLevel: 3,
    maxLevel: 20,
    baseEvasion: 30,            // Evasion base
    requirements: { level: 3, dexterity: 10 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_boots_t2",
    name: "Botas de Couro Avançadas",
    itemType: "Boots",
    icon: "/sprites/armours/evasion/evasion_boots.png",
    minLevel: 21,
    maxLevel: 46,
    baseEvasion: 90,            // Evasion base
    requirements: { level: 21, dexterity: 35 },
    allowedModifiers: []
  },
  {
    baseId: "evasion_boots_t3",
    name: "Botas de Couro Expert",
    itemType: "Boots",
    icon: "/sprites/armours/evasion/evasion_boots.png",
    minLevel: 47,
    baseEvasion: 240,            // Evasion base
    requirements: { level: 47, dexterity: 75 },
    allowedModifiers: []
  },

  // --- Barrier Boots (NEW) ---
  {
    baseId: "barrier_boots_t1",
    name: "Sapatos de Seda",
    itemType: "Boots",
    icon: "/sprites/armours/barrier/barrier_boots.png",
    minLevel: 3,
    maxLevel: 20,
    baseBarrier: 24,
    requirements: { level: 3, intelligence: 10 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_boots_t2",
    name: "Sapatos de Seda Avançados",
    itemType: "Boots",
    icon: "/sprites/armours/barrier/barrier_boots.png",
    minLevel: 21,
    maxLevel: 46,
    baseBarrier: 72,
    requirements: { level: 21, intelligence: 35 },
    allowedModifiers: []
  },
  {
    baseId: "barrier_boots_t3",
    name: "Sapatos de Seda Expert",
    itemType: "Boots",
    icon: "/sprites/armours/barrier/barrier_boots.png",
    minLevel: 47,
    baseBarrier: 192,
    requirements: { level: 47, intelligence: 75 },
    allowedModifiers: []
  },

  // --- <<< SHIELDS SECTION (Ensure present) >>> ---
  {
    baseId: 'plate_shield_t1',
    name: 'Escudo de Placas',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/armour_shield.png',
    minLevel: 5, // Let's make shields drop slightly later
    maxLevel: 22,
    baseArmor: 30, // Shields have armor
    baseBlockChance: 15, // Base block
    requirements: { level: 5, strength: 15 },
    allowedModifiers: []
  },
  {
    baseId: 'plate_shield_t2',
    name: 'Escudo de Placas Avançado',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/armour_shield.png',
    minLevel: 23,
    maxLevel: 48,
    baseArmor: 90,
    baseBlockChance: 20,
    requirements: { level: 23, strength: 45 },
    allowedModifiers: []
  },
  {
    baseId: 'plate_shield_t3',
    name: 'Escudo de Placas Expert',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/armour_shield.png',
    minLevel: 49,
    baseArmor: 250,
    baseBlockChance: 25,
    requirements: { level: 49, strength: 90 },
    allowedModifiers: []
  },
  // --- Barrier Shield (Escudo de Barreira) ---
  {
    baseId: 'barrier_shield_t1',
    name: 'Escudo de Barreira',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/barrier_shield.png',
    minLevel: 5,
    maxLevel: 22,
    baseBarrier: 24, // Valor inicial, balanceado
    baseBlockChance: 15, // Igual ao plate_shield_t1
    requirements: { level: 5, intelligence: 15 },
    allowedModifiers: [],
  },
  {
    baseId: 'barrier_shield_t2',
    name: 'Escudo de Barreira Avançado',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/barrier_shield.png',
    minLevel: 23,
    maxLevel: 48,
    baseBarrier: 72,
    baseBlockChance: 20,
    requirements: { level: 23, intelligence: 45 },
    allowedModifiers: [],
  },
  {
    baseId: 'barrier_shield_t3',
    name: 'Escudo de Barreira Expert',
    itemType: 'Shield',
    icon: '/sprites/offhands/shields/barrier_shield.png',
    minLevel: 49,
    baseBarrier: 192,
    baseBlockChance: 25,
    requirements: { level: 49, intelligence: 90 },
    allowedModifiers: [],
  },

  // --- Espada Inicial (Não dropa) ---
  {
    baseId: 'starter_2h_sword_base',
    name: 'Espada Longa Gasta',
    itemType: 'TwoHandedSword',
    classification: "Melee",
    icon: '/sprites/weapons/melee/two_handed_sword.png',
    baseMinDamage: 3,
    baseMaxDamage: 6,
    baseAttackSpeed: 0.8,
    baseCriticalStrikeChance: 5,
    minLevel: 1,
    maxLevel: 1, // Keep maxLevel 1
    requirements: { level: 1 },
    allowedModifiers: [] // No mods allowed on starter
  },
  {
    baseId: 'starter_wand_base',
    name: 'Varinha de Aprendiz',
    itemType: 'Wand',
    classification: 'Spell',
    icon: '/sprites/weapons/spells/wand.png',
    baseSpellMinDamage: 5,
    baseSpellMaxDamage: 10,
    baseAttackSpeed: 1.0,
    baseCriticalStrikeChance: 6.0, // Base crit para spells
    minLevel: 1,
    requirements: { level: 1, intelligence: 10 },
    allowedModifiers: [],
  },

  // --- Cajado Arcano (Staff) ---
  {
    baseId: 'arcane_staff_base',
    name: 'Cajado Arcano',
    itemType: 'Staff',
    classification: 'Spell',
    icon: '/sprites/weapons/spells/magical_sceptre.png',
    baseSpellMinDamage: 15, // buffado de 10 para 15
    baseSpellMaxDamage: 30, // buffado de 20 para 30
    baseAttackSpeed: 0.7, // reduzido de 0.9 para 0.7
    baseCriticalStrikeChance: 6.0,
    minLevel: 1,
    requirements: { level: 1, intelligence: 15 },
    allowedModifiers: [],
  },

  // --- Cajado de Fogo (Fire Staff) ---
  {
    baseId: 'fire_staff_base',
    name: 'Cajado de Fogo',
    itemType: 'Staff',
    classification: 'Spell',
    icon: '/sprites/weapons/spells/fire_staff.png',
    baseSpellMinDamage: 15, // buffado de 10 para 15
    baseSpellMaxDamage: 30, // buffado de 20 para 30
    baseAttackSpeed: 0.7, // reduzido de 0.9 para 0.7
    baseCriticalStrikeChance: 6.0,
    minLevel: 1,
    requirements: { level: 1, intelligence: 15 },
    allowedModifiers: [],
    implicitModifierPool: [
      { type: ModifierType.IncreasedFireDamage, weight: 1 },
      { type: ModifierType.IncreasedColdDamage, weight: 1 },
    ]
  },

  // --- Tomo Arcano (Tome, Offhand Spell Weapon) ---
  {
    baseId: 'protector_tome_base',
    name: 'Tomo do Protetor',
    itemType: 'Tome',
    classification: 'Spell', // Arma arcana
    icon: '/sprites/offhands/tomes/protector_tome.png',
    minLevel: 5,
    requirements: { level: 5, intelligence: 20 },
    allowedModifiers: [], // Mods explícitos definidos na pool de escudo
    implicitModifierPool: [
      { type: ModifierType.IncreasedCastSpeed, weight: 2 },
      { type: ModifierType.IncreasedSpellDamage, weight: 2 },
      { type: ModifierType.IncreasedFireDamage, weight: 1 },
      { type: ModifierType.IncreasedColdDamage, weight: 1 },
      { type: ModifierType.IncreasedLightningDamage, weight: 1 },
    ]
  },

  // --- ITEM ÚNICO: Vingança do Serralheiro ---
  {
    baseId: "serralheiro_unique_2h_sword",
    name: "Vingança do Serralheiro, Espada de duas mãos",
    itemType: "TwoHandedSword",
    classification: "Melee",
    icon: "/sprites/weapons/melee/unique/revenge.png",
    baseMinDamage: 45,
    baseMaxDamage: 90,
    baseAttackSpeed: 1.2,
    baseCriticalStrikeChance: 5.5,
    minLevel: 1,
    requirements: { level: 1, strength: 20 },
    allowedModifiers: [], // Não permite mods aleatórios
    uniqueText: "O serralheiro lembra",
    bossDropOnly: true,
    bossDropId: "ice_dragon_boss",
  },

];

export type { BaseItemTemplate };