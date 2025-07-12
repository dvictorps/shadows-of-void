import { Character, EquippableItem, ModifierType, Modifier /*, Modifier */ } from "../types/gameData"; // <<< ADD ModifierType IMPORT
import { ONE_HANDED_WEAPON_TYPES } from './itemUtils'; // <<< ADD IMPORT
import { ALL_ITEM_BASES } from '../data/items'; // <<< IMPORT BaseItemTemplate & ALL_ITEM_BASES
import { useElementalInstanceStore } from '@/stores/elementalInstanceStore';
import { BaseItemTemplate } from "../types/gameData";

// --- Função auxiliar para obter instância elemental global ---
function getCurrentElementalInstance(): 'fogo' | 'gelo' | 'raio' {
  try {
    // Zustand store pode ser acessado diretamente
    // @ts-ignore
    return require('@/stores/elementalInstanceStore').useElementalInstanceStore.getState().selectedInstance || 'gelo';
  } catch {
    return 'gelo';
  }
}

// --- Define Jewelry Types Set ---
const JEWELRY_TYPES = new Set(["Ring", "Amulet", "Belt"]);
// --------------------------------

// Define which item types are considered melee for stat overrides - NO LONGER NEEDED FOR ATK SPD
// const MELEE_WEAPON_TYPES = new Set(["Sword", "Axe", "Mace"]);

// NEW: Default attack speed when unarmed
const UNARMED_ATTACK_SPEED = 1.0;

export interface EffectiveStats {
  minDamage: number; // Total combined phys + elemental
  maxDamage: number; // Total combined phys + elemental
  minPhysDamage: number; // Final Physical portion
  maxPhysDamage: number; // Final Physical portion
  minEleDamage: number; // Final Elemental portion (sum of all)
  maxEleDamage: number; // Final Elemental portion (sum of all)
  attackSpeed: number; // Final Attack Speed
  critChance: number; // Final Crit Chance
  critMultiplier: number; // Final Crit Multiplier
  dps: number; // DPS considering combined damage
  physDps: number; // DPS from physical only
  eleDps: number; // DPS from elemental only
  lifeLeechPercent: number;
  
  // Defensive
  maxHealth: number; // Final Max Health
  totalArmor: number; // Final calculated Armor
  totalEvasion: number;
  totalBarrier: number;
  totalBlockChance: number;
  finalFireResistance: number;
  finalColdResistance: number;
  finalLightningResistance: number;
  finalVoidResistance: number;
  finalLifeRegenPerSecond: number; // NEW: Combined total regen
  finalManaRegenPerSecond: number; // NEW: Combined total mana regen
  flatManaRegen: number; // NEW: Flat mana regen from mods
  percentManaRegen: number; // NEW: % mana regen from mods
  thornsDamage: number; // Added Thorns
  estimatedPhysReductionPercent: number; // ADD THIS LINE
  // NEW STATS
  totalPhysTakenAsElementPercent: number;
  totalReducedPhysDamageTakenPercent: number;

  // --- Added for breakdown display ---
  weaponBaseMinPhys: number; // Weapon's physical damage after local mods
  weaponBaseMaxPhys: number; // Weapon's physical damage after local mods
  weaponBaseMinEle: number; // Weapon's elemental damage after local mods
  weaponBaseMaxEle: number; // Weapon's elemental damage after local mods
  weaponBaseAttackSpeed: number; // Weapon's attack speed after local mods
  weaponBaseCritChance: number; // Weapon's crit chance after local mods

  globalFlatMinPhys: number; // Flat phys from non-weapon sources
  globalFlatMaxPhys: number; // Flat phys from non-weapon sources
  globalFlatMinFire: number; // Flat fire from non-weapon sources
  globalFlatMaxFire: number; // Flat fire from non-weapon sources
  globalFlatMinCold: number; // Flat cold from non-weapon sources
  globalFlatMaxCold: number; // Flat cold from non-weapon sources
  globalFlatMinLightning: number; // Flat lightning from non-weapon sources
  globalFlatMaxLightning: number; // Flat lightning from non-weapon sources
  globalFlatMinVoid: number; // Flat void from non-weapon sources
  globalFlatMaxVoid: number; // Flat void from non-weapon sources

  increasePhysDamagePercent: number; // Global % phys increase (incl. attributes)
  increaseAttackSpeedPercent: number; // Global % attack speed increase (incl. attributes)
  increaseEleDamagePercent: number; // Global % elemental increase (incl. attributes)
  // --- Added specific elemental increase percentages ---
  increaseFireDamagePercent: number;
  increaseColdDamagePercent: number;
  increaseLightningDamagePercent: number;
  increaseVoidDamagePercent: number;
  // --- Added global crit chance increase percentage ---
  increaseGlobalCritChancePercent: number; // Global % crit chance increase (incl. attributes)

  totalMovementSpeed: number; // <<< ADD THIS LINE

  // <<< ADD Fields for Weapon 2 Base Stats (Calculated) >>>
  weapon2CalcMinPhys?: number;
  weapon2CalcMaxPhys?: number;
  weapon2CalcMinEle?: number;
  weapon2CalcMaxEle?: number;
  weapon2CalcAttackSpeed?: number;
  weapon2CalcCritChance?: number;
}

// --- Helper Functions ---

// Calculates total strength from base stats and equipment
export function calculateTotalStrength(character: Character): number {
  let totalBonusStrength = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    // Check Explicit Modifiers
    for (const mod of item.modifiers) {
      if (mod.type === 'Strength') {
        totalBonusStrength += mod.value ?? 0;
      }
    }
    // <<< ADD Check for Implicit Modifier >>>
    if (item.implicitModifier && item.implicitModifier.type === 'Strength') {
      totalBonusStrength += item.implicitModifier.value ?? 0;
    }
  }
  return character.strength + totalBonusStrength;
}

// Calculates total dexterity from base stats and equipment
export function calculateTotalDexterity(character: Character): number {
  let totalBonusDexterity = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    // Check Explicit Modifiers
    for (const mod of item.modifiers) {
      if (mod.type === 'Dexterity') {
        totalBonusDexterity += mod.value ?? 0;
      }
    }
    // <<< ADD Check for Implicit Modifier >>>
    if (item.implicitModifier && item.implicitModifier.type === 'Dexterity') {
      totalBonusDexterity += item.implicitModifier.value ?? 0;
    }
  }
  return character.dexterity + totalBonusDexterity;
}

// Calculates total intelligence from base stats and equipment
export function calculateTotalIntelligence(character: Character): number {
  let totalBonusIntelligence = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    // Check Explicit Modifiers
    for (const mod of item.modifiers) {
      if (mod.type === 'Intelligence') {
        totalBonusIntelligence += mod.value ?? 0;
      }
    }
    // <<< ADD Check for Implicit Modifier >>>
    if (item.implicitModifier && item.implicitModifier.type === 'Intelligence') {
      totalBonusIntelligence += item.implicitModifier.value ?? 0;
    }
  }
  return character.intelligence + totalBonusIntelligence;
}

// Calculates final max health - Now includes bonus flat health from mods
export function calculateFinalMaxHealth(
    baseMaxHealth: number,
    flatHealthFromMods: number
): number {
    const finalHealth = baseMaxHealth + flatHealthFromMods;
    return Math.max(1, finalHealth);
}

