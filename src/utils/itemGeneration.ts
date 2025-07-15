import { Modifier, ModifierType, BaseItemTemplate } from '../types/gameData';
import { ITEM_TYPE_MODIFIERS, PREFIX_MODIFIERS, SUFFIX_MODIFIERS } from '../constants/itemTypeModifiers';
import { MODIFIER_RANGES } from '../constants/modifierRanges';
import { getBiasedRandomInt, getAbsoluteMaxValue } from './modifierGeneration';
import { ONE_HANDED_WEAPON_TYPES, TWO_HANDED_WEAPON_TYPES } from './equipmentHelpers';

const TIER_LEVELS = [
  { start: 1, end: 20, index: 0 },
  { start: 21, end: 45, index: 1 },
  { start: 46, end: 100, index: 2 },
];

export const getItemTierInfo = (level: number): { start: number; end: number; index: number } => {
  return TIER_LEVELS.find(tier => level >= tier.start && level <= tier.end) ?? TIER_LEVELS[TIER_LEVELS.length - 1];
};

export function generateModifiers(baseItem: BaseItemTemplate, rarity: string, itemLevel: number): Modifier[] {
  // --- Determinar pools e lógica de geração de mods ---
  // (Lógica migrada do itemUtils.ts, ajustada para usar os novos arquivos de constantes)
  // 1. Determinar mods possíveis pelo tipo de item
  let possibleMods = ITEM_TYPE_MODIFIERS[baseItem.itemType] || [];
  // Lógica especial para anéis arcanos
  if (baseItem.baseId === 'skull_ring_t1' || baseItem.baseId === 'fire_ring_t1') {
    // Permitir apenas mods de flat damage arcano
    possibleMods = [
      ModifierType.MaxHealth,
      ModifierType.AddsFlatSpellFireDamage,
      ModifierType.AddsFlatSpellColdDamage,
      ModifierType.AddsFlatSpellLightningDamage,
      ModifierType.AddsFlatSpellVoidDamage,
      ModifierType.FireResistance,
      ModifierType.ColdResistance,
      ModifierType.LightningResistance,
      ModifierType.VoidResistance,
      ModifierType.Strength,
      ModifierType.Dexterity,
      ModifierType.Intelligence,
      ModifierType.ThornsDamage,
      ModifierType.IncreasedMovementSpeed,
      ModifierType.FlatLocalArmor,
      ModifierType.FlatLocalEvasion,
      ModifierType.FlatLocalBarrier,
      ModifierType.IncreasedGlobalCriticalStrikeChance,
      ModifierType.IncreasedCriticalStrikeMultiplier,
    ];
  }
  const allowedModifiers = (baseItem as { allowedModifiers?: { type?: string }[] }).allowedModifiers;
  if (Array.isArray(allowedModifiers) && allowedModifiers.length > 0) {
    const allowed = allowedModifiers.map((m) => m.type ?? m);
    possibleMods = possibleMods.filter(mod => allowed.includes(mod));
  }

  // 2. Filtragem especial para armaduras, evasão, barreira
  const isArmorBase = baseItem.baseArmor !== undefined && baseItem.baseArmor > 0;
  const isEvasionBase = baseItem.baseEvasion !== undefined && baseItem.baseEvasion > 0;
  const isBarrierBase = baseItem.baseBarrier !== undefined && baseItem.baseBarrier > 0;
  if (isArmorBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalEvasion", "IncreasedLocalEvasion", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
    );
  } else if (isEvasionBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalBarrier", "IncreasedLocalBarrier"].includes(mod)
    );
  } else if (isBarrierBase) {
    possibleMods = possibleMods.filter(mod =>
      !["FlatLocalArmor", "IncreasedLocalArmor", "FlatLocalEvasion", "IncreasedLocalEvasion",
        ModifierType.MaxHealth, ModifierType.FlatLifeRegen, ModifierType.PercentLifeRegen]
        .includes(mod)
    );
  }

  // 3. Filtrar mod global de dano físico para armas não lendárias
  const isWeapon = ONE_HANDED_WEAPON_TYPES.has(baseItem.itemType) || TWO_HANDED_WEAPON_TYPES.has(baseItem.itemType);
  if (isWeapon && rarity !== 'Lendário') {
    possibleMods = possibleMods.filter(modType => modType !== ModifierType.IncreasedPhysicalDamage);
  }

  if (!possibleMods.length) {
    return [];
  }

  // 4. Determinar número de prefixos/sufixos
  let numPrefixes = 0;
  let numSuffixes = 0;
  switch (rarity) {
    case "Mágico":
      const numTotalModsMagic = Math.random() < 0.5 ? 1 : 2;
      if (numTotalModsMagic === 1) {
        numPrefixes = Math.random() < 0.5 ? 1 : 0;
        numSuffixes = 1 - numPrefixes;
      } else {
        numPrefixes = 1;
        numSuffixes = 1;
      }
      break;
    case "Raro":
      let numPrefixesRaro = 1 + Math.floor(Math.random() * 3);
      let numSuffixesRaro = 1 + Math.floor(Math.random() * 3);
      let totalModsRaro = numPrefixesRaro + numSuffixesRaro;
      while (totalModsRaro < 4) {
        const canAddPrefix = numPrefixesRaro < 3;
        const canAddSuffix = numSuffixesRaro < 3;
        if (!canAddPrefix && !canAddSuffix) break;
        const addPrefixAttempt = Math.random() < 0.5;
        if (addPrefixAttempt && canAddPrefix) {
          numPrefixesRaro++;
          totalModsRaro++;
        } else if (canAddSuffix) {
          numSuffixesRaro++;
          totalModsRaro++;
        } else if (canAddPrefix) {
          numPrefixesRaro++;
          totalModsRaro++;
        }
      }
      numPrefixes = numPrefixesRaro;
      numSuffixes = numSuffixesRaro;
      break;
    case "Lendário":
      const numTotalModsLegendary = 5 + Math.floor(Math.random() * 2);
      if (numTotalModsLegendary === 5) {
        numPrefixes = Math.random() < 0.5 ? 3 : 2;
        numSuffixes = 5 - numPrefixes;
      } else {
        numPrefixes = 3;
        numSuffixes = 3;
      }
      break;
    default: return [];
  }

  // 5. Tier e bias
  const tierInfo = getItemTierInfo(itemLevel);
  const tierIndex = tierInfo.index;
  const levelProgress = (itemLevel - tierInfo.start) / Math.max(1, tierInfo.end - tierInfo.start);
  const biasFactor = Math.pow(Math.max(0, Math.min(1, levelProgress)), 2);

  // 6. Pesos especiais para escudos de barreira/tomo
  const generatedModifiers: Modifier[] = [];
  let modWeightMap: Record<string, number> | undefined;
  if ((baseItem.itemType === 'Shield' && isBarrierBase) || baseItem.itemType === 'Tome') {
    modWeightMap = {};
    for (const mod of possibleMods) {
      if (
        mod === ModifierType.FlatLocalBarrier ||
        mod === ModifierType.IncreasedLocalBarrier ||
        mod === ModifierType.IncreasedCastSpeed ||
        mod === ModifierType.IncreasedSpellDamage
      ) {
        modWeightMap[mod] = 4;
      } else {
        modWeightMap[mod] = 1;
      }
    }
  }
  let availablePrefixes: ModifierType[] = [];
  let availableSuffixes: ModifierType[] = [];
  if (((baseItem.itemType === 'Shield' && isBarrierBase) || baseItem.itemType === 'Tome') && modWeightMap) {
    for (const mod of possibleMods) {
      const weight = modWeightMap[mod] || 1;
      if (PREFIX_MODIFIERS.has(mod)) {
        for (let i = 0; i < weight; i++) availablePrefixes.push(mod);
      }
      if (SUFFIX_MODIFIERS.has(mod)) {
        for (let i = 0; i < weight; i++) availableSuffixes.push(mod);
      }
    }
  } else {
    availablePrefixes = possibleMods.filter((mod) => PREFIX_MODIFIERS.has(mod));
    availableSuffixes = possibleMods.filter((mod) => SUFFIX_MODIFIERS.has(mod));
  }

  // 7. Função de rolagem de valor
  const rollModifierValue = (modType: ModifierType) => {
    const tierRanges = MODIFIER_RANGES[modType];
    if (!tierRanges || tierRanges.length === 0) return;
    const currentTierRange = tierRanges[tierIndex];
    if (!currentTierRange) return;
    const baseMinForTier = currentTierRange.valueMin;
    const absoluteMax = getAbsoluteMaxValue(modType);
    const effectiveAbsoluteMax = absoluteMax ?? currentTierRange.valueMax;
    let scaledMax = baseMinForTier + (effectiveAbsoluteMax - baseMinForTier) * levelProgress;
    scaledMax = Math.min(effectiveAbsoluteMax, Math.max(baseMinForTier, scaledMax));
    const rollMin = baseMinForTier;
    const rollMax = Math.round(scaledMax);
    // Flat damage mods devem ser sempre range
    const isFlatDamage = [
      ModifierType.AddsFlatPhysicalDamage,
      ModifierType.AddsFlatFireDamage,
      ModifierType.AddsFlatColdDamage,
      ModifierType.AddsFlatLightningDamage,
      ModifierType.AddsFlatVoidDamage,
      ModifierType.AddsFlatSpellFireDamage,
      ModifierType.AddsFlatSpellColdDamage,
      ModifierType.AddsFlatSpellLightningDamage,
      ModifierType.AddsFlatSpellVoidDamage
    ].includes(modType);
    if (isFlatDamage) {
      const rolledMin = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      const rolledMax = getBiasedRandomInt(rolledMin, rollMax, biasFactor);
      generatedModifiers.push({
        type: modType,
        valueMin: Math.min(rolledMin, rolledMax),
        valueMax: Math.max(rolledMin, rolledMax)
      });
    } else if (modType === ModifierType.IncreasedPhysicalDamage) {
      const rolledMin = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      const rolledMax = getBiasedRandomInt(rolledMin, rollMax, biasFactor);
      generatedModifiers.push({
        type: modType,
        valueMin: Math.min(rolledMin, rolledMax),
        valueMax: Math.max(rolledMin, rolledMax)
      });
    } else {
      let value = getBiasedRandomInt(rollMin, rollMax, biasFactor);
      if (modType === ModifierType.LifeLeech && value < 1) {
        value = 1;
      }
      generatedModifiers.push({ type: modType, value });
    }
  };

  // 8. Gerar prefixos
  for (let i = 0; i < numPrefixes && availablePrefixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availablePrefixes.length);
    const modType = availablePrefixes[modIndex];
    rollModifierValue(modType);
    availablePrefixes = availablePrefixes.filter(m => m !== modType);
  }
  // 9. Gerar sufixos
  for (let i = 0; i < numSuffixes && availableSuffixes.length > 0; i++) {
    const modIndex = Math.floor(Math.random() * availableSuffixes.length);
    const modType = availableSuffixes[modIndex];
    rollModifierValue(modType);
    availableSuffixes = availableSuffixes.filter(m => m !== modType);
  }
  return generatedModifiers;
}