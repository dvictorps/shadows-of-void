import { Character, CharacterClass, EquippableItem } from "../types/gameData";

export const createCharacter = (
  id: number,
  name: string,
  charClass: CharacterClass,
  initialBaseHealth: number
): Character => {
  let baseStrength = 5;
  let baseDexterity = 5;
  let baseIntelligence = 5;

  switch (charClass) {
    case "Guerreiro":
      baseStrength = 10;
      break;
    case "Ladino":
      baseDexterity = 10;
      break;
    case "Mago":
      baseIntelligence = 10;
      break;
  }

  // Define the starting weapon
  const startingTwoHandedSword: EquippableItem = {
    id: `starter_2h_sword_${id}`, // Unique ID based on character
    name: "Espada Longa Gasta",
    itemType: "TwoHandedSword",
    baseId: "starter_2h_sword_base",
    rarity: "Normal",
    icon: "/sprites/two_handed_sword.png",
    modifiers: [],
    implicitModifier: null,
    requirements: { level: 1 },
    classification: "Melee",
  };

  const newCharacter: Character = {
    id,
    name,
    class: charClass,
    level: 1,
    currentXP: 0,
    currentAct: 1,
    currentAreaId: "cidade_principal",
    unlockedAreaIds: ["cidade_principal", "floresta_sombria"],
    // --- Determine starting health based on class --- 
    baseMaxHealth: initialBaseHealth,
    maxHealth: initialBaseHealth,
    currentHealth: initialBaseHealth,
    currentBarrier: 0,
    // ---------------------------
    strength: baseStrength,
    dexterity: baseDexterity,
    intelligence: baseIntelligence,
    armor: 0,
    evasion: 0,
    barrier: 0,
    blockChance: 0,
    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    voidResistance: 0,
    minBaseDamage: 1,
    maxBaseDamage: 1,
    criticalStrikeChance: 5,
    criticalStrikeMultiplier: 150,
    projectileDamage: 0,
    spellDamage: 0,
    fireDamage: 0,
    coldDamage: 0,
    lightningDamage: 0,
    voidDamage: 0,
    movementSpeed: 0,
    attackSpeed: 1,
    castSpeed: 1,
    healthPotions: 3,
    teleportStones: 0,
    inventory: [],
    equipment: {},
  };

  // Equip starting weapon for Warrior
  if (charClass === "Guerreiro") {
    // Create an instance from the starter template defined above
    const startingWeaponInstance: EquippableItem = {
        ...startingTwoHandedSword, // Spread the starter template details
        id: `starter_weapon_${id}`, // Override with a unique instance ID
    };
    newCharacter.equipment.weapon1 = startingWeaponInstance;
    newCharacter.equipment.weapon2 = null;
  } else if (charClass === "Ladino") {
    // Create an instance from the starter template defined above
    const startingWeaponInstance: EquippableItem = {
        ...startingTwoHandedSword, // Spread the starter template details
        id: `starter_weapon_${id}`, // Override with a unique instance ID
    };
    newCharacter.equipment.weapon1 = startingWeaponInstance;
    newCharacter.equipment.weapon2 = null;
  }

  return newCharacter;
};

// Function to create a new character
export const createNewCharacter = (id: number, name: string, charClass: CharacterClass): Character => {
    // Define base stats based on class
    let baseStats: Pick<Character, 'strength' | 'dexterity' | 'intelligence' | 'baseMaxHealth' | 'maxHealth' | 'minBaseDamage' | 'maxBaseDamage' | 'armor' | 'evasion' | 'barrier'>;

    // Base stats assignment logic...
    switch (charClass) {
        case "Guerreiro":
            baseStats = { strength: 12, dexterity: 8, intelligence: 5, baseMaxHealth: 60, maxHealth: 60, minBaseDamage: 3, maxBaseDamage: 5, armor: 10, evasion: 5, barrier: 0 };
            break;
        case "Ladino":
            baseStats = { strength: 8, dexterity: 12, intelligence: 5, baseMaxHealth: 50, maxHealth: 50, minBaseDamage: 2, maxBaseDamage: 4, armor: 5, evasion: 10, barrier: 0 };
            break;
        case "Mago":
            baseStats = { strength: 5, dexterity: 8, intelligence: 12, baseMaxHealth: 45, maxHealth: 45, minBaseDamage: 1, maxBaseDamage: 3, armor: 3, evasion: 5, barrier: 15 };
            break;
        default:
            throw new Error(`Classe de personagem desconhecida: ${charClass}`);
    }

    const newCharacter: Character = {
        id,
        name,
        class: charClass,
        level: 1,
        currentXP: 0,
        currentAct: 1,
        currentAreaId: "cidade_principal", 
        unlockedAreaIds: ["cidade_principal", "floresta_sombria"], 
        ...baseStats,
        currentHealth: baseStats.maxHealth, // Start with full health
        currentBarrier: baseStats.barrier, // <<< ADD Initial currentBarrier
        fireResistance: 0,
        coldResistance: 0,
        lightningResistance: 0,
        voidResistance: 0,
        criticalStrikeChance: 5, // Base 5%
        criticalStrikeMultiplier: 150, // Base 150% (1.5x)
        projectileDamage: 0,
        spellDamage: 0,
        fireDamage: 0,
        coldDamage: 0,
        lightningDamage: 0,
        voidDamage: 0,
        movementSpeed: 0,
        attackSpeed: 1.0,
        castSpeed: 1.0,
        healthPotions: 3, // Start with 3 potions
        teleportStones: 0, // <<< ADD INITIAL VALUE FOR teleportStones
        blockChance: 0, // Start with 0 block
        inventory: [],
        equipment: {},
    };

    return newCharacter;
}; 