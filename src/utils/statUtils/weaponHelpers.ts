import { EquippableItem, Modifier } from "../../types/gameData";
import { BaseItemTemplate } from "../../types/gameData";

const UNARMED_ATTACK_SPEED = 1.0;

function getCurrentElementalInstance(): 'fogo' | 'gelo' | 'raio' {
  // TODO: Substituir por leitura real do store/contexto
  return 'gelo';
}

// Helper: Calcula stats locais de uma arma (apenas local mods, sem globais)
export function getWeaponLocalStats(weapon: EquippableItem | null | undefined, ALL_ITEM_BASES: BaseItemTemplate[]): {
  minPhys: number; maxPhys: number; minEle: number; maxEle: number; speed: number; crit: number; isSpellWeapon?: boolean; spellMin?: number; spellMax?: number;
  spellMinFire?: number; spellMaxFire?: number; spellMinCold?: number; spellMaxCold?: number; spellMinLightning?: number; spellMaxLightning?: number;
  isMeleeWeapon?: boolean;
} | null {
  if (!weapon) return null;
  const template = ALL_ITEM_BASES.find(t => t.baseId === weapon.baseId);
  if (!template) return null;

  const isSpellWeapon = weapon.classification === 'Spell';
  const isMeleeWeapon = weapon.classification === 'Melee';
  let baseMin = 0, baseMax = 0;
  if (isSpellWeapon) {
    baseMin = template.baseSpellMinDamage ?? 0;
    baseMax = template.baseSpellMaxDamage ?? 0;
    // Converter para o elemento da instância ativa
    const instance = getCurrentElementalInstance();
    let spellMinFire = 0, spellMaxFire = 0, spellMinCold = 0, spellMaxCold = 0, spellMinLightning = 0, spellMaxLightning = 0;
    if (instance === 'fogo') {
      spellMinFire = baseMin;
      spellMaxFire = baseMax;
    } else if (instance === 'gelo') {
      spellMinCold = baseMin;
      spellMaxCold = baseMax;
    } else if (instance === 'raio') {
      spellMinLightning = baseMin;
      spellMaxLightning = baseMax;
    }
    return {
      minPhys: 0,
      maxPhys: 0,
      minEle: 0,
      maxEle: 0,
      speed: template.baseAttackSpeed ?? UNARMED_ATTACK_SPEED,
      crit: template.baseCriticalStrikeChance ?? 6,
      isSpellWeapon: true,
      spellMin: baseMin,
      spellMax: baseMax,
      spellMinFire,
      spellMaxFire,
      spellMinCold,
      spellMaxCold,
      spellMinLightning,
      spellMaxLightning,
      isMeleeWeapon: false,
    };
  } else {
    baseMin = template.baseMinDamage ?? 0;
    baseMax = template.baseMaxDamage ?? 0;
  }
  const baseSpeed = template.baseAttackSpeed ?? UNARMED_ATTACK_SPEED;
  const baseCrit = template.baseCriticalStrikeChance ?? 5;

  let localFlatPhysMin = 0;
  let localFlatPhysMax = 0;
  let localIncreasePhysPercent = 0;
  let localIncreaseAttackSpeedPercent = 0;
  let localIncreaseCritChancePercent = 0;
  let localFlatMinEle = 0;
  let localFlatMaxEle = 0;
  // --- Spell-specific ---
  let localFlatSpellMin = 0;
  let localFlatSpellMax = 0;
  let localIncreaseSpellPercent = 0;
  let localIncreaseCastSpeedPercent = 0;
  let localIncreaseSpellCritPercent = 0;

  const processMod = (mod: Modifier) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage": localFlatPhysMin += mod.valueMin ?? 0; localFlatPhysMax += mod.valueMax ?? 0; break;
      case "AddsFlatFireDamage": case "AddsFlatColdDamage": case "AddsFlatLightningDamage": case "AddsFlatVoidDamage":
        localFlatMinEle += mod.valueMin ?? 0; localFlatMaxEle += mod.valueMax ?? 0; break;
      case "IncreasedLocalPhysicalDamage": localIncreasePhysPercent += mod.value ?? 0; break;
      case "IncreasedLocalAttackSpeed": localIncreaseAttackSpeedPercent += mod.value ?? 0; break;
      case "IncreasedLocalCriticalStrikeChance": localIncreaseCritChancePercent += mod.value ?? 0; break;
      // --- Spell mods ---
      case "AddsFlatSpellFireDamage": case "AddsFlatSpellColdDamage": case "AddsFlatSpellLightningDamage": case "AddsFlatSpellVoidDamage":
        localFlatSpellMin += mod.valueMin ?? 0; localFlatSpellMax += mod.valueMax ?? 0; break;
      case "IncreasedSpellDamage": localIncreaseSpellPercent += mod.value ?? 0; break;
      case "IncreasedCastSpeed": localIncreaseCastSpeedPercent += mod.value ?? 0; break;
      case "IncreasedSpellCriticalStrikeChance": localIncreaseSpellCritPercent += mod.value ?? 0; break;
    }
  };

  weapon.modifiers.forEach(processMod);
  if (weapon.implicitModifier) processMod(weapon.implicitModifier);

  if (isSpellWeapon) {
    let spellMin = (baseMin + localFlatSpellMin) * (1 + localIncreaseSpellPercent / 100);
    let spellMax = (baseMax + localFlatSpellMax) * (1 + localIncreaseSpellPercent / 100);
    spellMin = Math.max(0, Math.round(spellMin));
    spellMax = Math.max(spellMin, Math.round(spellMax));
    const finalSpeed = baseSpeed * (1 + localIncreaseCastSpeedPercent / 100);
    const finalCrit = baseCrit * (1 + localIncreaseSpellCritPercent / 100);
    return { minPhys: 0, maxPhys: 0, minEle: 0, maxEle: 0, speed: finalSpeed, crit: finalCrit, isSpellWeapon: true, spellMin, spellMax, isMeleeWeapon: false };
  }

  let finalMinPhys = (baseMin + localFlatPhysMin) * (1 + localIncreasePhysPercent / 100);
  let finalMaxPhys = (baseMax + localFlatPhysMax) * (1 + localIncreasePhysPercent / 100);
  finalMinPhys = Math.max(0, Math.round(finalMinPhys));
  finalMaxPhys = Math.max(finalMinPhys, Math.round(finalMaxPhys));

  const finalMinEle = Math.max(0, Math.round(localFlatMinEle));
  const finalMaxEle = Math.max(finalMinEle, Math.round(localFlatMaxEle));

  const finalSpeed = baseSpeed * (1 + localIncreaseAttackSpeedPercent / 100);
  const finalCrit = baseCrit * (1 + localIncreaseCritChancePercent / 100);

  return { minPhys: finalMinPhys, maxPhys: finalMaxPhys, minEle: finalMinEle, maxEle: finalMaxEle, speed: finalSpeed, crit: finalCrit, isMeleeWeapon: isMeleeWeapon };
}

