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
}

export function calculateEffectiveStats(character: Character): EffectiveStats {
  // Base Stats
  let baseMinPhys = character.minBaseDamage ?? 0;
  let baseMaxPhys = character.maxBaseDamage ?? 0;
  let effAttackSpeed = character.attackSpeed ?? 1;
  let effCritChance = character.criticalStrikeChance ?? 5;
  let effCritMultiplier = character.criticalStrikeMultiplier ?? 150;
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

  // --- Process Weapon --- (assuming weapon1 for now)
  const weapon = character.equipment?.weapon1 as EquippableItem | null;
  if (weapon) {
    // Apply weapon base stats
    baseMinPhys += weapon.baseMinDamage ?? 0;
    baseMaxPhys += weapon.baseMaxDamage ?? 0;
    // Apply overrides for melee
    if (MELEE_WEAPON_TYPES.has(weapon.itemType)) {
      effAttackSpeed = weapon.baseAttackSpeed ?? effAttackSpeed;
      effCritChance = weapon.baseCriticalStrikeChance ?? effCritChance;
    }
    // Apply weapon LOCAL modifiers
    for (const mod of weapon.modifiers) {
      switch (mod.type) {
        case "AddsFlatPhysicalDamage":
          flatMinPhysDamage += mod.valueMin ?? 0;
          flatMaxPhysDamage += mod.valueMax ?? 0;
          break;
        case "IncreasedPhysicalDamage":
          increasePhysDamagePercent += mod.value;
          break;
        case "AttackSpeed":
          increaseAttackSpeedPercent += mod.value;
          break;
        case "IncreasedCriticalStrikeChance":
          increaseCritChancePercent += mod.value;
          break;
        // Add flat elemental from weapon
        case "AddsFlatFireDamage": flatMinFire += mod.valueMin ?? 0; flatMaxFire += mod.valueMax ?? 0; break;
        case "AddsFlatColdDamage": flatMinCold += mod.valueMin ?? 0; flatMaxCold += mod.valueMax ?? 0; break;
        case "AddsFlatLightningDamage": flatMinLight += mod.valueMin ?? 0; flatMaxLight += mod.valueMax ?? 0; break;
        case "AddsFlatVoidDamage": flatMinVoid += mod.valueMin ?? 0; flatMaxVoid += mod.valueMax ?? 0; break;
        // Global mods also accumulate here if they appear on weapon
        case "IncreasedCriticalStrikeMultiplier": increaseCritMultiplierPercent += mod.value; break;
        case "IncreasedElementalDamage": increaseEleDamagePercent += mod.value; break;
        case "LifeLeech": totalLifeLeech += mod.value; break;
        // Ignore attributes for now, assume they affect base stats elsewhere
      }
    }
  }

  // --- TODO: Process Other Gear Slots (Armor, Rings, etc.) ---
  // Loop through other character.equipment slots
  // Accumulate GLOBAL modifiers (Crit Multi, Ele Dmg, Leech, Attributes)
  // Attributes would ideally modify base character stats *before* this function

  // --- Combine Base + Flat Mods --- 
  let effMinPhysDamage = baseMinPhys + flatMinPhysDamage;
  let effMaxPhysDamage = baseMaxPhys + flatMaxPhysDamage;
  let effMinEleDamage = baseMinEle + flatMinFire + flatMinCold + flatMinLight + flatMinVoid;
  let effMaxEleDamage = baseMaxEle + flatMaxFire + flatMaxCold + flatMaxLight + flatMaxVoid;

  // --- Apply Percentage Increases --- 
  // Local weapon mods applied first to phys damage and attack speed
  effMinPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effMaxPhysDamage *= (1 + increasePhysDamagePercent / 100);
  effAttackSpeed *= (1 + increaseAttackSpeedPercent / 100);
  effCritChance *= (1 + increaseCritChancePercent / 100);

  // Global mods affecting elemental and crit multi
  effMinEleDamage *= (1 + increaseEleDamagePercent / 100);
  effMaxEleDamage *= (1 + increaseEleDamagePercent / 100);
  effCritMultiplier += increaseCritMultiplierPercent; // Crit multi adds flat percentage points

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
  };
} 