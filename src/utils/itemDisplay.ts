import { Modifier, ModifierType, ItemRarity } from '../types/gameData';
import { MODIFIER_DISPLAY_NAMES } from '../constants/modifierDisplayNames';

export const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  IncreasedPhysicalDamage: 10,
  IncreasedLocalPhysicalDamage: 15,
  AddsFlatPhysicalDamage: 20,
  AddsFlatFireDamage: 30,
  AddsFlatColdDamage: 40,
  AddsFlatLightningDamage: 50,
  AddsFlatVoidDamage: 60,
  AddsFlatSpellFireDamage: 31,
  AddsFlatSpellColdDamage: 41,
  AddsFlatSpellLightningDamage: 51,
  AddsFlatSpellVoidDamage: 61,
  IncreasedSpellDamage: 155,
  IncreasedCastSpeed: 156,
  IncreasedSpellCriticalStrikeChance: 157,
  MaxHealth: 70,
  MaxMana: 71,
  FlatLocalArmor: 80,
  IncreasedLocalArmor: 85,
  FlatLocalEvasion: 90,
  IncreasedLocalEvasion: 95,
  FlatLocalBarrier: 100,
  IncreasedLocalBarrier: 105,
  ThornsDamage: 110,
  IncreasedGlobalAttackSpeed: 120,
  IncreasedLocalAttackSpeed: 120,
  IncreasedLocalCriticalStrikeChance: 130,
  IncreasedGlobalCriticalStrikeChance: 135,
  IncreasedCriticalStrikeMultiplier: 140,
  IncreasedBlockChance: 145,
  IncreasedElementalDamage: 150,
  IncreasedFireDamage: 151,
  IncreasedColdDamage: 152,
  IncreasedLightningDamage: 153,
  IncreasedVoidDamage: 154,
  LifeLeech: 160,
  FireResistance: 170,
  ColdResistance: 180,
  LightningResistance: 190,
  VoidResistance: 200,
  FlatLifeRegen: 210,
  PercentLifeRegen: 215,
  FlatManaRegen: 216,
  PercentManaRegen: 217,
  ManaShield: 218,
  PhysDamageTakenAsElement: 220,
  ReducedPhysDamageTaken: 230,
  IncreasedMovementSpeed: 235,
  Strength: 240,
  Dexterity: 250,
  Intelligence: 260,
  ReducedLifeLeechRecovery: 52,
};

export const getRarityBorderClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "border-gray-600";
  switch (rarity) {
    case "Normal": return "border-gray-600";
    case "Lendário": return "border-red-600";
    case "Raro": return "border-yellow-400";
    case "Mágico": return "border-blue-500";
    case "Único": return "border-orange-500";
    default: return "border-gray-600";
  }
};

export const getRarityTextColorClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "text-white";
  switch (rarity) {
    case "Normal": return "text-white";
    case "Lendário": return "text-red-500";
    case "Raro": return "text-yellow-400";
    case "Mágico": return "text-blue-400";
    case "Único": return "text-orange-400";
    default: return "text-white";
  }
};

export const getRarityInnerGlowClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "";
  switch (rarity) {
    case "Normal": return "";
    case "Lendário": return "[box-shadow:inset_0_0_10px_2px_rgba(220,38,38,0.6)]";
    case "Raro": return "[box-shadow:inset_0_0_10px_2px_rgba(250,204,21,0.6)]";
    case "Mágico": return "[box-shadow:inset_0_0_10px_2px_rgba(96,165,250,0.6)]";
    case "Único": return "[box-shadow:inset_0_0_10px_2px_rgba(251,146,60,0.7)]";
    default: return "";
  }
};

export const getModifierText = (mod: Modifier): string => {
  const name = MODIFIER_DISPLAY_NAMES[mod.type] || mod.type;
  if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
    const nameWithoutPrefix = name.replace("Adiciona ", "");
    return `${nameWithoutPrefix}: ${mod.valueMin}-${mod.valueMax}`;
  }
  const value = mod.value !== undefined ? mod.value : "?";
  if (mod.type === ModifierType.IncreasedLocalArmor) return `+${value}% Armadura Aumentada`;
  if (mod.type === ModifierType.IncreasedLocalEvasion) return `+${value}% Evasão Aumentada`;
  if (mod.type === ModifierType.IncreasedLocalBarrier) return `+${value}% Barreira Aumentada`;
  if (mod.type === ModifierType.IncreasedLocalPhysicalDamage) return `+${value}% Dano Físico Aumentado`;
  if (mod.type === ModifierType.FlatLocalArmor) return `+${value} Armadura`;
  if (mod.type === ModifierType.FlatLocalEvasion) return `+${value} Evasão`;
  if (mod.type === ModifierType.FlatLocalBarrier) return `+${value} Barreira`;
  if (mod.type.includes('Increased')) {
    const displayName = (MODIFIER_DISPLAY_NAMES[mod.type] || mod.type).replace('Local', '').replace('Global', '').replace(/\s+/g, ' ').trim();
    return `+${value}% ${displayName}`;
  }
  if (mod.type === ModifierType.FlatLifeRegen || mod.type === ModifierType.FlatManaRegen) return `${value} ${name}`;
  if (mod.type === ModifierType.PercentLifeRegen || mod.type === ModifierType.PercentManaRegen) return `${value}% ${name}`;
  if (name.includes("%") || name.includes("Roubado") || name.includes("Resistência") || name.includes("Chance") || name.includes("Multiplicador") || name.includes("Redução") || name.includes("Dano de Fogo") || name.includes("Dano de Gelo") || name.includes("Dano de Raios") || name.includes("Dano de Vazio")) {
    const isNegative = typeof value === 'number' && value < 0;
    const absValue = isNegative ? Math.abs(Number(value)) : value;
    const suffix = "%";
    const prefix = isNegative ? "-" : "+";
    const namePart = name.replace("% ", "").replace("%", "").trim();
    if (mod.type === ModifierType.LifeLeech) return `${value}% ${namePart}`;
    if (mod.type === ModifierType.PhysDamageTakenAsElement || mod.type === ModifierType.ReducedPhysDamageTaken) {
      const isNegative = typeof value === 'number' && value < 0;
      const absValue = isNegative ? Math.abs(Number(value)) : value;
      const prefix = isNegative ? '-' : '+';
      return `${prefix}${absValue}% ${namePart}`;
    }
    if (isNegative && (mod.type === ModifierType.IncreasedFireDamage || mod.type === ModifierType.IncreasedColdDamage || mod.type === ModifierType.IncreasedLightningDamage || mod.type === ModifierType.IncreasedVoidDamage)) return `-${absValue}% ${namePart} Reduzido`;
    return `${prefix}${absValue}${suffix} ${namePart}`;
  }
  if (mod.type === ModifierType.ThornsDamage) return `${value} ${MODIFIER_DISPLAY_NAMES[mod.type]}`;
  else if (mod.type === "ReducedLifeLeechRecovery") return `-${mod.value ?? 0}% Recuperação de Vida por Roubo`;
  else return `+${value} ${name}`;
}; 