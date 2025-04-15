import { Character, EquippableItem /*, Modifier */ } from "../types/gameData"; // Modifier type used implicitly
import { ONE_HANDED_WEAPON_TYPES } from './itemUtils'; // <<< ADD IMPORT

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
  baseMinPhysDamage: number;
  baseMaxPhysDamage: number;
  baseAttackSpeed: number;
  flatMinFire: number;
  flatMaxFire: number;
  flatMinCold: number;
  flatMaxCold: number;
  flatMinLightning: number;
  flatMaxLightning: number;
  flatMinVoid: number;
  flatMaxVoid: number;
  increasePhysDamagePercent: number;
  increaseAttackSpeedPercent: number;
  increaseEleDamagePercent: number;
  // --- Added specific elemental increase percentages ---
  increaseFireDamagePercent: number;
  increaseColdDamagePercent: number;
  increaseLightningDamagePercent: number;
  increaseVoidDamagePercent: number;
  // --- Added global crit chance increase percentage ---
  increaseGlobalCritChancePercent: number;
  // Note: increaseCritChancePercent is already calculated but maybe not needed directly if final is shown
  // Note: increaseCritMultiplierPercent is already calculated but maybe not needed directly if final is shown
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

export function calculateEffectiveStats(character: Character): EffectiveStats {
  console.log(`[calculateEffectiveStats] START for ${character.name}`); // <<< Ensure Present
  // Base Stats - Determine base attack speed from weapon or unarmed
  const weapon1 = character.equipment?.weapon1;
  // let baseAttackSpeed = weapon1?.baseAttackSpeed ?? UNARMED_ATTACK_SPEED; // Calculate modified base later
  // let baseCritChance = weapon1?.baseCriticalStrikeChance ?? character.criticalStrikeChance ?? 5; // Calculate modified base later

  let baseMinPhys = character.minBaseDamage ?? 0;
  let baseMaxPhys = character.maxBaseDamage ?? 0;
  let baseAttackSpeed = UNARMED_ATTACK_SPEED; // Start unarmed
  let baseCritChance = character.criticalStrikeChance ?? 5; // Start with character base crit

  // --- START: Calculate Modified Base Stats from Weapon 1 --- 
  if (weapon1) {
    const wpnBaseMin = weapon1.baseMinDamage ?? 0;
    const wpnBaseMax = weapon1.baseMaxDamage ?? 0;
    const wpnBaseAttackSpeed = weapon1.baseAttackSpeed ?? UNARMED_ATTACK_SPEED;
    const wpnBaseCrit = weapon1.baseCriticalStrikeChance ?? 5;
    
    let localFlatPhysMin = 0;
    let localFlatPhysMax = 0;
    let localIncreasePhysPercent = 0;
    let localIncreaseAttackSpeedPercent = 0;
    let localIncreaseCritChancePercent = 0;

    weapon1.modifiers.forEach(mod => {
        switch (mod.type) {
            case "AddsFlatPhysicalDamage":
                localFlatPhysMin += mod.valueMin ?? 0;
                localFlatPhysMax += mod.valueMax ?? 0;
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
            // Ignore others for base calculation
        }
    });

    // Calculate modified base physical damage for the weapon
    baseMinPhys = (wpnBaseMin + localFlatPhysMin) * (1 + localIncreasePhysPercent / 100);
    baseMaxPhys = (wpnBaseMax + localFlatPhysMax) * (1 + localIncreasePhysPercent / 100);
    baseMinPhys = Math.max(0, Math.round(baseMinPhys)); // Round here
    baseMaxPhys = Math.max(baseMinPhys, Math.round(baseMaxPhys)); // Round here
    
    // Calculate modified base attack speed for the weapon
    baseAttackSpeed = wpnBaseAttackSpeed * (1 + localIncreaseAttackSpeedPercent / 100);
    // baseAttackSpeed = parseFloat(baseAttackSpeed.toFixed(2)); // Rounding happens later

    // Calculate modified base crit chance for the weapon
    baseCritChance = wpnBaseCrit * (1 + localIncreaseCritChancePercent / 100);
    // baseCritChance = parseFloat(baseCritChance.toFixed(2)); // Rounding happens later
  }
  // --- END: Calculate Modified Base Stats from Weapon 1 --- 

  // let effCritChance = baseCritChance; // Use calculated baseCritChance directly
  let effCritMultiplier = character.criticalStrikeMultiplier ?? 150;
  const baseEvasion = character.evasion ?? 0;
  const baseBarrier = character.barrier ?? 0;
  let totalLifeLeech = 0;

  // Accumulator for armor from equipment
  let totalArmorFromEquipment = 0; // NEW

  // Elemental damage starts at 0 base
  const baseMinEle = 0; // Use const
  const baseMaxEle = 0; // Use const

  // Modifiers accumulated from ALL gear
  let increasePhysDamagePercent = 0; // GLOBAL
  let increaseEleDamagePercent = 0; // Global Elemental Damage %
  let increaseGlobalAttackSpeedPercent = 0; // GLOBAL
  let increaseGlobalCritChancePercent = 0; // Global
  let increaseCritMultiplierPercent = 0; // Global Crit Multi %
  let increaseFireDamagePercent = 0; // Specific Elements
  let increaseColdDamagePercent = 0;
  let increaseLightningDamagePercent = 0;
  let increaseVoidDamagePercent = 0;
  let flatMinPhysDamage = 0;
  let flatMaxPhysDamage = 0;
  let flatMinFire = 0, flatMaxFire = 0;
  let flatMinCold = 0, flatMaxCold = 0;
  let flatMinLight = 0, flatMaxLight = 0;
  let flatMinVoid = 0, flatMaxVoid = 0;
  let totalBonusStrength = 0; // Accumulator for Strength
  let totalBonusDexterity = 0; // Accumulator for Dexterity
  let totalBonusIntelligence = 0; // Accumulator for Intelligence
  let increaseEvasionPercent = 0;
  let flatBarrier = 0;
  let flatHealthFromMods = 0; // New
  let totalFireResist = character.fireResistance ?? 0; // Start with character base
  let totalColdResist = character.coldResistance ?? 0;
  let totalLightningResist = character.lightningResistance ?? 0;
  let totalVoidResist = character.voidResistance ?? 0;
  let accumulatedFlatLifeRegen = 0; // NEW accumulator
  let accumulatedPercentLifeRegen = 0; // NEW accumulator
  let totalThorns = 0; // New
  // NEW ACCUMULATORS
  let accumulatedPhysTakenAsElementPercent = 0;
  let accumulatedReducedPhysDamageTakenPercent = 0;
  let baseBlockChance = character.blockChance ?? 0;
  let increaseBlockChancePercent = 0;

  // --- Process ALL Equipment Slots --- 
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue; // Skip empty slots

    // Calculate and add item's final armor if applicable
    if (item.baseArmor !== undefined) {
      totalArmorFromEquipment += calculateItemArmor(item); // Use the new function
    }

    // Apply weapon-specific base stats if it's weapon1 (primary)
    // NO LONGER NEEDED - Base stats are pre-calculated above
    /*
    if (slotId === 'weapon1') {
        baseMinPhys = item.baseMinDamage ?? baseMinPhys; 
        baseMaxPhys = item.baseMaxDamage ?? baseMaxPhys; 
    }
    */

    // Process modifiers from the current item
    for (const mod of item.modifiers) {
      // --- Skip LOCAL weapon mods if processing weapon1 --- 
      if (slotId === 'weapon1') {
          if (mod.type === "IncreasedLocalPhysicalDamage" ||
              mod.type === "IncreasedLocalAttackSpeed" ||
              mod.type === "IncreasedLocalCriticalStrikeChance" ||
              mod.type === "AddsFlatPhysicalDamage" // Flat phys is also local on weapon1
          ) {
              console.log(`[calcStats Loop] Skipping LOCAL mod ${mod.type} on weapon1.`);
              continue; // Skip to next modifier
          }
      }
      // -----------------------------------------------------

      switch (mod.type) {
        // Flat Damages (Global - applied AFTER local weapon calc)
        case "AddsFlatPhysicalDamage":
          // Applied globally from non-weapon1 slots
          flatMinPhysDamage += mod.valueMin ?? 0;
          flatMaxPhysDamage += mod.valueMax ?? 0;
          break;
        case "AddsFlatFireDamage": flatMinFire += mod.valueMin ?? 0; flatMaxFire += mod.valueMax ?? 0; break;
        case "AddsFlatColdDamage": flatMinCold += mod.valueMin ?? 0; flatMaxCold += mod.valueMax ?? 0; break;
        case "AddsFlatLightningDamage": flatMinLight += mod.valueMin ?? 0; flatMaxLight += mod.valueMax ?? 0; break;
        case "AddsFlatVoidDamage": flatMinVoid += mod.valueMin ?? 0; flatMaxVoid += mod.valueMax ?? 0; break;

        // Global Percent Mods
        case "IncreasedPhysicalDamage":
          increasePhysDamagePercent += mod.value ?? 0;
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
        case "IncreasedCriticalStrikeMultiplier":
          increaseCritMultiplierPercent += mod.value ?? 0;
          break;
        case "IncreasedGlobalAttackSpeed": // GLOBAL Atk Speed %
             increaseGlobalAttackSpeedPercent += mod.value ?? 0;
             break;
        case "IncreasedGlobalCriticalStrikeChance": // GLOBAL Crit Chance %
             increaseGlobalCritChancePercent += mod.value ?? 0;
             break;
        case "LifeLeech":
          totalLifeLeech += mod.value ?? 0;
          break;

        // Attributes (Global)
        case "Strength":
          totalBonusStrength += mod.value ?? 0;
          break;
        case "Dexterity":
          totalBonusDexterity += mod.value ?? 0;
          break;
        case "Intelligence":
          totalBonusIntelligence += mod.value ?? 0;
          break;

        // Defensive Mods (New Cases)
        case "MaxHealth":
            flatHealthFromMods += mod.value ?? 0;
            break;
        case "FireResistance":
            totalFireResist += mod.value ?? 0;
            break;
        case "ColdResistance":
            totalColdResist += mod.value ?? 0;
            break;
        case "LightningResistance":
            totalLightningResist += mod.value ?? 0;
            break;
        case "VoidResistance":
            totalVoidResist += mod.value ?? 0;
            break;
        case "FlatLifeRegen":
            accumulatedFlatLifeRegen += mod.value ?? 0;
            break;
        case "PercentLifeRegen":
            accumulatedPercentLifeRegen += mod.value ?? 0;
            break;
        case "ThornsDamage":
            totalThorns += mod.value ?? 0;
            break;
        // NEW CASES
        case "PhysDamageTakenAsElement":
          accumulatedPhysTakenAsElementPercent += mod.value ?? 0;
          break;
        case "ReducedPhysDamageTaken":
          accumulatedReducedPhysDamageTakenPercent += mod.value ?? 0;
          break;
        case "IncreasedLocalBarrier":
          flatBarrier += mod.value ?? 0;
          break;
        case "IncreasedBlockChance":
          increaseBlockChancePercent += mod.value ?? 0;
          break;
      }
    }

    // --- Add BASE stats from item ---
    if (item.baseArmor !== undefined) {
      totalArmorFromEquipment += item.baseArmor;
    }

    // --- Add BASE Block Chance from Shield ---
    if (item.itemType === 'Shield') {
        baseBlockChance += item.baseBlockChance ?? 0;
    }
  }

  // --- Combine Base (weapon-modified) + GLOBAL Flat Mods --- 
  let effMinPhysDamage = baseMinPhys + flatMinPhysDamage;
  let effMaxPhysDamage = baseMaxPhys + flatMaxPhysDamage;
  let effMinEleDamage = baseMinEle + flatMinFire + flatMinCold + flatMinLight + flatMinVoid;
  let effMaxEleDamage = baseMaxEle + flatMaxFire + flatMaxCold + flatMaxLight + flatMaxVoid;

  // --- Apply Base Character Stats for Evasion/Barrier ---
  let effEvasion = baseEvasion;
  let effBarrier = baseBarrier;

  // --- Apply Percentage Increases --- 
  // --- Apply Attribute Effects FIRST (using example logic) ---
  // Example: 1% Inc Phys Dmg per 5 Str
  const finalTotalStrength = character.strength + totalBonusStrength;
  increasePhysDamagePercent += Math.floor(finalTotalStrength / 5) * 2;
  // Dex: +2% Evasion per 5 Dex, +1% Crit Chance per 5 Dex
  increaseEvasionPercent += Math.floor((character.dexterity + totalBonusDexterity) / 5) * 2;
  // Dex now affects GLOBAL crit chance (since local is part of base)
  increaseGlobalCritChancePercent += Math.floor((character.dexterity + totalBonusDexterity) / 5);
  // Example: 1% Inc Attack Speed per 10 Dex (alternative/additional effect)
  // increaseAttackSpeedPercent += Math.floor((character.dexterity + totalBonusDexterity) / 10);
  // Int: +20 Barrier per 5 Int
  flatBarrier += Math.floor((character.intelligence + totalBonusIntelligence) / 5) * 20;

  // Local weapon mods applied first to phys damage and attack speed - REWORKED
  effMinPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effMaxPhysDamage *= (1 + increasePhysDamagePercent / 100);
  
  // Apply GLOBAL attack speed and crit chance increases to the MODIFIED base values
  let effAttackSpeed = baseAttackSpeed * (1 + increaseGlobalAttackSpeedPercent / 100);
  let effCritChance = baseCritChance * (1 + increaseGlobalCritChancePercent / 100);

  // Global mods affecting elemental and crit multi
  // Calculate individual elemental damages considering specific and global increases
  const calculateFinalElementDamage = (baseMin: number, baseMax: number, flatMin: number, flatMax: number, specificIncrease: number) => {
    const totalIncreasePercent = increaseEleDamagePercent + specificIncrease;
    const min = (baseMin + flatMin) * (1 + totalIncreasePercent / 100);
    const max = (baseMax + flatMax) * (1 + totalIncreasePercent / 100);
    return { min: Math.max(0, Math.round(min)), max: Math.max(0, Math.round(max)) };
  };
  const fireDamage = calculateFinalElementDamage(baseMinEle, baseMaxEle, flatMinFire, flatMaxFire, increaseFireDamagePercent);
  const coldDamage = calculateFinalElementDamage(baseMinEle, baseMaxEle, flatMinCold, flatMaxCold, increaseColdDamagePercent);
  const lightningDamage = calculateFinalElementDamage(baseMinEle, baseMaxEle, flatMinLight, flatMaxLight, increaseLightningDamagePercent);
  const voidDamage = calculateFinalElementDamage(baseMinEle, baseMaxEle, flatMinVoid, flatMaxVoid, increaseVoidDamagePercent);
  
  // Sum up final elemental damages
  effMinEleDamage = fireDamage.min + coldDamage.min + lightningDamage.min + voidDamage.min;
  effMaxEleDamage = fireDamage.max + coldDamage.max + lightningDamage.max + voidDamage.max;
  
  effCritMultiplier += increaseCritMultiplierPercent; // Crit multi adds flat percentage points

  // Apply Evasion % increase
  effEvasion *= (1 + increaseEvasionPercent / 100);
  // Apply flat Barrier increase
  effBarrier += flatBarrier;

  // --- Final Clamping and Formatting --- 
  effMinPhysDamage = Math.max(0, Math.round(effMinPhysDamage));
  effMaxPhysDamage = Math.max(effMinPhysDamage, Math.round(effMaxPhysDamage));
  effMinEleDamage = Math.max(0, Math.round(effMinEleDamage));
  effMaxEleDamage = Math.max(effMinEleDamage, Math.round(effMaxEleDamage));

  effAttackSpeed = Math.max(0.1, effAttackSpeed); // Ensure minimum speed
  effAttackSpeed = parseFloat(effAttackSpeed.toFixed(2));
  effCritChance = parseFloat((effCritChance).toFixed(2));
  effCritMultiplier = parseFloat(effCritMultiplier.toFixed(2));
  totalLifeLeech = parseFloat(totalLifeLeech.toFixed(2));
  effEvasion = Math.max(0, parseFloat(effEvasion.toFixed(2)));
  effBarrier = Math.max(0, Math.round(effBarrier));

  // --- START: Apply Dual Wielding "More" Multipliers --- 
  const weapon2 = character.equipment.weapon2;
  const isTrueDualWielding = weapon1 && weapon2 && ONE_HANDED_WEAPON_TYPES.has(weapon1.itemType) && ONE_HANDED_WEAPON_TYPES.has(weapon2.itemType);

  if (isTrueDualWielding) {
      console.log("[calculateEffectiveStats] Applying Dual Wielding Buffs (10% More Atk Spd, 10% More Phys Dmg)");
      // Apply 10% MORE Attack Speed
      effAttackSpeed *= 1.10;
      // Apply 10% MORE Physical Damage
      effMinPhysDamage *= 1.10;
      effMaxPhysDamage *= 1.10;

      // Re-round physical damage after multiplying
      effMinPhysDamage = Math.max(0, Math.round(effMinPhysDamage));
      effMaxPhysDamage = Math.max(effMinPhysDamage, Math.round(effMaxPhysDamage));
      // Re-do attack speed rounding if needed (it's done later anyway)
      // effAttackSpeed = parseFloat(effAttackSpeed.toFixed(2)); 
  }
  // --- END: Apply Dual Wielding "More" Multipliers --- 

  // Combined total damage (using potentially buffed phys damage)
  const totalMinDamage = effMinPhysDamage + effMinEleDamage;
  const totalMaxDamage = effMaxPhysDamage + effMaxEleDamage;

  // --- Calculate DPS --- 
  const calculateDps = (minD: number, maxD: number, atkSpd: number, critC: number, critM: number): number => {
      const avgD = (minD + maxD) / 2;
      const critC_dec = critC / 100;
      const critM_dec = critM / 100;
      return parseFloat((avgD * atkSpd * (1 + critC_dec * (critM_dec - 1))).toFixed(2));
  };

  const totalDps = calculateDps(totalMinDamage, totalMaxDamage, effAttackSpeed, effCritChance, effCritMultiplier);
  const physDps = calculateDps(effMinPhysDamage, effMaxPhysDamage, effAttackSpeed, effCritChance, effCritMultiplier);
  const eleDps = calculateDps(effMinEleDamage, effMaxEleDamage, effAttackSpeed, effCritChance, effCritMultiplier);

  // --- Calculate Final Max Health --- 
  console.log(`[calculateEffectiveStats] Character Base Max Health (input): ${character.maxHealth}`); // <<< Keep this log
  // Revert the call to the helper function
  console.log(`[calculateEffectiveStats] Calling calculateFinalMaxHealth with: baseMaxHealth=${character.baseMaxHealth}, flatHealthFromMods=${flatHealthFromMods}`); // Revert Log
  const finalMaxHealth = calculateFinalMaxHealth(
      character.baseMaxHealth,
      flatHealthFromMods
  );
  console.log(`[calculateEffectiveStats] Received finalMaxHealth from helper: ${finalMaxHealth}`); // <<< Keep this log

  // --- Calculate Final Total Armor ---
  const finalTotalArmor = (character.armor ?? 0) + totalArmorFromEquipment; // Add character base armor to sum from equipment

  // Calculate final Resistances (capped at 75%)
  const finalFireRes = Math.min(totalFireResist, 75);
  const finalColdRes = Math.min(totalColdResist, 75);
  const finalLightningRes = Math.min(totalLightningResist, 75);
  const finalVoidRes = Math.min(totalVoidResist, 75);

  // Calculate final Life Regen per second
  const regenFromPercent = finalMaxHealth * (accumulatedPercentLifeRegen / 100);
  const finalLifeRegenPerSecond = accumulatedFlatLifeRegen + regenFromPercent;
  console.log(`[calculateEffectiveStats] Final Calculated Regen: ${finalLifeRegenPerSecond} (Based on maxHealth: ${finalMaxHealth})`); // <<< Ensure Present

  // --- Physical Damage Reduction Estimation (PoE Style) ---
  const referenceDamageHit = 100; // Hypothetical incoming damage amount
  const estimatedPhysReductionPercent =
    finalTotalArmor > 0
      ? (finalTotalArmor / (finalTotalArmor + 10 * referenceDamageHit)) * 100
      : 0;

  // --- Calculate Final Block Chance ---
  let finalTotalBlockChance = Math.round(baseBlockChance * (1 + increaseBlockChancePercent / 100));
  finalTotalBlockChance = Math.min(75, finalTotalBlockChance); // Cap block chance at 75%

  // --- Final Effective Stats Object --- 
  const finalStats = {
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
    totalBarrier: effBarrier,
    totalBlockChance: finalTotalBlockChance,
    finalFireResistance: finalFireRes,
    finalColdResistance: finalColdRes,
    finalLightningResistance: finalLightningRes,
    finalVoidResistance: finalVoidRes,
    finalLifeRegenPerSecond: finalLifeRegenPerSecond,
    thornsDamage: totalThorns,
    baseMinPhysDamage: baseMinPhys,
    baseMaxPhysDamage: baseMaxPhys,
    baseAttackSpeed: baseAttackSpeed,
    flatMinFire: flatMinFire,
    flatMaxFire: flatMaxFire,
    flatMinCold: flatMinCold,
    flatMaxCold: flatMaxCold,
    flatMinLightning: flatMinLight,
    flatMaxLightning: flatMaxLight,
    flatMinVoid: flatMinVoid,
    flatMaxVoid: flatMaxVoid,
    increasePhysDamagePercent: increasePhysDamagePercent,
    increaseAttackSpeedPercent: increaseGlobalAttackSpeedPercent,
    increaseEleDamagePercent: increaseEleDamagePercent,
    increaseFireDamagePercent: increaseFireDamagePercent,
    increaseColdDamagePercent: increaseColdDamagePercent,
    increaseLightningDamagePercent: increaseLightningDamagePercent,
    increaseVoidDamagePercent: increaseVoidDamagePercent,
    increaseGlobalCritChancePercent: increaseGlobalCritChancePercent,
    estimatedPhysReductionPercent: estimatedPhysReductionPercent,
    totalPhysTakenAsElementPercent: accumulatedPhysTakenAsElementPercent,
    totalReducedPhysDamageTakenPercent: accumulatedReducedPhysDamageTakenPercent,
  };

  console.log(`[calculateEffectiveStats] END for ${character.name}. Returning maxHealth: ${finalMaxHealth}`); // <<< Ensure Present
  return finalStats;
}

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
  let minDamage = item.baseMinDamage ?? 0;
  let maxDamage = item.baseMaxDamage ?? 0;
  let attackSpeed = item.baseAttackSpeed ?? 1;
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

  // Apply added flat damage FIRST
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

  // Calculate final crit chance
  let critChance = item.baseCriticalStrikeChance ?? 5;
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
export function calculateSingleWeaponSwingDamage(weapon: EquippableItem, globalStats: EffectiveStats): {
  minPhys: number;
  maxPhys: number;
  minEle: number;
  maxEle: number;
  totalMin: number;
  totalMax: number;
} {
    // --- Step 1: Base Damage & Local Mods --- 
    let localMinPhys = weapon.baseMinDamage ?? 0;
    let localMaxPhys = weapon.baseMaxDamage ?? 0;
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
    let finalMinEle = localMinEle * (1 + globalStats.increaseEleDamagePercent / 100);
    let finalMaxEle = localMaxEle * (1 + globalStats.increaseEleDamagePercent / 100);

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