import { Character, CharacterClass } from "../types/gameData";

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

  const newCharacter: Character = {
    id,
    name,
    class: charClass,
    level: 1,
    currentXP: 0,
    currentAct: 1,
    currentAreaId: "cidade_principal",
    unlockedAreaIds: ["cidade_principal"],
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
    attackDamage: 5,
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
  return newCharacter;
}; 