import { Character, CharacterClass, EquippableItem, ModifierType } from "../types/gameData";
import { ALL_ITEM_BASES } from "../data/items"; // Import item bases

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
    strength: baseStrength,
    dexterity: baseDexterity,
    intelligence: baseIntelligence,
    baseMaxHealth: initialBaseHealth, // Use passed initial health
    maxHealth: initialBaseHealth,
    currentHealth: initialBaseHealth, // Start with full health
    currentBarrier: 0, 
    maxMana: 0, // Add mana default
    currentMana: 0, // Add mana default
    armor: 0,
    evasion: 0,
    barrier: 0,
    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    voidResistance: 0,
    minBaseDamage: 1, // Default unarmed?
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
    attackSpeed: 1.0,
    castSpeed: 1.0,
    healthPotions: 3,
    teleportStones: 0,
    blockChance: 0,
    inventory: [],
    equipment: {}, // Initialize empty equipment
  };

  // Equip starting weapon for Warrior and Rogue (using the existing logic)
  if (charClass === "Guerreiro" || charClass === "Ladino") {
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
    // Define base stats based on class - Removed 'barrier' from Pick
    let baseStats: Pick<Character, 'strength' | 'dexterity' | 'intelligence' | 'baseMaxHealth' | 'maxHealth' | 'minBaseDamage' | 'maxBaseDamage' | 'armor' | 'evasion' | 'barrier' | 'maxMana' | 'currentMana'>;

    switch (charClass) {
        case "Guerreiro":
            baseStats = { strength: 23, dexterity: 8, intelligence: 5, baseMaxHealth: 60, maxHealth: 60, minBaseDamage: 3, maxBaseDamage: 5, armor: 10, evasion: 5, barrier: 0, maxMana: 0, currentMana: 0 };
            break;
        case "Ladino":
            baseStats = { strength: 8, dexterity: 20, intelligence: 8, baseMaxHealth: 50, maxHealth: 50, minBaseDamage: 2, maxBaseDamage: 4, armor: 5, evasion: 10, barrier: 0, maxMana: 0, currentMana: 0 };
            break;
        case "Mago":
            baseStats = { strength: 5, dexterity: 5, intelligence: 25, baseMaxHealth: 25, maxHealth: 25, minBaseDamage: 1, maxBaseDamage: 3, armor: 3, evasion: 5, barrier: 0, maxMana: 50, currentMana: 50 };
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
        currentHealth: baseStats.maxHealth,
        currentBarrier: baseStats.barrier,
        fireResistance: 0,
        coldResistance: 0,
        lightningResistance: 0,
        voidResistance: 0,
        maxMana: baseStats.maxMana,
        currentMana: baseStats.currentMana,
        criticalStrikeChance: 5,
        criticalStrikeMultiplier: 150,
        projectileDamage: 0,
        spellDamage: 0,
        fireDamage: 0,
        coldDamage: 0,
        lightningDamage: 0,
        voidDamage: 0,
        movementSpeed: 0,
        attackSpeed: 1.0,
        castSpeed: 1.0,
        healthPotions: 3,
        teleportStones: 0,
        blockChance: 0,
        inventory: [],
        equipment: {},
    };

    // --- Define and Equip Starting Items ---
    const starterRobeBase = ALL_ITEM_BASES.find(b => b.baseId === "barrier_armour_t1");
    const starterSwordBase = ALL_ITEM_BASES.find(b => b.baseId === "1h_sword_t1");

    if (!starterRobeBase || !starterSwordBase) {
        console.error("Error: Could not find starter item bases (barrier_armour_t1 or 1h_sword_t1).");
        // Retorna o personagem sem itens se as bases não forem encontradas
    } else {
        switch (charClass) {
            case "Guerreiro":
                const warriorSword: EquippableItem = {
                    id: `starter_sword_${id}`,
                    name: starterSwordBase.name,
                    itemType: starterSwordBase.itemType,
                    baseId: starterSwordBase.baseId,
                    icon: starterSwordBase.icon,
                    rarity: "Normal",
                    requirements: starterSwordBase.requirements,
                    classification: starterSwordBase.classification,
                    implicitModifier: null,
                    modifiers: [],
                    // Não copia base stats aqui
                };
                newCharacter.equipment.weapon1 = warriorSword;
                break;
            case "Ladino":
                 const rogueSword: EquippableItem = {
                    id: `starter_sword_${id}`,
                    name: starterSwordBase.name,
                    itemType: starterSwordBase.itemType,
                    baseId: starterSwordBase.baseId,
                    icon: starterSwordBase.icon,
                    rarity: "Normal",
                    requirements: starterSwordBase.requirements,
                    classification: starterSwordBase.classification,
                    implicitModifier: null,
                    modifiers: [],
                    // Não copia base stats aqui
                };
                newCharacter.equipment.weapon1 = rogueSword;
                break;
            case "Mago":
                const mageRobe: EquippableItem = {
                    id: `starter_robe_${id}`,
                    name: starterRobeBase.name,
                    itemType: starterRobeBase.itemType,
                    baseId: starterRobeBase.baseId,
                    icon: starterRobeBase.icon,
                    rarity: "Normal",
                    requirements: starterRobeBase.requirements,
                    classification: starterRobeBase.classification,
                    implicitModifier: { type: ModifierType.FlatLocalBarrier, value: 40 },
                    modifiers: [],
                    // Não copia base stats aqui
                };
                newCharacter.equipment.bodyArmor = mageRobe;
                break;
        }
    }
    // -------------------------------------

    return newCharacter;
}; 