// NEW: Calculate final armor for a single item
export function calculateItemArmor(item: EquippableItem): number {
  const baseArmor = item.baseArmor ?? 0;
  let flatArmor = 0;
  let increasedArmorPercent = 0;

  if (item.modifiers) {
    for (const mod of item.modifiers) {
      if (mod.type === 'FlatLocalArmor') {
        flatArmor += mod.value ?? 0;
      } else if (mod.type === 'IncreasedLocalArmor') {
        increasedArmorPercent += mod.value ?? 0;
      }
    }
  }

  const finalArmor = (baseArmor + flatArmor) * (1 + increasedArmorPercent / 100);
  return Math.round(finalArmor);
}

// NEW: Calculate final evasion for an item
export function calculateItemEvasion(item: EquippableItem): number {
  const baseEvasion = item.baseEvasion ?? 0;
  let flatEvasion = 0;
  let increasedEvasionPercent = 0;

  item.modifiers.forEach((mod) => {
    if (mod.type === "FlatLocalEvasion") {
      flatEvasion += mod.value ?? 0;
    } else if (mod.type === "IncreasedLocalEvasion") {
      increasedEvasionPercent += mod.value ?? 0;
    }
  });

  const totalEvasion = (baseEvasion + flatEvasion) * (1 + increasedEvasionPercent / 100);
  return Math.round(totalEvasion); // Round to nearest integer
}

// NEW: Calculate final barrier for an item
export function calculateItemBarrier(item: EquippableItem): number {
  const baseBarrier = item.baseBarrier ?? 0;
  let flatBarrier = 0;
  let increasedBarrierPercent = 0;

  item.modifiers.forEach((mod) => {
    if (mod.type === "FlatLocalBarrier") {
      flatBarrier += mod.value ?? 0;
    } else if (mod.type === "IncreasedLocalBarrier") {
      increasedBarrierPercent += mod.value ?? 0;
    }
  });

  const totalBarrier = (baseBarrier + flatBarrier) * (1 + increasedBarrierPercent / 100);
  return Math.round(totalBarrier); // Round to nearest integer
}