// Helper: Retorna o breakdown de dano elemental do item (fire, cold, lightning, void)
export function getWeaponElementalBreakdown(weapon: EquippableItem | null | undefined): {
  minFire: number;
  maxFire: number;
  minCold: number;
  maxCold: number;
  minLightning: number;
  maxLightning: number;
  minVoid: number;
  maxVoid: number;
} {
  const result = { minFire: 0, maxFire: 0, minCold: 0, maxCold: 0, minLightning: 0, maxLightning: 0, minVoid: 0, maxVoid: 0 };
  if (!weapon) return result;
  const processMod = (mod: Modifier) => {
    switch (mod.type) {
      case "AddsFlatFireDamage": result.minFire += mod.valueMin ?? 0; result.maxFire += mod.valueMax ?? 0; break;
      case "AddsFlatColdDamage": result.minCold += mod.valueMin ?? 0; result.maxCold += mod.valueMax ?? 0; break;
      case "AddsFlatLightningDamage": result.minLightning += mod.valueMin ?? 0; result.maxLightning += mod.valueMax ?? 0; break;
      case "AddsFlatVoidDamage": result.minVoid += mod.valueMin ?? 0; result.maxVoid += mod.valueMax ?? 0; break;
      // --- Corrigir: considerar também os mods de spell elemental ---
      case "AddsFlatSpellFireDamage": result.minFire += mod.valueMin ?? 0; result.maxFire += mod.valueMax ?? 0; break;
      case "AddsFlatSpellColdDamage": result.minCold += mod.valueMin ?? 0; result.maxCold += mod.valueMax ?? 0; break;
      case "AddsFlatSpellLightningDamage": result.minLightning += mod.valueMin ?? 0; result.maxLightning += mod.valueMax ?? 0; break;
      case "AddsFlatSpellVoidDamage": result.minVoid += mod.valueMin ?? 0; result.maxVoid += mod.valueMax ?? 0; break;
    }
  };
  weapon.modifiers.forEach(processMod);
  if (weapon.implicitModifier) processMod(weapon.implicitModifier);
  return result;
}

// Aplica os bônus de instância elemental de forma global e granular
export function applyElementalInstanceBonusesToStats({
  stats,
  instance,
  hasManaForBonus = true,
}: {
  stats: {
    minPhys: number;
    maxPhys: number;
    minFire: number;
    maxFire: number;
    minCold: number;
    maxCold: number;
    minLightning: number;
    maxLightning: number;
    minVoid?: number;
    maxVoid?: number;
    castSpeed: number;
    attackSpeed: number;
    critChance: number;
    isSpell: boolean;
  };
  instance: 'fogo' | 'gelo' | 'raio';
  hasManaForBonus?: boolean;
}) {
  const { minFire, maxFire, minLightning, maxLightning, minVoid = 0, maxVoid = 0, isSpell } = stats;
  let { minPhys, maxPhys, minCold, maxCold, castSpeed, attackSpeed, critChance } = stats;

  // --- Conversão permanente de dano base ---
  if (instance === 'fogo') {
    // Dano base de spell vira fogo
    // (já feito no calculateEffectiveStats para spell, aqui só bônus)
  }
  if (instance === 'gelo') {
    if (!isSpell) {
      // Ataques físicos: converte 30% do dano físico em gelo
      const physToColdMin = minPhys * 0.3;
      const physToColdMax = maxPhys * 0.3;
      minPhys -= physToColdMin;
      maxPhys -= physToColdMax;
      minCold += physToColdMin;
      maxCold += physToColdMax;
    }
    // Para spell, conversão já ocorre no calculateEffectiveStats
  }

  // --- Bônus só se tiver mana ---
  if (hasManaForBonus) {
    if (instance === 'fogo') {
      castSpeed *= 1.25;
      attackSpeed *= 1.25;
    }
    if (instance === 'gelo') {
      if (isSpell) {
        minCold *= 1.3;
        maxCold *= 1.3;
      }
    }
    if (instance === 'raio') {
      if (critChance < 10) critChance = 10;
    }
  }

  return {
    minPhys,
    maxPhys,
    minFire,
    maxFire,
    minCold,
    maxCold,
    minLightning,
    maxLightning,
    minVoid,
    maxVoid,
    castSpeed,
    attackSpeed,
    critChance,
  };
} 