import { Character, EquippableItem /*, Modifier */ } from "../types/gameData"; // Modifier type used implicitly

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
  evasion: number;
  barrier: number;
  finalFireResistance: number;
  finalColdResistance: number;
  finalLightningResistance: number;
  finalVoidResistance: number;
  flatLifeRegen: number;
  percentLifeRegen: number;
  thornsDamage: number; // Added Thorns

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
        totalBonusStrength += mod.value;
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
        totalBonusDexterity += mod.value;
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
        totalBonusIntelligence += mod.value;
      }
    }
  }
  return character.intelligence + totalBonusIntelligence;
}

// Calculates final max health - Now includes bonus flat health from mods
export function calculateFinalMaxHealth(
    baseMaxHealth: number, 
    totalStrength: number,
    flatHealthFromMods: number // Added param
): number {
  const strengthBonusPercent = Math.floor(totalStrength / 5) * 2;
  const healthAfterStrength = Math.round(baseMaxHealth * (1 + strengthBonusPercent / 100));
  const finalHealth = healthAfterStrength + flatHealthFromMods; // Add flat bonus
  return Math.max(1, finalHealth); // Ensure minimum 1 health
}

export function calculateEffectiveStats(character: Character): EffectiveStats {
  // Base Stats - Determine base attack speed from weapon or unarmed
  const weapon1 = character.equipment?.weapon1;
  const baseAttackSpeed = weapon1?.baseAttackSpeed ?? UNARMED_ATTACK_SPEED;
  // Get base crit chance from weapon if available, otherwise from character
  const baseCritChance = weapon1?.baseCriticalStrikeChance ?? character.criticalStrikeChance ?? 5;

  let baseMinPhys = character.minBaseDamage ?? 0;
  let baseMaxPhys = character.maxBaseDamage ?? 0;
  let effCritChance = baseCritChance; // Start with base from weapon/char
  let effCritMultiplier = character.criticalStrikeMultiplier ?? 150;
  const baseEvasion = character.evasion ?? 0;
  const baseBarrier = character.barrier ?? 0;
  const baseArmor = character.armor ?? 0; // Base armor from character
  let totalLifeLeech = 0;

  // --- Determine Base Armor from Body Armor --- 
  // Fix linter error: Use const and determine before loop
  const bodyArmorItem = character.equipment?.bodyArmor;
  const currentItemBaseArmor = bodyArmorItem?.baseArmor ?? 0;

  // Elemental damage starts at 0 base
  const baseMinEle = 0; // Use const
  const baseMaxEle = 0; // Use const

  // Modifiers accumulated from ALL gear
  let increasePhysDamagePercent = 0;
  let increaseEleDamagePercent = 0; // Global Elemental Damage %
  let increaseAttackSpeedPercent = 0;
  let increaseLocalCritChancePercent = 0; // Local to weapon
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
  let flatArmorFromMods = 0; // New
  let increaseArmorPercent = 0; // New - Assuming this affects total armor (base + flat)
  let flatHealthFromMods = 0; // New
  let totalFireResist = character.fireResistance ?? 0; // Start with character base
  let totalColdResist = character.coldResistance ?? 0;
  let totalLightningResist = character.lightningResistance ?? 0;
  let totalVoidResist = character.voidResistance ?? 0;
  let totalFlatLifeRegen = 0; // New
  let totalPercentLifeRegen = 0; // New
  let totalThorns = 0; // New

  // --- Process ALL Equipment Slots --- 
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue; // Skip empty slots

    // Apply weapon-specific base stats if it's weapon1 (primary)
    // Update to ONLY take base damage from weapon1
    if (slotId === 'weapon1') {
      baseMinPhys = item.baseMinDamage ?? baseMinPhys; // Use weapon base if exists
      baseMaxPhys = item.baseMaxDamage ?? baseMaxPhys; // Use weapon base if exists
      // REMOVE Attack speed and Crit Chance base setting from here
      /* 
      if (MELEE_WEAPON_TYPES.has(item.itemType)) {
         effAttackSpeed = item.baseAttackSpeed ?? effAttackSpeed;
         effCritChance = item.baseCriticalStrikeChance ?? effCritChance;
      }
      */
    }

    // Process modifiers from the current item
    for (const mod of item.modifiers) {
      switch (mod.type) {
        // Flat Damages (Global)
        case "AddsFlatPhysicalDamage":
          flatMinPhysDamage += mod.valueMin ?? 0;
          flatMaxPhysDamage += mod.valueMax ?? 0;
          break;
        case "AddsFlatFireDamage": flatMinFire += mod.valueMin ?? 0; flatMaxFire += mod.valueMax ?? 0; break;
        case "AddsFlatColdDamage": flatMinCold += mod.valueMin ?? 0; flatMaxCold += mod.valueMax ?? 0; break;
        case "AddsFlatLightningDamage": flatMinLight += mod.valueMin ?? 0; flatMaxLight += mod.valueMax ?? 0; break;
        case "AddsFlatVoidDamage": flatMinVoid += mod.valueMin ?? 0; flatMaxVoid += mod.valueMax ?? 0; break;

        // Global Percent Mods
        case "IncreasedPhysicalDamage":
          increasePhysDamagePercent += mod.value;
          break;
        case "IncreasedElementalDamage":
          increaseEleDamagePercent += mod.value;
          break;
        case "IncreasedFireDamage":
          increaseFireDamagePercent += mod.value;
          break;
        case "IncreasedColdDamage":
          increaseColdDamagePercent += mod.value;
          break;
        case "IncreasedLightningDamage":
          increaseLightningDamagePercent += mod.value;
          break;
        case "IncreasedVoidDamage":
          increaseVoidDamagePercent += mod.value;
          break;
        case "IncreasedCriticalStrikeMultiplier":
          increaseCritMultiplierPercent += mod.value;
          break;
        case "LifeLeech":
          totalLifeLeech += mod.value;
          break;

        // Local Weapon Mods -> Make Global
        case "AttackSpeed":
          // Accumulate globally
          increaseAttackSpeedPercent += mod.value;
          // if (slotId === 'weapon1') increaseAttackSpeedPercent += mod.value;
          break;
        case "IncreasedLocalCriticalStrikeChance": // Corrected name
          // Accumulate LOCALLY only for weapon1
          if (slotId === 'weapon1') increaseLocalCritChancePercent += mod.value;
          break;
        case "IncreasedGlobalCriticalStrikeChance":
          increaseGlobalCritChancePercent += mod.value;
          break;

        // Attributes (Global)
        case "Strength":
          totalBonusStrength += mod.value;
          break;
        case "Dexterity":
          totalBonusDexterity += mod.value;
          break;
        case "Intelligence":
          totalBonusIntelligence += mod.value;
          break;

        // Defensive Mods (New Cases)
        case "MaxHealth":
            flatHealthFromMods += mod.value;
            break;
        case "FlatLocalArmor": // Assuming "Local" means it adds to item base + character base
            flatArmorFromMods += mod.value;
            break;
        case "IncreasedLocalArmor": // Assuming "Local" means it increases (item base + char base + flat mods)
            increaseArmorPercent += mod.value;
            break;
        case "ThornsDamage":
            totalThorns += mod.value;
            break;
        case "FireResistance":
            totalFireResist += mod.value;
            break;
        case "ColdResistance":
            totalColdResist += mod.value;
            break;
        case "LightningResistance":
            totalLightningResist += mod.value;
            break;
        case "VoidResistance":
            totalVoidResist += mod.value;
            break;
        case "FlatLifeRegen":
            totalFlatLifeRegen += mod.value;
            break;
        case "PercentLifeRegen":
            totalPercentLifeRegen += mod.value;
            break;
      }
    }
  }

  // --- Combine Base + Flat Mods --- 
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
  increasePhysDamagePercent += Math.floor((character.strength + totalBonusStrength) / 5);
  // Dex: +2% Evasion per 5 Dex, +1% Crit Chance per 5 Dex
  increaseEvasionPercent += Math.floor((character.dexterity + totalBonusDexterity) / 5) * 2;
  increaseLocalCritChancePercent += Math.floor((character.dexterity + totalBonusDexterity) / 5); // Dex affects local crit
  // Example: 1% Inc Attack Speed per 10 Dex (alternative/additional effect)
  // increaseAttackSpeedPercent += Math.floor((character.dexterity + totalBonusDexterity) / 10);
  // Int: +20 Barrier per 5 Int
  flatBarrier += Math.floor((character.intelligence + totalBonusIntelligence) / 5) * 20;

  // Local weapon mods applied first to phys damage and attack speed - REWORKED
  effMinPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effMaxPhysDamage *= (1 + increasePhysDamagePercent / 100);
  
  // Apply attack speed and crit chance increases globally to the base values
  let effAttackSpeed = baseAttackSpeed * (1 + increaseAttackSpeedPercent / 100);
  effCritChance *= (1 + increaseLocalCritChancePercent / 100); // Apply local first
  effCritChance *= (1 + increaseGlobalCritChancePercent / 100); // Then apply global

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

  // Combined total damage
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
  const finalMaxHealth = calculateFinalMaxHealth(
      character.maxHealth, 
      character.strength + totalBonusStrength, 
      flatHealthFromMods
  );

  // --- Final Effective Stats Object --- 
  return {
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
    maxHealth: finalMaxHealth, // Return calculated final max health
    totalArmor: Math.max(0, Math.round(baseArmor + currentItemBaseArmor + flatArmorFromMods * (1 + increaseArmorPercent / 100))), // Return calculated armor
    evasion: effEvasion,
    barrier: effBarrier,
    finalFireResistance: Math.min(75, Math.max(0, totalFireResist)),
    finalColdResistance: Math.min(75, Math.max(0, totalColdResist)),
    finalLightningResistance: Math.min(75, Math.max(0, totalLightningResist)),
    finalVoidResistance: Math.min(75, Math.max(0, totalVoidResist)),
    flatLifeRegen: totalFlatLifeRegen,
    percentLifeRegen: totalPercentLifeRegen,
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
    increaseAttackSpeedPercent: increaseAttackSpeedPercent,
    increaseEleDamagePercent: increaseEleDamagePercent,
    increaseFireDamagePercent: increaseFireDamagePercent,
    increaseColdDamagePercent: increaseColdDamagePercent,
    increaseLightningDamagePercent: increaseLightningDamagePercent,
    increaseVoidDamagePercent: increaseVoidDamagePercent,
    increaseGlobalCritChancePercent: increaseGlobalCritChancePercent,
  };
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
  let totalIncreasedPhysical = 0;
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

  item.modifiers.forEach((mod) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage":
        addedMinDamage += mod.valueMin ?? 0;
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
      case "IncreasedPhysicalDamage":
        totalIncreasedPhysical += mod.value;
        break;
      case "AttackSpeed":
        totalIncreasedAttackSpeed += mod.value;
        break;
      case "IncreasedLocalCriticalStrikeChance":
        totalIncreasedCritChance += mod.value;
        break;
    }
  });

  // Apply added flat damage
  minDamage += addedMinDamage;
  maxDamage += addedMaxDamage;

  // Ensure min damage is not greater than max damage
  if (minDamage > maxDamage) {
    minDamage = maxDamage;
  }

  // Apply increased physical damage %
  const physicalMultiplier = 1 + totalIncreasedPhysical / 100;
  minDamage = Math.round(minDamage * physicalMultiplier);
  maxDamage = Math.round(maxDamage * physicalMultiplier);

  // Apply increased attack speed %
  const attackSpeedMultiplier = 1 + totalIncreasedAttackSpeed / 100;
  attackSpeed = attackSpeed * attackSpeedMultiplier;

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