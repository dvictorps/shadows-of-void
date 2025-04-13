import { Character, EquippableItem /*, Modifier */ } from "../types/gameData"; // Modifier type used implicitly

// Define which item types are considered melee for stat overrides
const MELEE_WEAPON_TYPES = new Set(["Sword", "Axe", "Mace"]);

export interface EffectiveStats {
  minDamage: number; // Total combined phys + elemental
  maxDamage: number; // Total combined phys + elemental
  minPhysDamage: number; // Physical portion
  maxPhysDamage: number; // Physical portion
  minEleDamage: number; // Elemental portion (sum of all)
  maxEleDamage: number; // Elemental portion (sum of all)
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
  dps: number; // DPS considering combined damage
  physDps: number; // DPS from physical only
  eleDps: number; // DPS from elemental only
  lifeLeechPercent: number;
  evasion: number;
  barrier: number;
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

// Calculates final max health based on base health and total strength
export function calculateFinalMaxHealth(baseMaxHealth: number, totalStrength: number): number {
  const strengthBonusPercent = Math.floor(totalStrength / 5) * 2;
  const finalHealth = Math.round(baseMaxHealth * (1 + strengthBonusPercent / 100));
  return Math.max(1, finalHealth); // Ensure minimum 1 health
}

export function calculateEffectiveStats(character: Character): EffectiveStats {
  // Base Stats
  let baseMinPhys = character.minBaseDamage ?? 0;
  let baseMaxPhys = character.maxBaseDamage ?? 0;
  let effAttackSpeed = character.attackSpeed ?? 1;
  let effCritChance = character.criticalStrikeChance ?? 5;
  let effCritMultiplier = character.criticalStrikeMultiplier ?? 150;
  const baseEvasion = character.evasion ?? 0; // Changed to const
  const baseBarrier = character.barrier ?? 0; // Changed to const
  let totalLifeLeech = 0;

  // Elemental damage starts at 0 base
  const baseMinEle = 0; // Use const
  const baseMaxEle = 0; // Use const

  // Modifiers accumulated from ALL gear
  let increasePhysDamagePercent = 0;
  let increaseEleDamagePercent = 0; // NEW: Global Elemental Damage %
  let increaseAttackSpeedPercent = 0;
  let increaseCritChancePercent = 0;
  let increaseCritMultiplierPercent = 0; // NEW: Global Crit Multi %
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

  // --- Process ALL Equipment Slots --- 
  for (const slotId in character.equipment) {
    const item = character.equipment[slotId as keyof typeof character.equipment];
    if (!item) continue; // Skip empty slots

    // Apply weapon-specific base stats if it's weapon1 (primary)
    // (Assuming weapon2 doesn't contribute base damage/speed/crit directly for now)
    if (slotId === 'weapon1') {
      baseMinPhys = item.baseMinDamage ?? 0;
      baseMaxPhys = item.baseMaxDamage ?? 0;
      if (MELEE_WEAPON_TYPES.has(item.itemType)) {
         effAttackSpeed = item.baseAttackSpeed ?? effAttackSpeed;
         effCritChance = item.baseCriticalStrikeChance ?? effCritChance;
      }
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
        case "IncreasedCriticalStrikeMultiplier":
          increaseCritMultiplierPercent += mod.value;
          break;
        case "LifeLeech":
          totalLifeLeech += mod.value;
          break;

        // Local Weapon Mods (Only Weapon 1)
        case "AttackSpeed":
          if (slotId === 'weapon1') increaseAttackSpeedPercent += mod.value;
          break;
        case "IncreasedCriticalStrikeChance":
          if (slotId === 'weapon1') increaseCritChancePercent += mod.value;
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
  increaseCritChancePercent += Math.floor((character.dexterity + totalBonusDexterity) / 5);
  // Example: 1% Inc Attack Speed per 10 Dex (alternative/additional effect)
  // increaseAttackSpeedPercent += Math.floor((character.dexterity + totalBonusDexterity) / 10);
  // Int: +20 Barrier per 5 Int
  flatBarrier += Math.floor((character.intelligence + totalBonusIntelligence) / 5) * 20;

  // Local weapon mods applied first to phys damage and attack speed
  effMinPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effMaxPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effAttackSpeed *= (1 + increaseAttackSpeedPercent / 100);
  effCritChance *= (1 + increaseCritChancePercent / 100);

  // Global mods affecting elemental and crit multi
  effMinEleDamage *= (1 + increaseEleDamagePercent / 100);
  effMaxEleDamage *= (1 + increaseEleDamagePercent / 100);
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
    evasion: effEvasion,
    barrier: effBarrier,
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
      case "IncreasedCriticalStrikeChance":
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