// --- REVISED calculateEffectiveStats Function ---
export function calculateEffectiveStats(character: Character, instanceBonusActive?: boolean): EffectiveStats {
  const weapon1 = character.equipment?.weapon1;
  const weapon2 = character.equipment?.weapon2; // <<< Get Weapon 2
  const isTrueDualWielding = weapon1 && weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

  // --- Calcular todos os mods do personagem uma única vez ---
  const allMods = [
    ...(character.equipment?.weapon1?.modifiers || []),
    ...(character.equipment?.weapon2?.modifiers || []),
    ...(character.equipment?.helm?.modifiers || []),
    ...(character.equipment?.bodyArmor?.modifiers || []),
    ...(character.equipment?.gloves?.modifiers || []),
    ...(character.equipment?.boots?.modifiers || []),
    ...(character.equipment?.belt?.modifiers || []),
    ...(character.equipment?.amulet?.modifiers || []),
    ...(character.equipment?.ring1?.modifiers || []),
    ...(character.equipment?.ring2?.modifiers || []),
    // ... outros slots se houver
  ];

  // --- Inicializar objeto stats para garantir retorno válido ---
  let stats: any = {};

  // --- Inicializar acumuladores de spell mods ---
  let totalFlatSpellFire = 0;
  let totalFlatSpellCold = 0;
  let totalFlatSpellLightning = 0;
  let totalIncreasedSpellDamage = 0;
  let totalIncreasedCastSpeed = 0;
  let totalIncreasedSpellCritChance = 0;

  // --- Acumular modificadores de spell nos mods do personagem ---
  for (const mod of allMods) {
    switch (mod.type) {
      case "AddsFlatSpellFireDamage":
        if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
          totalFlatSpellFire += (mod.valueMin + mod.valueMax) / 2;
        } else if (mod.value !== undefined) {
          totalFlatSpellFire += mod.value;
        }
        break;
      case "AddsFlatSpellColdDamage":
        if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
          totalFlatSpellCold += (mod.valueMin + mod.valueMax) / 2;
        } else if (mod.value !== undefined) {
          totalFlatSpellCold += mod.value;
        }
        break;
      case "AddsFlatSpellLightningDamage":
        if (mod.valueMin !== undefined && mod.valueMax !== undefined) {
          totalFlatSpellLightning += (mod.valueMin + mod.valueMax) / 2;
        } else if (mod.value !== undefined) {
          totalFlatSpellLightning += mod.value;
        }
        break;
      case "IncreasedSpellDamage":
        totalIncreasedSpellDamage += mod.value ?? 0;
        break;
      case "IncreasedCastSpeed":
        totalIncreasedCastSpeed += mod.value ?? 0;
        break;
      case "IncreasedSpellCriticalStrikeChance":
        totalIncreasedSpellCritChance += mod.value ?? 0;
        break;
    }
  }
  // Remover todas as redefinições de increaseCritMultiplierPercent após a declaração única

  // Calcular increaseCritMultiplierPercent e effCritMultiplier após allMods
  const increaseCritMultiplierPercent = allMods.filter((m: any) => m.type === 'IncreasedCriticalStrikeMultiplier').reduce((acc: number, m: any) => acc + (m.value ?? 0), 0);
  let effCritMultiplier = (character.criticalStrikeMultiplier ?? 150) + increaseCritMultiplierPercent;

  // --- Helper Function to calculate stats for a SINGLE weapon after local mods ---
  const calculateWeaponLocalStats = (weapon: EquippableItem | null | undefined): {
    minPhys: number; maxPhys: number; minEle: number; maxEle: number; speed: number; crit: number; isSpellWeapon?: boolean; spellMin?: number; spellMax?: number;
    spellMinFire?: number; spellMaxFire?: number; spellMinCold?: number; spellMaxCold?: number; spellMinLightning?: number; spellMaxLightning?: number;
    isMeleeWeapon?: boolean; // Added for melee check
  } | null => {
      if (!weapon) return null;
      const template = ALL_ITEM_BASES.find(t => t.baseId === weapon.baseId);
      if (!template) {
          return null;
      }

      const isSpellWeapon = weapon.classification === 'Spell';
      const isMeleeWeapon = weapon.classification === 'Melee'; // Added for melee check
      let baseMin = 0, baseMax = 0;
      if (isSpellWeapon) {
        // Para armas arcanas, usar baseSpellMinDamage/baseSpellMaxDamage
        baseMin = template.baseSpellMinDamage ?? 0;
        baseMax = template.baseSpellMaxDamage ?? 0;
        // Converter para o elemento da instância ativa
        const instance = getCurrentElementalInstance();
        // Zera os outros elementos, só o da instância recebe o dano base
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
        // Retorna os valores para uso posterior
        return {
          minPhys: 0,
          maxPhys: 0,
          minEle: 0,
          maxEle: 0,
          speed: template.baseAttackSpeed ?? 1,
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
          isMeleeWeapon: false, // Not melee
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
        // Dano de spell: base + flat + %
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
  };
  // --- End Helper --- 

  // --- Calculate Local Stats for Each Weapon --- 
  const weapon1LocalStats = calculateWeaponLocalStats(weapon1);
  const weapon2LocalStats = isTrueDualWielding ? calculateWeaponLocalStats(weapon2) : null;

  // --- Determine Effective Weapon Base Stats (Used for applying global mods) ---
  let effectiveWeaponAttackSpeed = weapon1LocalStats?.speed ?? UNARMED_ATTACK_SPEED;
  let effectiveWeaponCritChance = weapon1LocalStats?.crit ?? (character.criticalStrikeChance ?? 5);
  let minDamage = 1;
  let maxDamage = 1;
  let minPhysDamage = 0;
  let maxPhysDamage = 0;
  let minEleDamage = 0;
  let maxEleDamage = 0;
  let isSpellWeapon = false;

  // --- Initialize Global Accumulators ---
  let baseEvasion = character.evasion ?? 0;
  let totalLifeLeech = 0;
  let totalArmorFromEquipment = 0;
  let increasePhysDamagePercent = 0;
  let increaseEleDamagePercent = 0;
  let increaseGlobalAttackSpeedPercent = 0;
  let increaseGlobalCritChancePercent = 0;
  let increaseFireDamagePercent = 0;
  let increaseColdDamagePercent = 0;
  let increaseLightningDamagePercent = 0;
  let increaseVoidDamagePercent = 0;
  let globalFlatMinPhys = 0;
  let globalFlatMaxPhys = 0;
  let globalFlatMinFire = 0;
  let globalFlatMaxFire = 0;
  let globalFlatMinCold = 0;
  let globalFlatMaxCold = 0;
  let globalFlatMinLight = 0;
  let globalFlatMaxLight = 0;
  let globalFlatMinVoid = 0;
  let globalFlatMaxVoid = 0;
  let totalBonusStrength = 0;
  let totalBonusDexterity = 0;
  let totalBonusIntelligence = 0;
  let increaseEvasionPercent = 0;
  let flatBarrier = 0;
  let increaseBarrierPercent = 0;
  let flatHealthFromMods = 0;
  let totalFireResist = character.fireResistance ?? 0;
  let totalColdResist = character.coldResistance ?? 0;
  let totalLightningResist = character.lightningResistance ?? 0;
  let totalVoidResist = character.voidResistance ?? 0;
  let accumulatedFlatLifeRegen = 0;
  let accumulatedPercentLifeRegen = 0;
  let totalThorns = 0;
  let accumulatedPhysTakenAsElementPercent = 0;
  let accumulatedReducedPhysDamageTakenPercent = 0;
  let baseBlockChance = character.blockChance ?? 0;
  let increaseBlockChancePercent = 0;
  let totalMovementSpeedFromMods = 0; // <<< ADD THIS LINE
  let accumulatedFlatManaRegen = 0;
  let accumulatedPercentManaRegen = 0;

  // --- Process ALL Equipment Slots (Accumulate GLOBAL mods) ---
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;

    // --- Process Base Item Stats --- // <<< RENAMED Section Header
    // Accumulate base defenses (Armor, Barrier, Block, Evasion) from item base stats
    // Note: calculateItemArmor handles local mods, so we call it here.
    if (item.baseArmor !== undefined) {
      totalArmorFromEquipment += calculateItemArmor(item);
    }
    // Base Barrier, Evasion, and Block are flat, added directly
    if (item.baseBarrier !== undefined) {
        flatBarrier += item.baseBarrier;
    }
    // <<< ADD baseEvasion accumulation >>>
    if (item.baseEvasion !== undefined) {
        baseEvasion += item.baseEvasion;
    }
    // <<< END ADD >>>
    if (item.itemType === 'Shield') {
        baseBlockChance += item.baseBlockChance ?? 0;
    }

    // Reworked skip logic: only skip LOCAL weapon mods on the specific weapon slots
    const isWeaponSlot = slotId === 'weapon1' || slotId === 'weapon2';
    const shouldSkipLocalMod = (modType: ModifierType): boolean => {
        if (!isWeaponSlot) return false;
        return modType === "IncreasedLocalPhysicalDamage" ||
               modType === "IncreasedLocalAttackSpeed" ||
               modType === "IncreasedLocalCriticalStrikeChance" ||
               modType === "AddsFlatPhysicalDamage" ||
               modType === "AddsFlatFireDamage" ||
               modType === "AddsFlatColdDamage" ||
               modType === "AddsFlatLightningDamage" ||
               modType === "AddsFlatVoidDamage";
    };

    // --- Process Explicit Modifiers ---
    for (const mod of item.modifiers) {
        if (shouldSkipLocalMod(mod.type)) continue;
        switch (mod.type) {
          // Flat Damages (Only accumulate if NOT weapon1/weapon2)
          case "AddsFlatPhysicalDamage": globalFlatMinPhys += mod.valueMin ?? 0; globalFlatMaxPhys += mod.valueMax ?? 0; break;
          case "AddsFlatFireDamage": globalFlatMinFire += mod.valueMin ?? 0; globalFlatMaxFire += mod.valueMax ?? 0; break;
          case "AddsFlatColdDamage": globalFlatMinCold += mod.valueMin ?? 0; globalFlatMaxCold += mod.valueMax ?? 0; break;
          case "AddsFlatLightningDamage": globalFlatMinLight += mod.valueMin ?? 0; globalFlatMaxLight += mod.valueMax ?? 0; break;
          case "AddsFlatVoidDamage": globalFlatMinVoid += mod.valueMin ?? 0; globalFlatMaxVoid += mod.valueMax ?? 0; break;
          // Global Percent Mods
          case "IncreasedPhysicalDamage": increasePhysDamagePercent += mod.value ?? 0; break;
          case "IncreasedElementalDamage": increaseEleDamagePercent += mod.value ?? 0; break;
          case "IncreasedFireDamage": increaseFireDamagePercent += mod.value ?? 0; break;
          case "IncreasedColdDamage": increaseColdDamagePercent += mod.value ?? 0; break;
          case "IncreasedLightningDamage": increaseLightningDamagePercent += mod.value ?? 0; break;
          case "IncreasedVoidDamage": increaseVoidDamagePercent += mod.value ?? 0; break;
          case "IncreasedCriticalStrikeMultiplier": /* já acumulado em allMods */ break;
          case "IncreasedGlobalAttackSpeed": increaseGlobalAttackSpeedPercent += mod.value ?? 0; break;
          case "IncreasedGlobalCriticalStrikeChance": increaseGlobalCritChancePercent += mod.value ?? 0; break;
          case "LifeLeech": totalLifeLeech += mod.value ?? 0; break;
          // Attributes (Global)
          case "Strength": totalBonusStrength += mod.value ?? 0; break;
          case "Dexterity": totalBonusDexterity += mod.value ?? 0; break;
          case "Intelligence": totalBonusIntelligence += mod.value ?? 0; break;
          // Defensive Mods
          case "MaxHealth": flatHealthFromMods += mod.value ?? 0; break;
          case "FireResistance": totalFireResist += mod.value ?? 0; break;
          case "ColdResistance": totalColdResist += mod.value ?? 0; break;
          case "LightningResistance": totalLightningResist += mod.value ?? 0; break;
          case "VoidResistance": totalVoidResist += mod.value ?? 0; break;
          case "FlatLifeRegen": accumulatedFlatLifeRegen += mod.value ?? 0; break;
          case "PercentLifeRegen": accumulatedPercentLifeRegen += mod.value ?? 0; break;
          case "ThornsDamage": totalThorns += mod.value ?? 0; break;
          case "PhysDamageTakenAsElement": accumulatedPhysTakenAsElementPercent += mod.value ?? 0; break;
          case "ReducedPhysDamageTaken": accumulatedReducedPhysDamageTakenPercent += mod.value ?? 0; break;
          case "IncreasedBlockChance": increaseBlockChancePercent += mod.value ?? 0; break;
          case "FlatManaRegen": accumulatedFlatManaRegen += mod.value ?? 0; break;
          case "PercentManaRegen": accumulatedPercentManaRegen += mod.value ?? 0; break;
          // Flat defenses on Jewelry (add to global accumulators)
          case "FlatLocalArmor": if (JEWELRY_TYPES.has(item.itemType)) totalArmorFromEquipment += mod.value ?? 0; break; // Armor adds to the total from equipment
          case "FlatLocalEvasion": if (JEWELRY_TYPES.has(item.itemType)) baseEvasion += mod.value ?? 0; break; // Evasion adds to base evasion
          case "FlatLocalBarrier": if (JEWELRY_TYPES.has(item.itemType)) flatBarrier += mod.value ?? 0; break; // Barrier adds to flat barrier
          case "IncreasedMovementSpeed": totalMovementSpeedFromMods += mod.value ?? 0; break; // <<< ADD THIS CASE
        }
    }
    // --- Process IMPLICIT Modifier ---
    if (item.implicitModifier) {
        const mod = item.implicitModifier;
        if (shouldSkipLocalMod(mod.type)) continue;
        switch (mod.type) {
            // Flat Damages (Only accumulate if NOT weapon1/weapon2)
            case "AddsFlatPhysicalDamage": globalFlatMinPhys += mod.valueMin ?? 0; globalFlatMaxPhys += mod.valueMax ?? 0; break;
            case "AddsFlatFireDamage": globalFlatMinFire += mod.valueMin ?? 0; globalFlatMaxFire += mod.valueMax ?? 0; break;
            case "AddsFlatColdDamage": globalFlatMinCold += mod.valueMin ?? 0; globalFlatMaxCold += mod.valueMax ?? 0; break;
            case "AddsFlatLightningDamage": globalFlatMinLight += mod.valueMin ?? 0; globalFlatMaxLight += mod.valueMax ?? 0; break;
            case "AddsFlatVoidDamage": globalFlatMinVoid += mod.valueMin ?? 0; globalFlatMaxVoid += mod.valueMax ?? 0; break;
            // Other global implicits
            case "FireResistance": totalFireResist += mod.value ?? 0; break;
            case "ColdResistance": totalColdResist += mod.value ?? 0; break;
            case "LightningResistance": totalLightningResist += mod.value ?? 0; break;
            case "VoidResistance": totalVoidResist += mod.value ?? 0; break;
            case "FlatLocalArmor": totalArmorFromEquipment += mod.value ?? 0; break;
            case "FlatLocalEvasion": baseEvasion += mod.value ?? 0; break;
            case "FlatLocalBarrier": flatBarrier += mod.value ?? 0; break;
            case "IncreasedMovementSpeed": totalMovementSpeedFromMods += mod.value ?? 0; break; // <<< ADD THIS CASE (if boots can have implicit MS)
            case "MaxHealth": flatHealthFromMods += mod.value ?? 0; break;
            case "Strength": totalBonusStrength += mod.value ?? 0; break;
            case "Dexterity": totalBonusDexterity += mod.value ?? 0; break;
            case "Intelligence": totalBonusIntelligence += mod.value ?? 0; break;
            case "FlatManaRegen": accumulatedFlatManaRegen += mod.value ?? 0; break;
            case "PercentManaRegen": accumulatedPercentManaRegen += mod.value ?? 0; break;
        }
    }
  } // --- End Equipment Loop --- 

  // --- Apply Attribute Effects (No changes here) ---
  const finalTotalStrength = character.strength + totalBonusStrength;
  increasePhysDamagePercent += Math.floor(finalTotalStrength / 5) * 2; // Example: 2% Inc Phys Dmg per 5 Str
  const finalTotalDexterity = character.dexterity + totalBonusDexterity;
  increaseEvasionPercent += Math.floor(finalTotalDexterity / 5) * 2; // Dex: +2% Evasion per 5 Dex
  increaseGlobalCritChancePercent += Math.floor(finalTotalDexterity / 5); // Dex: +1% Global Crit Chance per 5 Dex
  const finalTotalIntelligence = character.intelligence + totalBonusIntelligence;
  increaseBarrierPercent += Math.floor(finalTotalIntelligence / 5) * 2; // Int: +2% Increased Barrier per 5 Int

  // --- Calculate Movement Speed (after loop and attribute bonuses) ---
  const finalTotalMovementSpeed = (character.movementSpeed ?? 0) + totalMovementSpeedFromMods;

  // --- Declare effective stats AFTER loop and attribute bonuses ---
  let effAttackSpeed = effectiveWeaponAttackSpeed * (1 + increaseGlobalAttackSpeedPercent / 100);
  let effCritChance = Math.round(effectiveWeaponCritChance) * (1 + increaseGlobalCritChancePercent / 100);
  let effEvasion = baseEvasion * (1 + increaseEvasionPercent / 100);

  // --- Calculate FINAL Damage Per Weapon (applying global flat and global %) ---
  const calculateFinalWeaponDamage = (weaponStats: { minPhys: number; maxPhys: number; minEle: number; maxEle: number; } | null) => {
      if (!weaponStats) return { minPhys: 0, maxPhys: 0, minEle: 0, maxEle: 0 };

      // 1. Start with the weapon's locally calculated damage (after local mods)
      const localMinPhys = weaponStats.minPhys;
      const localMaxPhys = weaponStats.maxPhys;
      const localMinEle = weaponStats.minEle; // Weapon's base ele damage
      const localMaxEle = weaponStats.maxEle;

      // 2. Get GLOBAL flat damage added from other sources (rings, etc.)
      const addedGlobalFlatMinPhys = globalFlatMinPhys;
      const addedGlobalFlatMaxPhys = globalFlatMaxPhys;
      const addedGlobalFlatMinEle = globalFlatMinFire + globalFlatMinCold + globalFlatMinLight + globalFlatMinVoid;
      const addedGlobalFlatMaxEle = globalFlatMaxFire + globalFlatMaxCold + globalFlatMaxLight + globalFlatMaxVoid;

      // 3. Combine Local Base + Global Flat BEFORE applying global %
      const totalMinPhysBeforeGlobalPerc = localMinPhys + addedGlobalFlatMinPhys;
      const totalMaxPhysBeforeGlobalPerc = localMaxPhys + addedGlobalFlatMaxPhys;
      const totalMinEleBeforeGlobalPerc = localMinEle + addedGlobalFlatMinEle;
      const totalMaxEleBeforeGlobalPerc = localMaxEle + addedGlobalFlatMaxEle;

      // 4. Apply GLOBAL % increases to the COMBINED total
      let finalMinPhys = totalMinPhysBeforeGlobalPerc * (1 + increasePhysDamagePercent / 100);
      let finalMaxPhys = totalMaxPhysBeforeGlobalPerc * (1 + increasePhysDamagePercent / 100);
      const totalGlobalEleIncrease = increaseEleDamagePercent;
      let finalMinEle = totalMinEleBeforeGlobalPerc * (1 + totalGlobalEleIncrease / 100);
      let finalMaxEle = totalMaxEleBeforeGlobalPerc * (1 + totalGlobalEleIncrease / 100);

      // 5. Rounding and clamping
      finalMinPhys = Math.max(0, Math.round(finalMinPhys));
      finalMaxPhys = Math.max(finalMinPhys, Math.round(finalMaxPhys));
      finalMinEle = Math.max(0, Math.round(finalMinEle));
      finalMaxEle = Math.max(finalMinEle, Math.round(finalMaxEle));

      return { minPhys: finalMinPhys, maxPhys: finalMaxPhys, minEle: finalMinEle, maxEle: finalMaxEle };
  };

  const finalWeapon1Damage = calculateFinalWeaponDamage(weapon1LocalStats);
  const finalWeapon2Damage = calculateFinalWeaponDamage(weapon2LocalStats);

  // --- Final Clamping and Formatting for Speed/Crit/Evasion (BEFORE dual wield 'more' speed) ---
  effAttackSpeed = Math.max(0.1, parseFloat(effAttackSpeed.toFixed(2)));
  effCritChance = Math.max(0, parseFloat(effCritChance.toFixed(2)));
  effCritMultiplier = Math.max(100, effCritMultiplier);
  effEvasion = Math.max(0, Math.round(effEvasion)); // Format evasion here
  totalLifeLeech = parseFloat(totalLifeLeech.toFixed(2)); // Format leech

  // --- Apply Dual Wielding "More" Multipliers (Apply to speed calculated from AVERAGE base) ---
  if (isTrueDualWielding) {
      effAttackSpeed *= 1.10;
      // --- DO NOT apply damage multiplier here anymore ---
      effAttackSpeed = Math.max(0.1, parseFloat(effAttackSpeed.toFixed(2))); // Re-apply formatting/min
  }

  // --- Calculate DPS ---
  const calculateDpsComponent = (minD: number, maxD: number, atkSpd: number, critC: number, critM: number): number => {
      const avgD = (minD + maxD) / 2;
      const critC_dec = Math.min(100, critC) / 100; 
      const critM_dec = critM / 100;
      return avgD * atkSpd * (1 + critC_dec * (critM_dec - 1));
  };

  let totalDps = 0;
  let physDps = 0;
  let eleDps = 0;

  if (isTrueDualWielding) {
      // Calculate DPS contribution of each weapon using HALF the final attack speed
      const speedPerWeapon = effAttackSpeed / 2;
      
      const w1TotalMin = finalWeapon1Damage.minPhys + finalWeapon1Damage.minEle;
      const w1TotalMax = finalWeapon1Damage.maxPhys + finalWeapon1Damage.maxEle;
      const dps1 = calculateDpsComponent(w1TotalMin, w1TotalMax, speedPerWeapon, effCritChance, effCritMultiplier);
      const physDps1 = calculateDpsComponent(finalWeapon1Damage.minPhys, finalWeapon1Damage.maxPhys, speedPerWeapon, effCritChance, effCritMultiplier);
      const eleDps1 = calculateDpsComponent(finalWeapon1Damage.minEle, finalWeapon1Damage.maxEle, speedPerWeapon, effCritChance, effCritMultiplier);

      const w2TotalMin = finalWeapon2Damage.minPhys + finalWeapon2Damage.minEle;
      const w2TotalMax = finalWeapon2Damage.maxPhys + finalWeapon2Damage.maxEle;
      const dps2 = calculateDpsComponent(w2TotalMin, w2TotalMax, speedPerWeapon, effCritChance, effCritMultiplier);
      const physDps2 = calculateDpsComponent(finalWeapon2Damage.minPhys, finalWeapon2Damage.maxPhys, speedPerWeapon, effCritChance, effCritMultiplier);
      const eleDps2 = calculateDpsComponent(finalWeapon2Damage.minEle, finalWeapon2Damage.maxEle, speedPerWeapon, effCritChance, effCritMultiplier);
      
      totalDps = parseFloat((dps1 + dps2).toFixed(2));
      physDps = parseFloat((physDps1 + physDps2).toFixed(2));
      eleDps = parseFloat((eleDps1 + eleDps2).toFixed(2));
  } else {
      // Single weapon or unarmed: Use finalWeapon1Damage and full effAttackSpeed
      const w1TotalMin = finalWeapon1Damage.minPhys + finalWeapon1Damage.minEle;
      const w1TotalMax = finalWeapon1Damage.maxPhys + finalWeapon1Damage.maxEle;
      totalDps = parseFloat(calculateDpsComponent(w1TotalMin, w1TotalMax, effAttackSpeed, effCritChance, effCritMultiplier).toFixed(2));
      physDps = parseFloat(calculateDpsComponent(finalWeapon1Damage.minPhys, finalWeapon1Damage.maxPhys, effAttackSpeed, effCritChance, effCritMultiplier).toFixed(2));
      eleDps = parseFloat(calculateDpsComponent(finalWeapon1Damage.minEle, finalWeapon1Damage.maxEle, effAttackSpeed, effCritChance, effCritMultiplier).toFixed(2));
  }

  // --- Final Defensive Stats Calculation (No change needed here) ---
  const finalMaxHealth = calculateFinalMaxHealth(character.baseMaxHealth, flatHealthFromMods);
  const finalTotalArmor = (character.armor ?? 0) + totalArmorFromEquipment; // Base character armor + equipment armor
  const finalTotalBarrier = Math.round(flatBarrier * (1 + increaseBarrierPercent / 100));
  const finalFireRes = Math.min(totalFireResist, 75);
  const finalColdRes = Math.min(totalColdResist, 75);
  const finalLightningRes = Math.min(totalLightningResist, 75);
  const finalVoidRes = Math.min(totalVoidResist, 75);
  const regenFromPercent = finalMaxHealth * (accumulatedPercentLifeRegen / 100);
  const finalLifeRegenPerSecond = parseFloat((accumulatedFlatLifeRegen + regenFromPercent).toFixed(1)); // Format regen
  // --- Mana Regen ---
  const maxMana = character.maxMana ?? 0;
  const percentManaRegen = Math.min(accumulatedPercentManaRegen, 10); // Limite de 10%
  const regenFromPercentMana = maxMana * (percentManaRegen / 100);
  const finalManaRegenPerSecond = parseFloat((accumulatedFlatManaRegen + regenFromPercentMana).toFixed(1));
  const referenceDamageHit = 100; // For estimation
  const estimatedPhysReductionPercent = finalTotalArmor > 0 ? parseFloat(((finalTotalArmor / (finalTotalArmor + 10 * referenceDamageHit)) * 100).toFixed(1)) : 0;
  let finalTotalBlockChance = Math.round(baseBlockChance * (1 + increaseBlockChancePercent / 100));
  finalTotalBlockChance = Math.min(75, finalTotalBlockChance);

  // --- Calculate average damage components for dual wielding ---
  let avgMinPhys = 0;
  let avgMaxPhys = 0;
  let avgMinEle = 0;
  let avgMaxEle = 0;

  if (isTrueDualWielding) {
      avgMinPhys = Math.round((finalWeapon1Damage.minPhys + finalWeapon2Damage.minPhys) / 2);
      avgMaxPhys = Math.round((finalWeapon1Damage.maxPhys + finalWeapon2Damage.maxPhys) / 2);
      avgMinEle = Math.round((finalWeapon1Damage.minEle + finalWeapon2Damage.minEle) / 2);
      avgMaxEle = Math.round((finalWeapon1Damage.maxEle + finalWeapon2Damage.maxEle) / 2);
  } else {
      // Use weapon 1's damage if not dual wielding
      avgMinPhys = finalWeapon1Damage.minPhys;
      avgMaxPhys = finalWeapon1Damage.maxPhys;
      avgMinEle = finalWeapon1Damage.minEle;
      avgMaxEle = finalWeapon1Damage.maxEle;
  }

  // --- Final Effective Stats Object ---
  const finalStats: EffectiveStats = {
    // Final calculated values
    minDamage: avgMinPhys + avgMinEle, // Use calculated averages
    maxDamage: avgMaxPhys + avgMaxEle, // Use calculated averages
    minPhysDamage: avgMinPhys, // Use calculated average
    maxPhysDamage: avgMaxPhys, // Use calculated average
    minEleDamage: avgMinEle, // Use calculated average
    maxEleDamage: avgMaxEle, // Use calculated average
    attackSpeed: effAttackSpeed,
    critChance: effCritChance,
    critMultiplier: effCritMultiplier,
    dps: totalDps,
    physDps: physDps,
    eleDps: eleDps,
    lifeLeechPercent: totalLifeLeech,
    maxHealth: finalMaxHealth,
    totalArmor: finalTotalArmor,
    totalEvasion: effEvasion,
    totalBarrier: finalTotalBarrier,
    totalBlockChance: finalTotalBlockChance,
    finalFireResistance: finalFireRes,
    finalColdResistance: finalColdRes,
    finalLightningResistance: finalLightningRes,
    finalVoidResistance: finalVoidRes,
    finalLifeRegenPerSecond: finalLifeRegenPerSecond,
    finalManaRegenPerSecond: finalManaRegenPerSecond,
    flatManaRegen: accumulatedFlatManaRegen,
    percentManaRegen: percentManaRegen,
    thornsDamage: totalThorns,
    estimatedPhysReductionPercent: estimatedPhysReductionPercent,
    totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
    totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
    weaponBaseMinPhys: weapon1LocalStats?.minPhys ?? 0,
    weaponBaseMaxPhys: weapon1LocalStats?.maxPhys ?? 0,
    weaponBaseMinEle: weapon1LocalStats?.minEle ?? 0,
    weaponBaseMaxEle: weapon1LocalStats?.maxEle ?? 0,
    weaponBaseAttackSpeed: weapon1LocalStats?.speed ?? UNARMED_ATTACK_SPEED,
    weaponBaseCritChance: weapon1LocalStats?.crit ?? (character.criticalStrikeChance ?? 5),
    globalFlatMinPhys: globalFlatMinPhys,
    globalFlatMaxPhys: globalFlatMaxPhys,
    globalFlatMinFire: globalFlatMinFire,
    globalFlatMaxFire: globalFlatMaxFire,
    globalFlatMinCold: globalFlatMinCold,
    globalFlatMaxCold: globalFlatMaxCold,
    globalFlatMinLightning: globalFlatMinLight,
    globalFlatMaxLightning: globalFlatMaxLight,
    globalFlatMinVoid: globalFlatMinVoid,
    globalFlatMaxVoid: globalFlatMaxVoid,
    increasePhysDamagePercent: increasePhysDamagePercent,
    increaseAttackSpeedPercent: increaseGlobalAttackSpeedPercent,
    increaseEleDamagePercent: increaseEleDamagePercent,
    increaseFireDamagePercent: increaseFireDamagePercent,
    increaseColdDamagePercent: increaseColdDamagePercent,
    increaseLightningDamagePercent: increaseLightningDamagePercent,
    increaseVoidDamagePercent: increaseVoidDamagePercent,
    increaseGlobalCritChancePercent: increaseGlobalCritChancePercent,
    totalMovementSpeed: finalTotalMovementSpeed,
    weapon2CalcMinPhys: weapon2LocalStats?.minPhys,
    weapon2CalcMaxPhys: weapon2LocalStats?.maxPhys,
    weapon2CalcMinEle: weapon2LocalStats?.minEle,
    weapon2CalcMaxEle: weapon2LocalStats?.maxEle,
    weapon2CalcAttackSpeed: weapon2LocalStats?.speed,
    weapon2CalcCritChance: weapon2LocalStats?.crit,
  };

  // --- SPELL WEAPON LOGIC: Só aplica bônus de instância para mago ---
  if ((weapon1LocalStats?.isSpellWeapon || weapon1LocalStats?.isMeleeWeapon) && character.class === 'Mago') {
    const isSpell = weapon1LocalStats?.isSpellWeapon;
    const isMelee = weapon1LocalStats?.isMeleeWeapon;
    let min = 0, max = 0;
    let minFire = weapon1LocalStats.spellMinFire ?? 0;
    let maxFire = weapon1LocalStats.spellMaxFire ?? 0;
    let minCold = weapon1LocalStats.spellMinCold ?? 0;
    let maxCold = weapon1LocalStats.spellMaxCold ?? 0;
    let minLightning = weapon1LocalStats.spellMinLightning ?? 0;
    let maxLightning = weapon1LocalStats.spellMaxLightning ?? 0;

    minFire += totalFlatSpellFire;
    maxFire += totalFlatSpellFire;
    minCold += totalFlatSpellCold;
    maxCold += totalFlatSpellCold;
    minLightning += totalFlatSpellLightning;
    maxLightning += totalFlatSpellLightning;

    minFire *= 1 + (totalIncreasedSpellDamage / 100);
    maxFire *= 1 + (totalIncreasedSpellDamage / 100);
    minCold *= 1 + (totalIncreasedSpellDamage / 100);
    maxCold *= 1 + (totalIncreasedSpellDamage / 100);
    minLightning *= 1 + (totalIncreasedSpellDamage / 100);
    maxLightning *= 1 + (totalIncreasedSpellDamage / 100);

    const instance = getCurrentElementalInstance();
    let castSpeed = 1 * (1 + totalIncreasedCastSpeed / 100);
    let attackSpeed = weapon1LocalStats?.speed ?? 1;
    let spellCrit = 6 * (1 + totalIncreasedSpellCritChance / 100);
    let baseCrit = weapon1LocalStats?.crit ?? 5;

    if (instanceBonusActive) {
      if (instance === 'gelo') {
        if (isSpell) {
          minCold *= 1.3;
          maxCold *= 1.3;
        }
        if (isMelee) {
          // Para melee, aumenta o dano final em 30% (aplicado depois)
          // O cálculo será ajustado abaixo
        }
      } else if (instance === 'fogo') {
        if (isSpell) {
          castSpeed *= 1.25;
        }
        if (isMelee) {
          attackSpeed *= 1.25;
        }
      } else if (instance === 'raio') {
        if (isSpell) {
          spellCrit = 10;
        }
        if (isMelee) {
          baseCrit = 10;
        }
      }
    }

    if (isSpell) {
      if (instance === 'fogo') {
        min = minFire;
        max = maxFire;
      } else if (instance === 'gelo') {
        min = minCold;
        max = maxCold;
      } else if (instance === 'raio') {
        min = minLightning;
        max = maxLightning;
      }
      const dps = ((min + max) / 2) * castSpeed * (1 + (spellCrit / 100) * (effCritMultiplier / 100));
      return {
        minDamage: min,
        maxDamage: max,
        minPhysDamage: 0,
        maxPhysDamage: 0,
        minEleDamage: min,
        maxEleDamage: max,
        attackSpeed: castSpeed,
        critChance: spellCrit,
        critMultiplier: effCritMultiplier,
        dps,
        physDps: 0,
        eleDps: dps,
        lifeLeechPercent: totalLifeLeech,
        maxHealth: finalMaxHealth,
        totalArmor: finalTotalArmor,
        totalEvasion: effEvasion,
        totalBarrier: finalTotalBarrier,
        totalBlockChance: finalTotalBlockChance,
        finalFireResistance: finalFireRes,
        finalColdResistance: finalColdRes,
        finalLightningResistance: finalLightningRes,
        finalVoidResistance: finalVoidRes,
        finalLifeRegenPerSecond: finalLifeRegenPerSecond,
        finalManaRegenPerSecond: finalManaRegenPerSecond,
        flatManaRegen: accumulatedFlatManaRegen,
        percentManaRegen: percentManaRegen,
        thornsDamage: totalThorns,
        estimatedPhysReductionPercent: estimatedPhysReductionPercent,
        totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
        totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
        weaponBaseMinPhys: 0,
        weaponBaseMaxPhys: 0,
        weaponBaseMinEle: min,
        weaponBaseMaxEle: max,
        weaponBaseAttackSpeed: castSpeed,
        weaponBaseCritChance: spellCrit,
        globalFlatMinPhys: 0,
        globalFlatMaxPhys: 0,
        globalFlatMinFire: minFire,
        globalFlatMaxFire: maxFire,
        globalFlatMinCold: minCold,
        globalFlatMaxCold: maxCold,
        globalFlatMinLightning: minLightning,
        globalFlatMaxLightning: maxLightning,
        globalFlatMinVoid: 0,
        globalFlatMaxVoid: 0,
        increasePhysDamagePercent: 0,
        increaseAttackSpeedPercent: 0,
        increaseEleDamagePercent: 0,
        increaseFireDamagePercent: 0,
        increaseColdDamagePercent: 0,
        increaseLightningDamagePercent: 0,
        increaseVoidDamagePercent: 0,
        increaseGlobalCritChancePercent: 0,
        totalMovementSpeed: finalTotalMovementSpeed,
        weapon2CalcMinPhys: 0,
        weapon2CalcMaxPhys: 0,
        weapon2CalcMinEle: 0,
        weapon2CalcMaxEle: 0,
        weapon2CalcAttackSpeed: 0,
        weapon2CalcCritChance: 0,
      };
    } else if (isMelee) {
      // Para melee, aplica o bônus diretamente no cálculo do dano físico
      let minPhys = weapon1LocalStats.minPhys;
      let maxPhys = weapon1LocalStats.maxPhys;
      let eleMin = weapon1LocalStats.minEle;
      let eleMax = weapon1LocalStats.maxEle;
      let bonusColdMin = 0;
      let bonusColdMax = 0;
      if (instanceBonusActive && instance === 'gelo') {
        bonusColdMin = minPhys * 0.3;
        bonusColdMax = maxPhys * 0.3;
      }
      let finalAttackSpeed = attackSpeed;
      if (instanceBonusActive && instance === 'fogo') {
        finalAttackSpeed = attackSpeed;
      }
      let finalCrit = baseCrit;
      if (instanceBonusActive && instance === 'raio') {
        finalCrit = baseCrit;
      }
      const totalMinEle = eleMin + bonusColdMin;
      const totalMaxEle = eleMax + bonusColdMax;
      const dps = ((minPhys + maxPhys) / 2 + (totalMinEle + totalMaxEle) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100));
      return {
        minDamage: minPhys + totalMinEle,
        maxDamage: maxPhys + totalMaxEle,
        minPhysDamage: minPhys,
        maxPhysDamage: maxPhys,
        minEleDamage: totalMinEle,
        maxEleDamage: totalMaxEle,
        attackSpeed: finalAttackSpeed,
        critChance: finalCrit,
        critMultiplier: effCritMultiplier,
        dps,
        physDps: ((minPhys + maxPhys) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100)),
        eleDps: ((totalMinEle + totalMaxEle) / 2) * finalAttackSpeed * (1 + (finalCrit / 100) * (effCritMultiplier / 100)),
        lifeLeechPercent: totalLifeLeech,
        maxHealth: finalMaxHealth,
        totalArmor: finalTotalArmor,
        totalEvasion: effEvasion,
        totalBarrier: finalTotalBarrier,
        totalBlockChance: finalTotalBlockChance,
        finalFireResistance: finalFireRes,
        finalColdResistance: finalColdRes,
        finalLightningResistance: finalLightningRes,
        finalVoidResistance: finalVoidRes,
        finalLifeRegenPerSecond: finalLifeRegenPerSecond,
        finalManaRegenPerSecond: finalManaRegenPerSecond,
        flatManaRegen: accumulatedFlatManaRegen,
        percentManaRegen: percentManaRegen,
        thornsDamage: totalThorns,
        estimatedPhysReductionPercent: estimatedPhysReductionPercent,
        totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
        totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
        weaponBaseMinPhys: minPhys,
        weaponBaseMaxPhys: maxPhys,
        weaponBaseMinEle: totalMinEle,
        weaponBaseMaxEle: totalMaxEle,
        weaponBaseAttackSpeed: finalAttackSpeed,
        weaponBaseCritChance: finalCrit,
        globalFlatMinPhys: 0,
        globalFlatMaxPhys: 0,
        globalFlatMinFire: 0,
        globalFlatMaxFire: 0,
        globalFlatMinCold: 0,
        globalFlatMaxCold: 0,
        globalFlatMinLightning: 0,
        globalFlatMaxLightning: 0,
        globalFlatMinVoid: 0,
        globalFlatMaxVoid: 0,
        increasePhysDamagePercent: 0,
        increaseAttackSpeedPercent: 0,
        increaseEleDamagePercent: 0,
        increaseFireDamagePercent: 0,
        increaseColdDamagePercent: 0,
        increaseLightningDamagePercent: 0,
        increaseVoidDamagePercent: 0,
        increaseGlobalCritChancePercent: 0,
        totalMovementSpeed: finalTotalMovementSpeed,
        weapon2CalcMinPhys: 0,
        weapon2CalcMaxPhys: 0,
        weapon2CalcMinEle: 0,
        weapon2CalcMaxEle: 0,
        weapon2CalcAttackSpeed: 0,
        weapon2CalcCritChance: 0,
      };
    }
  }

  return finalStats;
}
// --- END REVISED calculateEffectiveStats Function ---

