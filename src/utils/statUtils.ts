import { Character, EquippableItem, ModifierType, Modifier /*, Modifier */ } from "../types/gameData"; // <<< ADD ModifierType IMPORT
import { ONE_HANDED_WEAPON_TYPES } from './itemUtils'; // <<< ADD IMPORT
import { BaseItemTemplate, ALL_ITEM_BASES } from '../data/items'; // <<< IMPORT BaseItemTemplate & ALL_ITEM_BASES

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
}

// --- Helper Functions ---

// Calculates total strength from base stats and equipment
export function calculateTotalStrength(character: Character): number {
  let totalBonusStrength = 0;
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;
    for (const mod of item.modifiers) {
      if (mod.type === 'Strength') {
        totalBonusStrength += mod.value ?? 0;
      }
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
    for (const mod of item.modifiers) {
      if (mod.type === 'Dexterity') {
        totalBonusDexterity += mod.value ?? 0;
      }
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
    for (const mod of item.modifiers) {
      if (mod.type === 'Intelligence') {
        totalBonusIntelligence += mod.value ?? 0;
      }
    }
  }
  return character.intelligence + totalBonusIntelligence;
}

// Calculates final max health - Now includes bonus flat health from mods
export function calculateFinalMaxHealth(
    baseMaxHealth: number,
    flatHealthFromMods: number
): number {
    console.log(`[calculateFinalMaxHealth] Inputs: baseMaxHealth=${baseMaxHealth}, flatHealthFromMods=${flatHealthFromMods}`);
    const finalHealth = baseMaxHealth + flatHealthFromMods;
    console.log(`[calculateFinalMaxHealth] Calculations: finalHealth=${finalHealth}`);
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
export function calculateEffectiveStats(character: Character): EffectiveStats {
  console.log(`[calculateEffectiveStats] START for ${character.name}`);
  const weapon1 = character.equipment?.weapon1;

  // --- Initialize Weapon Base Stats (will be overridden if weapon equipped) ---
  let weaponFinalMinPhys = 0; // Weapon's phys damage AFTER local mods
  let weaponFinalMaxPhys = 0;
  let weaponFinalMinEle = 0; // Weapon's elemental damage AFTER local mods
  let weaponFinalMaxEle = 0;
  let weaponFinalAttackSpeed = UNARMED_ATTACK_SPEED; // Weapon's attack speed AFTER local mods
  let weaponFinalCritChance = character.criticalStrikeChance ?? 5; // Weapon's crit chance AFTER local mods

  // --- START: Calculate Weapon's Final Stats (after local mods) ---
  if (weapon1) {
    const weapon1Template = ALL_ITEM_BASES.find(t => t.baseId === weapon1.baseId);
    if (weapon1Template) {
        const wpnBaseMin = weapon1Template.baseMinDamage ?? 0;
        const wpnBaseMax = weapon1Template.baseMaxDamage ?? 0;
        const wpnBaseAttackSpeed = weapon1Template.baseAttackSpeed ?? UNARMED_ATTACK_SPEED;
        const wpnBaseCrit = weapon1Template.baseCriticalStrikeChance ?? 5;

        let localFlatPhysMin = 0;
        let localFlatPhysMax = 0;
        let localIncreasePhysPercent = 0;
        let localIncreaseAttackSpeedPercent = 0;
        let localIncreaseCritChancePercent = 0;
        let localFlatMinEle = 0; // Accumulator for weapon's local elemental
        let localFlatMaxEle = 0; // Accumulator for weapon's local elemental

        // Accumulate all local mods from the weapon
        weapon1.modifiers.forEach(mod => {
            switch (mod.type) {
                case "AddsFlatPhysicalDamage":
                    localFlatPhysMin += mod.valueMin ?? 0;
                    localFlatPhysMax += mod.valueMax ?? 0;
                    break;
                case "AddsFlatFireDamage":
                case "AddsFlatColdDamage":
                case "AddsFlatLightningDamage":
                case "AddsFlatVoidDamage":
                    localFlatMinEle += mod.valueMin ?? 0;
                    localFlatMaxEle += mod.valueMax ?? 0;
                    break;
                case "IncreasedLocalPhysicalDamage":
                    localIncreasePhysPercent += mod.value ?? 0;
                    break;
                case "IncreasedLocalAttackSpeed":
                    localIncreaseAttackSpeedPercent += mod.value ?? 0;
                    break;
                case "IncreasedLocalCriticalStrikeChance":
                    localIncreaseCritChancePercent += mod.value ?? 0;
                    break;
            }
        });

        // Also check implicit mod for local effects (like AddsFlat...)
        if (weapon1.implicitModifier) {
           const impMod = weapon1.implicitModifier;
           switch (impMod.type) {
               case "AddsFlatPhysicalDamage":
                   localFlatPhysMin += impMod.valueMin ?? 0;
                   localFlatPhysMax += impMod.valueMax ?? 0;
                   break;
               case "AddsFlatFireDamage":
               case "AddsFlatColdDamage":
               case "AddsFlatLightningDamage":
               case "AddsFlatVoidDamage":
                   localFlatMinEle += impMod.valueMin ?? 0;
                   localFlatMaxEle += impMod.valueMax ?? 0;
                   break;
               // Ignore other implicit types for local weapon calculation
           }
        }


        // Calculate weapon's final physical damage (base + flat_local) * inc_local%
        weaponFinalMinPhys = (wpnBaseMin + localFlatPhysMin) * (1 + localIncreasePhysPercent / 100);
        weaponFinalMaxPhys = (wpnBaseMax + localFlatPhysMax) * (1 + localIncreasePhysPercent / 100);
        weaponFinalMinPhys = Math.max(0, Math.round(weaponFinalMinPhys));
        weaponFinalMaxPhys = Math.max(weaponFinalMinPhys, Math.round(weaponFinalMaxPhys));

        // Weapon's final elemental damage is just the sum of its local flats
        weaponFinalMinEle = Math.max(0, Math.round(localFlatMinEle));
        weaponFinalMaxEle = Math.max(weaponFinalMinEle, Math.round(localFlatMaxEle));

        // Calculate weapon's final attack speed and crit chance
        weaponFinalAttackSpeed = wpnBaseAttackSpeed * (1 + localIncreaseAttackSpeedPercent / 100);
        weaponFinalCritChance = wpnBaseCrit * (1 + localIncreaseCritChancePercent / 100);

        console.log(`[calculateEffectiveStats] Weapon Base Stats Set: Phys=${weaponFinalMinPhys}-${weaponFinalMaxPhys}, Ele=${weaponFinalMinEle}-${weaponFinalMaxEle}, Speed=${weaponFinalAttackSpeed.toFixed(2)}, Crit=${weaponFinalCritChance.toFixed(2)}%`);

    } else {
        console.warn(`[calculateEffectiveStats] Could not find BaseItemTemplate for weapon1 with baseId: ${weapon1.baseId}`);
    }
  }
  // --- END: Calculate Weapon's Final Stats ---

  // --- Initialize Global Accumulators ---
  let effCritMultiplier = character.criticalStrikeMultiplier ?? 150;
  let baseEvasion = character.evasion ?? 0; // Will include flat from jewelry
  let totalLifeLeech = 0;
  let totalArmorFromEquipment = 0; // Will include flat from jewelry
  let increasePhysDamagePercent = 0; // Global % Increase
  let increaseEleDamagePercent = 0; // Global % Increase
  let increaseGlobalAttackSpeedPercent = 0; // Global % Increase
  let increaseGlobalCritChancePercent = 0; // Global % Increase
  let increaseCritMultiplierPercent = 0; // Global Crit Multi Additive %
  let increaseFireDamagePercent = 0;
  let increaseColdDamagePercent = 0;
  let increaseLightningDamagePercent = 0;
  let increaseVoidDamagePercent = 0;
  let globalFlatMinPhys = 0; // Flat Phys from non-weapon sources
  let globalFlatMaxPhys = 0;
  let globalFlatMinFire = 0; // Flat Fire from non-weapon sources
  let globalFlatMaxFire = 0;
  let globalFlatMinCold = 0; // Flat Cold from non-weapon sources
  let globalFlatMaxCold = 0;
  let globalFlatMinLight = 0; // Flat Lightning from non-weapon sources
  let globalFlatMaxLight = 0;
  let globalFlatMinVoid = 0; // Flat Void from non-weapon sources
  let globalFlatMaxVoid = 0;
  let totalBonusStrength = 0;
  let totalBonusDexterity = 0;
  let totalBonusIntelligence = 0;
  let increaseEvasionPercent = 0; // Global % Increase
  let flatBarrier = 0; // Will include flat from jewelry + Int bonus
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
  let baseBlockChance = character.blockChance ?? 0; // Will include shield base
  let increaseBlockChancePercent = 0;

  // --- Process ALL Equipment Slots (Accumulate GLOBAL mods) ---
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue;

    // Accumulate base defenses (Armor, Barrier, Block) from item base stats
    // Note: calculateItemArmor handles local mods, so we call it here.
    if (item.baseArmor !== undefined) {
      totalArmorFromEquipment += calculateItemArmor(item);
    }
    // Base Barrier and Block are flat, added directly
    if (item.baseBarrier !== undefined) {
        flatBarrier += item.baseBarrier;
    }
    if (item.itemType === 'Shield') {
        baseBlockChance += item.baseBlockChance ?? 0;
    }

    // Function to check if a mod should be skipped for weapon1
    const shouldSkipWeapon1Mod = (modType: ModifierType): boolean => {
        if (slotId !== 'weapon1') return false;
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
      if (shouldSkipWeapon1Mod(mod.type)) continue; // Skip local/flat mods on weapon1

      switch (mod.type) {
        // Flat Damages (Only accumulate if NOT weapon1/weapon2)
        // Implicit check via shouldSkipWeapon1Mod ensures weapon1 is skipped
        case "AddsFlatPhysicalDamage": if (slotId !== 'weapon2') { globalFlatMinPhys += mod.valueMin ?? 0; globalFlatMaxPhys += mod.valueMax ?? 0; } break;
        case "AddsFlatFireDamage": if (slotId !== 'weapon2') { globalFlatMinFire += mod.valueMin ?? 0; globalFlatMaxFire += mod.valueMax ?? 0; } break;
        case "AddsFlatColdDamage": if (slotId !== 'weapon2') { globalFlatMinCold += mod.valueMin ?? 0; globalFlatMaxCold += mod.valueMax ?? 0; } break;
        case "AddsFlatLightningDamage": if (slotId !== 'weapon2') { globalFlatMinLight += mod.valueMin ?? 0; globalFlatMaxLight += mod.valueMax ?? 0; } break;
        case "AddsFlatVoidDamage": if (slotId !== 'weapon2') { globalFlatMinVoid += mod.valueMin ?? 0; globalFlatMaxVoid += mod.valueMax ?? 0; } break;

        // Global Percent Mods
        case "IncreasedPhysicalDamage": increasePhysDamagePercent += mod.value ?? 0; break;
        case "IncreasedElementalDamage": increaseEleDamagePercent += mod.value ?? 0; break;
        case "IncreasedFireDamage": increaseFireDamagePercent += mod.value ?? 0; break;
        case "IncreasedColdDamage": increaseColdDamagePercent += mod.value ?? 0; break;
        case "IncreasedLightningDamage": increaseLightningDamagePercent += mod.value ?? 0; break;
        case "IncreasedVoidDamage": increaseVoidDamagePercent += mod.value ?? 0; break;
        case "IncreasedCriticalStrikeMultiplier": increaseCritMultiplierPercent += mod.value ?? 0; break;
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
        // Flat defenses on Jewelry (add to global accumulators)
        case "FlatLocalArmor": if (JEWELRY_TYPES.has(item.itemType)) totalArmorFromEquipment += mod.value ?? 0; break; // Armor adds to the total from equipment
        case "FlatLocalEvasion": if (JEWELRY_TYPES.has(item.itemType)) baseEvasion += mod.value ?? 0; break; // Evasion adds to base evasion
        case "FlatLocalBarrier": if (JEWELRY_TYPES.has(item.itemType)) flatBarrier += mod.value ?? 0; break; // Barrier adds to flat barrier
        // Ignored Local Armor/Evasion/Barrier % increase mods here as they are handled by calculateItemArmor etc.
      }
    }

    // --- Process IMPLICIT Modifier (if it exists) ---
    if (item.implicitModifier) {
      const mod = item.implicitModifier;
      if (shouldSkipWeapon1Mod(mod.type)) { // Skip flat damage implicits on weapon1 too
           // console.log(`[calcStats Loop] Skipping IMPLICIT FLAT mod ${mod.type} on weapon1.`);
           continue; // Skip processing the rest of this item slot (implicit)
      }

      console.log(`[calcStats Loop] Processing IMPLICIT mod: ${mod.type} on ${item.name}`);
      switch (mod.type) {
        // Apply implicit mods similar to explicit ones (only if not weapon1/weapon2 for flat damage)
        case "AddsFlatPhysicalDamage": if (slotId !== 'weapon2') { globalFlatMinPhys += mod.valueMin ?? 0; globalFlatMaxPhys += mod.valueMax ?? 0; } break;
        case "AddsFlatFireDamage": if (slotId !== 'weapon2') { globalFlatMinFire += mod.valueMin ?? 0; globalFlatMaxFire += mod.valueMax ?? 0; } break;
        case "AddsFlatColdDamage": if (slotId !== 'weapon2') { globalFlatMinCold += mod.valueMin ?? 0; globalFlatMaxCold += mod.valueMax ?? 0; } break;
        case "AddsFlatLightningDamage": if (slotId !== 'weapon2') { globalFlatMinLight += mod.valueMin ?? 0; globalFlatMaxLight += mod.valueMax ?? 0; } break;
        case "AddsFlatVoidDamage": if (slotId !== 'weapon2') { globalFlatMinVoid += mod.valueMin ?? 0; globalFlatMaxVoid += mod.valueMax ?? 0; } break;
        // Other global implicits
        case "FireResistance": totalFireResist += mod.value ?? 0; break;
        case "ColdResistance": totalColdResist += mod.value ?? 0; break;
        case "LightningResistance": totalLightningResist += mod.value ?? 0; break;
        case "VoidResistance": totalVoidResist += mod.value ?? 0; break;
        case "FlatLocalArmor": if (JEWELRY_TYPES.has(item.itemType)) totalArmorFromEquipment += mod.value ?? 0; break;
        case "FlatLocalEvasion": if (JEWELRY_TYPES.has(item.itemType)) baseEvasion += mod.value ?? 0; break;
        case "FlatLocalBarrier": if (JEWELRY_TYPES.has(item.itemType)) flatBarrier += mod.value ?? 0; break;
        // Add other potential implicit types if needed later (e.g., MaxHealth, Attributes?)
        default: console.warn(`[calcStats Loop] Unhandled IMPLICIT modifier type: ${mod.type}`); break;
      }
    }
  } // --- End Equipment Loop ---

  // --- Combine Weapon Base + Global Flat Damage ---
  const totalFlatMinPhys = weaponFinalMinPhys + globalFlatMinPhys;
  const totalFlatMaxPhys = weaponFinalMaxPhys + globalFlatMaxPhys;
  // const totalFlatMinEle = weaponFinalMinEle + globalFlatMinFire + globalFlatMinCold + globalFlatMinLight + globalFlatMinVoid;
  // const totalFlatMaxEle = weaponFinalMaxEle + globalFlatMaxFire + globalFlatMaxCold + globalFlatMaxLight + globalFlatMaxVoid;

  // --- Apply Attribute Effects to Global Percentages/Flats FIRST ---
  const finalTotalStrength = character.strength + totalBonusStrength;
  increasePhysDamagePercent += Math.floor(finalTotalStrength / 5) * 2; // Example: 2% Inc Phys Dmg per 5 Str
  const finalTotalDexterity = character.dexterity + totalBonusDexterity;
  increaseEvasionPercent += Math.floor(finalTotalDexterity / 5) * 2; // Dex: +2% Evasion per 5 Dex
  increaseGlobalCritChancePercent += Math.floor(finalTotalDexterity / 5); // Dex: +1% Global Crit Chance per 5 Dex
  const finalTotalIntelligence = character.intelligence + totalBonusIntelligence;
  flatBarrier += Math.floor(finalTotalIntelligence / 5) * 5; // Int: +5 Flat Barrier per 5 Int

  // --- Apply Global Percentage Increases to Combined Flat Damage ---
  let effMinPhysDamage = totalFlatMinPhys * (1 + increasePhysDamagePercent / 100);
  let effMaxPhysDamage = totalFlatMaxPhys * (1 + increasePhysDamagePercent / 100);

  // Apply GLOBAL attack speed and crit chance increases to the WEAPON'S final base values
  let effAttackSpeed = weaponFinalAttackSpeed * (1 + increaseGlobalAttackSpeedPercent / 100);
  let effCritChance = weaponFinalCritChance * (1 + increaseGlobalCritChancePercent / 100);

  // <<< START: Revised Elemental Damage Calculation with Specific Increases >>>
  // Helper function to calculate final damage for one element
  const calculateFinalElementDamage = (
      weaponFlatMin: number, weaponFlatMax: number, // Local damage from weapon mods for this element
      globalFlatMin: number, globalFlatMax: number, // Global flat damage from other gear
      specificIncreasePercent: number // Specific % increase for this element
  ): { min: number, max: number } => {
      const totalFlatMin = weaponFlatMin + globalFlatMin;
      const totalFlatMax = weaponFlatMax + globalFlatMax;
      // Add global elemental increase % and specific elemental increase %
      const totalIncreasePercent = increaseEleDamagePercent + specificIncreasePercent;
      const finalMin = totalFlatMin * (1 + totalIncreasePercent / 100);
      const finalMax = totalFlatMax * (1 + totalIncreasePercent / 100);
      return { min: Math.max(0, Math.round(finalMin)), max: Math.max(finalMin, Math.round(finalMax)) }; // Ensure max >= min
  };

  // Find weapon's local flat damage for each element (needs slight refactor)
  const weaponLocalFire = { min: 0, max: 0 };
  const weaponLocalCold = { min: 0, max: 0 };
  const weaponLocalLightning = { min: 0, max: 0 };
  const weaponLocalVoid = { min: 0, max: 0 };

  if (weapon1) {
      const processWeaponMod = (mod: Modifier) => {
          switch (mod.type) {
              case "AddsFlatFireDamage": weaponLocalFire.min += mod.valueMin ?? 0; weaponLocalFire.max += mod.valueMax ?? 0; break;
              case "AddsFlatColdDamage": weaponLocalCold.min += mod.valueMin ?? 0; weaponLocalCold.max += mod.valueMax ?? 0; break;
              case "AddsFlatLightningDamage": weaponLocalLightning.min += mod.valueMin ?? 0; weaponLocalLightning.max += mod.valueMax ?? 0; break;
              case "AddsFlatVoidDamage": weaponLocalVoid.min += mod.valueMin ?? 0; weaponLocalVoid.max += mod.valueMax ?? 0; break;
          }
      };
      weapon1.modifiers.forEach(processWeaponMod);
      if (weapon1.implicitModifier) {
          processWeaponMod(weapon1.implicitModifier);
      }
      // Ensure max >= min for each local element after summing
      weaponLocalFire.max = Math.max(weaponLocalFire.min, weaponLocalFire.max);
      weaponLocalCold.max = Math.max(weaponLocalCold.min, weaponLocalCold.max);
      weaponLocalLightning.max = Math.max(weaponLocalLightning.min, weaponLocalLightning.max);
      weaponLocalVoid.max = Math.max(weaponLocalVoid.min, weaponLocalVoid.max);
  }

  // Calculate final damage for each element
  const fireDamage = calculateFinalElementDamage(weaponLocalFire.min, weaponLocalFire.max, globalFlatMinFire, globalFlatMaxFire, increaseFireDamagePercent);
  const coldDamage = calculateFinalElementDamage(weaponLocalCold.min, weaponLocalCold.max, globalFlatMinCold, globalFlatMaxCold, increaseColdDamagePercent);
  const lightningDamage = calculateFinalElementDamage(weaponLocalLightning.min, weaponLocalLightning.max, globalFlatMinLight, globalFlatMaxLight, increaseLightningDamagePercent);
  const voidDamage = calculateFinalElementDamage(weaponLocalVoid.min, weaponLocalVoid.max, globalFlatMinVoid, globalFlatMaxVoid, increaseVoidDamagePercent);

  // Sum up the final elemental damages
  let effMinEleDamage = fireDamage.min + coldDamage.min + lightningDamage.min + voidDamage.min;
  let effMaxEleDamage = fireDamage.max + coldDamage.max + lightningDamage.max + voidDamage.max;
  // <<< END: Revised Elemental Damage Calculation >>>

  effCritMultiplier += increaseCritMultiplierPercent; // Crit multi adds flat percentage points

  // Apply Evasion % increase to base evasion (which includes flat from jewelry)
  let effEvasion = baseEvasion * (1 + increaseEvasionPercent / 100);

  // --- Final Clamping and Formatting ---
  effMinPhysDamage = Math.max(0, Math.round(effMinPhysDamage));
  effMaxPhysDamage = Math.max(effMinPhysDamage, Math.round(effMaxPhysDamage));
  effMinEleDamage = Math.max(0, Math.round(effMinEleDamage));
  effMaxEleDamage = Math.max(effMinEleDamage, Math.round(effMaxEleDamage));

  effAttackSpeed = Math.max(0.1, parseFloat(effAttackSpeed.toFixed(2))); // Ensure minimum speed and format
  effCritChance = Math.max(0, parseFloat(effCritChance.toFixed(2))); // Format and ensure non-negative
  effCritMultiplier = Math.max(100, parseFloat(effCritMultiplier.toFixed(2))); // Ensure minimum 100% and format
  totalLifeLeech = parseFloat(totalLifeLeech.toFixed(2));
  effEvasion = Math.max(0, Math.round(effEvasion)); // Round final evasion

  // --- Apply Dual Wielding "More" Multipliers ---
  const weapon2 = character.equipment.weapon2;
  const isTrueDualWielding = weapon1 && weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

  if (isTrueDualWielding) {
      console.log("[calculateEffectiveStats] Applying Dual Wielding Buffs (10% More Atk Spd, 10% More Phys Dmg)");
      effAttackSpeed *= 1.10;
      effMinPhysDamage *= 1.10; // Apply MORE multiplier to final phys
      effMaxPhysDamage *= 1.10;
      // Re-round physical damage and speed
      effMinPhysDamage = Math.max(0, Math.round(effMinPhysDamage));
      effMaxPhysDamage = Math.max(effMinPhysDamage, Math.round(effMaxPhysDamage));
      effAttackSpeed = Math.max(0.1, parseFloat(effAttackSpeed.toFixed(2))); // Re-apply formatting/min
  }

  // Combined total damage (final calculation AFTER all multipliers)
  const totalMinDamage = effMinPhysDamage + effMinEleDamage;
  const totalMaxDamage = effMaxPhysDamage + effMaxEleDamage;

  // --- Calculate DPS ---
  const calculateDps = (minD: number, maxD: number, atkSpd: number, critC: number, critM: number): number => {
      const avgD = (minD + maxD) / 2;
      const critC_dec = Math.min(100, critC) / 100; // Cap crit chance at 100% for DPS calc
      const critM_dec = critM / 100;
      // DPS formula: AvgHit * Speed * (1 + CritChance * (CritMultiplier - 1))
      return parseFloat((avgD * atkSpd * (1 + critC_dec * (critM_dec - 1))).toFixed(2));
  };

  const totalDps = calculateDps(totalMinDamage, totalMaxDamage, effAttackSpeed, effCritChance, effCritMultiplier);
  const physDps = calculateDps(effMinPhysDamage, effMaxPhysDamage, effAttackSpeed, effCritChance, effCritMultiplier);
  const eleDps = calculateDps(effMinEleDamage, effMaxEleDamage, effAttackSpeed, effCritChance, effCritMultiplier);

  // --- Calculate Final Defensive Stats ---
  const finalMaxHealth = calculateFinalMaxHealth(character.baseMaxHealth, flatHealthFromMods);
  const finalTotalArmor = (character.armor ?? 0) + totalArmorFromEquipment; // Base character armor + equipment armor
  const finalTotalBarrier = flatBarrier; // flatBarrier includes base + jewelry flat + Int bonus
  const finalFireRes = Math.min(totalFireResist, 75);
  const finalColdRes = Math.min(totalColdResist, 75);
  const finalLightningRes = Math.min(totalLightningResist, 75);
  const finalVoidRes = Math.min(totalVoidResist, 75);
  const regenFromPercent = finalMaxHealth * (accumulatedPercentLifeRegen / 100);
  const finalLifeRegenPerSecond = parseFloat((accumulatedFlatLifeRegen + regenFromPercent).toFixed(1)); // Format regen
  const referenceDamageHit = 100; // For estimation
  const estimatedPhysReductionPercent = finalTotalArmor > 0 ? parseFloat(((finalTotalArmor / (finalTotalArmor + 10 * referenceDamageHit)) * 100).toFixed(1)) : 0;
  let finalTotalBlockChance = Math.round(baseBlockChance * (1 + increaseBlockChancePercent / 100));
  finalTotalBlockChance = Math.min(75, finalTotalBlockChance);

  // --- Final Effective Stats Object ---
  const finalStats: EffectiveStats = {
    // Final calculated values
    minDamage: totalMinDamage,
    maxDamage: totalMaxDamage,
    minPhysDamage: effMinPhysDamage,
    maxPhysDamage: effMaxPhysDamage,
    minEleDamage: effMinEleDamage,
    maxEleDamage: effMaxEleDamage,
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
    thornsDamage: totalThorns,
    estimatedPhysReductionPercent: estimatedPhysReductionPercent,
    totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
    totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,

    // Breakdown fields
    weaponBaseMinPhys: weaponFinalMinPhys,
    weaponBaseMaxPhys: weaponFinalMaxPhys,
    weaponBaseMinEle: weaponFinalMinEle,
    weaponBaseMaxEle: weaponFinalMaxEle,
    weaponBaseAttackSpeed: weaponFinalAttackSpeed,
    weaponBaseCritChance: weaponFinalCritChance,

    globalFlatMinPhys: globalFlatMinPhys, // Only non-weapon flat phys
    globalFlatMaxPhys: globalFlatMaxPhys,
    globalFlatMinFire: globalFlatMinFire, // Only non-weapon flat fire
    globalFlatMaxFire: globalFlatMaxFire,
    globalFlatMinCold: globalFlatMinCold, // Only non-weapon flat cold
    globalFlatMaxCold: globalFlatMaxCold,
    globalFlatMinLightning: globalFlatMinLight, // Only non-weapon flat lightning
    globalFlatMaxLightning: globalFlatMaxLight,
    globalFlatMinVoid: globalFlatMinVoid, // Only non-weapon flat void
    globalFlatMaxVoid: globalFlatMaxVoid,

    increasePhysDamagePercent: increasePhysDamagePercent, // Includes attribute bonus
    increaseAttackSpeedPercent: increaseGlobalAttackSpeedPercent, // Includes attribute bonus? (No, Dex affects crit now)
    increaseEleDamagePercent: increaseEleDamagePercent, // Includes attribute bonus? (No)
    increaseFireDamagePercent: increaseFireDamagePercent,
    increaseColdDamagePercent: increaseColdDamagePercent,
    increaseLightningDamagePercent: increaseLightningDamagePercent,
    increaseVoidDamagePercent: increaseVoidDamagePercent,
    increaseGlobalCritChancePercent: increaseGlobalCritChancePercent, // Includes attribute bonus
  };

  console.log(`[calculateEffectiveStats] END for ${character.name}. Returning:`, finalStats);
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
} {
  // --- Find Base Template ---
  const template = ALL_ITEM_BASES.find(t => t.baseId === item.baseId);

  // --- Initialize with Base Stats from Template ---
  let minDamage = template?.baseMinDamage ?? 0; // Use template base damage
  let maxDamage = template?.baseMaxDamage ?? 0; // Use template base damage
  let attackSpeed = template?.baseAttackSpeed ?? 1; // Use template base speed
  const baseCritChance = template?.baseCriticalStrikeChance ?? 5; // Ensure this uses CONST

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

  item.modifiers.forEach((mod) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage":
        addedMinDamage += mod.valueMin ?? 0; // Accumulate flat phys
        addedMaxDamage += mod.valueMax ?? 0;
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

    console.log(`[calcSwingDmg] Weapon: ${weapon.name}, Final Calc: Phys=${finalMinPhys}-${finalMaxPhys}, Ele=${finalMinEle}-${finalMaxEle}, Total=${totalMin}-${totalMax}`);

    return {
        minPhys: finalMinPhys,
        maxPhys: finalMaxPhys,
        minEle: finalMinEle,
        maxEle: finalMaxEle,
        totalMin: totalMin,
        totalMax: totalMax,
    };
} 