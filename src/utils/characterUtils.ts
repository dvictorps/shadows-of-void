import { Character } from "../types/gameData";

export const createCharacter = (id: number, name: string): Character => {
  const newCharacter: Character = {
    id,
    name,
    class: "Guerreiro",
    level: 1,
    currentXP: 0,
    currentAct: 1,
    currentAreaId: "cidade_principal",
    unlockedAreaIds: ["cidade_principal"],
    strength: 10,
    dexterity: 8,
    intelligence: 5,
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
  };
  return newCharacter;
}; 