// NEW: Function specifically for calculating item stats for display in tooltips
// Renamed from calculateFinalStats to avoid confusion with calculateEffectiveStats
export function calculateItemDisplayStats(item: EquippableItem): {
  finalMinDamage: number;
  finalMaxDamage: number;
  finalAttackSpeed: number;
  finalFireMin: number;
  finalFireMax: number;
  finalColdMin: number;
  finalColdMax: number;
  finalLightningMin: number;
  finalLightningMax: number;
  finalVoidMin: number;
  finalVoidMax: number;
  finalCritChance: number;
  isSpellWeapon?: boolean;
  finalMinPhys: number;
  finalMaxPhys: number;
} {
  // --- Find Base Template ---
  const template = ALL_ITEM_BASES.find(t => t.baseId === item.baseId);

  // --- Detect if weapon is arcana (Spell) ---
  const isSpellWeapon = item.classification === 'Spell';

  // --- Initialize with Base Stats from Template ---
  let minDamage = 0;
  let maxDamage = 0;
  if (isSpellWeapon) {
    minDamage = template?.baseSpellMinDamage ?? 0;
    maxDamage = template?.baseSpellMaxDamage ?? 0;
  } else {
    minDamage = template?.baseMinDamage ?? 0;
    maxDamage = template?.baseMaxDamage ?? 0;
  }
  let attackSpeed = template?.baseAttackSpeed ?? 1;
  const baseCritChance = template?.baseCriticalStrikeChance ?? 5;

  // --- Accumulate Modifiers --- 
  let addedMinDamage = 0;
  let addedMaxDamage = 0;
  let addedFireMin = 0;
  let addedFireMax = 0;
  let addedColdMin = 0;
  let addedColdMax = 0;
  let addedLightningMin = 0;
  let addedLightningMax = 0;
  let addedVoidMin = 0;
  let addedVoidMax = 0;
  let totalIncreasedAttackSpeed = 0;
  let totalIncreasedCritChance = 0;
  // Add accumulator for local phys %
  let localIncreasePhysPercent = 0;

  // Acumuladores só para o dano físico
  let baseMinPhys = template?.baseMinDamage ?? 0;
  let baseMaxPhys = template?.baseMaxDamage ?? 0;
  let flatPhysMin = 0;
  let flatPhysMax = 0;

  item.modifiers.forEach((mod) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage":
        addedMinDamage += mod.valueMin ?? 0; // Accumulate flat phys
        addedMaxDamage += mod.valueMax ?? 0;
        flatPhysMin += mod.valueMin ?? 0;
        flatPhysMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatFireDamage":
        addedFireMin += mod.valueMin ?? 0;
        addedFireMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatColdDamage":
        addedColdMin += mod.valueMin ?? 0;
        addedColdMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatLightningDamage":
        addedLightningMin += mod.valueMin ?? 0;
        addedLightningMax += mod.valueMax ?? 0;
        break;
      case "AddsFlatVoidDamage":
        addedVoidMin += mod.valueMin ?? 0;
        addedVoidMax += mod.valueMax ?? 0;
        break;
      case "IncreasedLocalAttackSpeed": // ADD new local
        totalIncreasedAttackSpeed += mod.value ?? 0;
        break;
      case "IncreasedLocalCriticalStrikeChance":
        totalIncreasedCritChance += mod.value ?? 0;
        break;
      // Add case to accumulate local phys %
      case "IncreasedLocalPhysicalDamage":
          localIncreasePhysPercent += mod.value ?? 0;
          break;
    }
  });

  // Apply added flat damage FIRST to the base damage
  minDamage += addedMinDamage;
  maxDamage += addedMaxDamage;

  // THEN Apply local physical % increase
  minDamage *= (1 + localIncreasePhysPercent / 100);
  maxDamage *= (1 + localIncreasePhysPercent / 100);

  // Round AFTER applying percentage
  minDamage = Math.round(minDamage);
  maxDamage = Math.round(maxDamage);

  // Ensure min damage is not greater than max damage
  if (minDamage > maxDamage) {
    minDamage = maxDamage;
  }

  // Calcular dano físico isolado corretamente
  let finalMinPhys = Math.round((baseMinPhys + flatPhysMin) * (1 + localIncreasePhysPercent / 100));
  let finalMaxPhys = Math.round((baseMaxPhys + flatPhysMax) * (1 + localIncreasePhysPercent / 100));
  if (finalMinPhys > finalMaxPhys) finalMinPhys = finalMaxPhys;

  // Apply increased LOCAL attack speed %
  const localAttackSpeedMultiplier = 1 + totalIncreasedAttackSpeed / 100;
  attackSpeed = attackSpeed * localAttackSpeedMultiplier;

  // Calculate final crit chance using the base from template
  let critChance = baseCritChance; // Start with template base crit
  const critChanceMultiplier = 1 + totalIncreasedCritChance / 100;
  critChance = critChance * critChanceMultiplier;

  return {
    finalMinDamage: minDamage,
    finalMaxDamage: maxDamage,
    finalAttackSpeed: attackSpeed,
    finalCritChance: critChance,
    finalFireMin: addedFireMin,
    finalFireMax: addedFireMax,
    finalColdMin: addedColdMin,
    finalColdMax: addedColdMax,
    finalLightningMin: addedLightningMin,
    finalLightningMax: addedLightningMax,
    finalVoidMin: addedVoidMin,
    finalVoidMax: addedVoidMax,
    isSpellWeapon,
    finalMinPhys,
    finalMaxPhys,
  };
}

