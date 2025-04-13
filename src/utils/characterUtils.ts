import { Character, CharacterClass, EquippableItem } from "../types/gameData";

export const createCharacter = (
  id: number,
  name: string,
  charClass: CharacterClass
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
    baseId: "2h_sword_t1", // Added placeholder baseId
    rarity: "Normal", // Changed from Branco
    icon: "/sprites/two_handed_sword.png", // Updated icon path
    baseMinDamage: 3, // Adjusted starting damage
    baseMaxDamage: 6, // Adjusted starting damage
    baseAttackSpeed: 0.9, // Moved from baseStats
    modifiers: [],
    requirements: { level: 1, strength: 10 }, // Added requirements object
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
    armor: 0,
    evasion: 0,
    barrier: 0,
    blockChance: 0,
    maxHealth: 50,
    currentHealth: 50,
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
    inventory: [],
    equipment: {},
  };

  // Equip starting weapon for Warrior
  if (charClass === "Guerreiro") {
    newCharacter.equipment.weapon1 = startingTwoHandedSword;
    newCharacter.equipment.weapon2 = null; // Ensure off-hand is empty
  }

  return newCharacter;
}; 