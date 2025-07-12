import { Character, EquippableItem, ModifierType, Modifier } from "../../types/gameData";

// Helper: Acumula todos os mods globais do personagem (exceto locais de arma)
export function getGlobalModifiers(character: Character): Modifier[] {
  const allMods: Modifier[] = [];
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    // Adiciona todos os mods explícitos
    allMods.push(...item.modifiers);
    // Adiciona o mod implícito, se houver
    if (item.implicitModifier) {
      allMods.push(item.implicitModifier);
    }
  }
  return allMods;
}

// Helper: Agrega valores dos modificadores globais em um objeto de stats
export function getGlobalStatsFromModifiers(mods: Modifier[]): {
  critMultiplier: number;
  lifeLeech: number;
  globalFlatMinPhys: number;
  globalFlatMaxPhys: number;
  globalFlatMinFire: number;
  globalFlatMaxFire: number;
  globalFlatMinCold: number;
  globalFlatMaxCold: number;
  globalFlatMinLightning: number;
  globalFlatMaxLightning: number;
  globalFlatMinVoid: number;
  globalFlatMaxVoid: number;
  increasePhysDamagePercent: number;
  increaseAttackSpeedPercent: number;
  increaseEleDamagePercent: number;
  increaseFireDamagePercent: number;
  increaseColdDamagePercent: number;
  increaseLightningDamagePercent: number;
  increaseVoidDamagePercent: number;
  increaseGlobalCritChancePercent: number;
  totalMovementSpeed: number;
} {
  let critMultiplier = 150;
  let lifeLeech = 0;
  let globalFlatMinPhys = 0;
  let globalFlatMaxPhys = 0;
  let globalFlatMinFire = 0;
  let globalFlatMaxFire = 0;
  let globalFlatMinCold = 0;
  let globalFlatMaxCold = 0;
  let globalFlatMinLightning = 0;
  let globalFlatMaxLightning = 0;
  let globalFlatMinVoid = 0;
  let globalFlatMaxVoid = 0;
  let increasePhysDamagePercent = 0;
  let increaseAttackSpeedPercent = 0;
  let increaseEleDamagePercent = 0;
  let increaseFireDamagePercent = 0;
  let increaseColdDamagePercent = 0;
  let increaseLightningDamagePercent = 0;
  let increaseVoidDamagePercent = 0;
  let increaseGlobalCritChancePercent = 0;
  let totalMovementSpeed = 0;

  for (const mod of mods) {
    switch (mod.type) {
      case "IncreasedCriticalStrikeMultiplier":
        critMultiplier += mod.value ?? 0;
        break;
      case "LifeLeech":
        lifeLeech += mod.value ?? 0;
        break;
      case "AddsFlatPhysicalDamage":
        globalFlatMinPhys += mod.valueMin ?? 0;
        globalFlatMaxPhys += mod.valueMax ?? 0;
        break;
      case "AddsFlatFireDamage":
        globalFlatMinFire += mod.valueMin ?? 0;
        globalFlatMaxFire += mod.valueMax ?? 0;
        break;
      case "AddsFlatColdDamage":
        globalFlatMinCold += mod.valueMin ?? 0;
        globalFlatMaxCold += mod.valueMax ?? 0;
        break;
      case "AddsFlatLightningDamage":
        globalFlatMinLightning += mod.valueMin ?? 0;
        globalFlatMaxLightning += mod.valueMax ?? 0;
        break;
      case "AddsFlatVoidDamage":
        globalFlatMinVoid += mod.valueMin ?? 0;
        globalFlatMaxVoid += mod.valueMax ?? 0;
        break;
      case "IncreasedPhysicalDamage":
        increasePhysDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedGlobalAttackSpeed":
        increaseAttackSpeedPercent += mod.value ?? 0;
        break;
      case "IncreasedElementalDamage":
        increaseEleDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedFireDamage":
        increaseFireDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedColdDamage":
        increaseColdDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedLightningDamage":
        increaseLightningDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedVoidDamage":
        increaseVoidDamagePercent += mod.value ?? 0;
        break;
      case "IncreasedGlobalCriticalStrikeChance":
        increaseGlobalCritChancePercent += mod.value ?? 0;
        break;
      case "IncreasedMovementSpeed":
        totalMovementSpeed += mod.value ?? 0;
        break;
    }
  }

  return {
    critMultiplier,
    lifeLeech,
    globalFlatMinPhys,
    globalFlatMaxPhys,
    globalFlatMinFire,
    globalFlatMaxFire,
    globalFlatMinCold,
    globalFlatMaxCold,
    globalFlatMinLightning,
    globalFlatMaxLightning,
    globalFlatMinVoid,
    globalFlatMaxVoid,
    increasePhysDamagePercent,
    increaseAttackSpeedPercent,
    increaseEleDamagePercent,
    increaseFireDamagePercent,
    increaseColdDamagePercent,
    increaseLightningDamagePercent,
    increaseVoidDamagePercent,
    increaseGlobalCritChancePercent,
    totalMovementSpeed,
  };
} 