// NEW Function: Calculate effective damage for a single weapon swing, applying global mods
export function calculateSingleWeaponSwingDamage(
    weapon: EquippableItem, 
    weaponTemplate: BaseItemTemplate,
    globalStats: EffectiveStats
): {
  minPhys: number;
  maxPhys: number;
  minEle: number;
  maxEle: number;
  totalMin: number;
  totalMax: number;
} {
    // --- Step 1: Base Damage & Local Mods --- 
    let localMinPhys = weaponTemplate.baseMinDamage ?? 0;
    let localMaxPhys = weaponTemplate.baseMaxDamage ?? 0;
    let localMinEle = 0; 
    let localMaxEle = 0;
    let localPhysIncreasePercent = 0;
    weapon.modifiers.forEach(mod => {
        switch (mod.type) {
            // Accumulate local flat damages and local phys %
            case "AddsFlatPhysicalDamage": localMinPhys += mod.valueMin ?? 0; localMaxPhys += mod.valueMax ?? 0; break;
            case "AddsFlatFireDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatColdDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatLightningDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "AddsFlatVoidDamage": localMinEle += mod.valueMin ?? 0; localMaxEle += mod.valueMax ?? 0; break;
            case "IncreasedLocalPhysicalDamage": localPhysIncreasePercent += mod.value ?? 0; break;
        }
    });

    // Apply local phys % increase
    localMinPhys *= (1 + localPhysIncreasePercent / 100);
    localMaxPhys *= (1 + localPhysIncreasePercent / 100);

    // --- Step 2: Apply Global % Increases (NO Global Flat Added Here) ---
    let finalMinPhys = localMinPhys * (1 + globalStats.increasePhysDamagePercent / 100);
    let finalMaxPhys = localMaxPhys * (1 + globalStats.increasePhysDamagePercent / 100);

    // Apply global ele % increases (Simplified: only total global %)
    // <<< START REVISED ELEMENTAL CALCULATION >>>
    // Get total flat elemental from global stats (rings, etc.)
    const globalFlatMinEle = globalStats.globalFlatMinFire + globalStats.globalFlatMinCold + globalStats.globalFlatMinLightning + globalStats.globalFlatMinVoid;
    const globalFlatMaxEle = globalStats.globalFlatMaxFire + globalStats.globalFlatMaxCold + globalStats.globalFlatMaxLightning + globalStats.globalFlatMaxVoid;

    // Combine weapon's local elemental + global flat elemental
    const combinedMinEle = localMinEle + globalFlatMinEle;
    const combinedMaxEle = localMaxEle + globalFlatMaxEle;

    // Apply global ele % increase to the combined total
    let finalMinEle = combinedMinEle * (1 + globalStats.increaseEleDamagePercent / 100);
    let finalMaxEle = combinedMaxEle * (1 + globalStats.increaseEleDamagePercent / 100);
    // <<< END REVISED ELEMENTAL CALCULATION >>>

    // --- Step 3: Round and Combine ---
    finalMinPhys = Math.max(0, Math.round(finalMinPhys));
    finalMaxPhys = Math.max(finalMinPhys, Math.round(finalMaxPhys));
    finalMinEle = Math.max(0, Math.round(finalMinEle));
    finalMaxEle = Math.max(finalMinEle, Math.round(finalMaxEle));

    const totalMin = finalMinPhys + finalMinEle;
    const totalMax = finalMaxPhys + finalMaxEle;

    return {
        minPhys: finalMinPhys,
        maxPhys: finalMaxPhys,
        minEle: finalMinEle,
        maxEle: finalMaxEle,
        totalMin: totalMin,
        totalMax: totalMax,
    };
} 