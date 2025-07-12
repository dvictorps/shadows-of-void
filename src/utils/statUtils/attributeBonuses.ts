import { Character } from "../../types/gameData";

// Helper: Calcula bônus de atributos (força, destreza, inteligência) e seus efeitos
export function getAttributeBonuses(character: Character): {
  totalStrength: number;
  totalDexterity: number;
  totalIntelligence: number;
  physDamageBonus: number;
  evasionBonus: number;
  critChanceBonus: number;
  barrierBonus: number;
} {
  let totalBonusStrength = 0;
  let totalBonusDexterity = 0;
  let totalBonusIntelligence = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    for (const mod of item.modifiers) {
      if (mod.type === 'Strength') totalBonusStrength += mod.value ?? 0;
      if (mod.type === 'Dexterity') totalBonusDexterity += mod.value ?? 0;
      if (mod.type === 'Intelligence') totalBonusIntelligence += mod.value ?? 0;
    }
    if (item.implicitModifier) {
      if (item.implicitModifier.type === 'Strength') totalBonusStrength += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'Dexterity') totalBonusDexterity += item.implicitModifier.value ?? 0;
      if (item.implicitModifier.type === 'Intelligence') totalBonusIntelligence += item.implicitModifier.value ?? 0;
    }
  }
  const totalStrength = character.strength + totalBonusStrength;
  const totalDexterity = character.dexterity + totalBonusDexterity;
  const totalIntelligence = character.intelligence + totalBonusIntelligence;
  // Exemplo de efeitos (ajuste conforme sua lógica):
  const physDamageBonus = Math.floor(totalStrength / 5) * 2; // +2% dano físico por 5 força
  const evasionBonus = Math.floor(totalDexterity / 5) * 2; // +2% evasão por 5 destreza
  const critChanceBonus = Math.floor(totalDexterity / 5); // +1% crit global por 5 destreza
  const barrierBonus = Math.floor(totalIntelligence / 5) * 2; // +2% barreira por 5 int
  return { totalStrength, totalDexterity, totalIntelligence, physDamageBonus, evasionBonus, critChanceBonus, barrierBonus };
} 