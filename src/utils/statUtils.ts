



export interface EffectiveStats {
  minDamage: number;
  maxDamage: number;
  minPhysDamage: number;
  maxPhysDamage: number;
  minEleDamage: number;
  maxEleDamage: number;
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
  dps: number;
  physDps: number;
  eleDps: number;
  lifeLeechPercent: number;
  maxHealth: number;
  totalArmor: number;
  totalEvasion: number;
  totalBarrier: number;
  totalBlockChance: number;
  finalFireResistance: number;
  finalColdResistance: number;
  finalLightningResistance: number;
  finalVoidResistance: number;
  finalLifeRegenPerSecond: number;
  finalManaRegenPerSecond: number;
  flatManaRegen: number;
  percentManaRegen: number;
  thornsDamage: number;
  estimatedPhysReductionPercent: number;
  totalPhysTakenAsElementPercent: number;
  totalReducedPhysDamageTakenPercent: number;
  weaponBaseMinPhys: number;
  weaponBaseMaxPhys: number;
  weaponBaseMinEle: number;
  weaponBaseMaxEle: number;
  weaponBaseAttackSpeed: number;
  weaponBaseCritChance: number;
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
  weapon2CalcMinPhys?: number;
  weapon2CalcMaxPhys?: number;
  weapon2CalcMinEle?: number;
  weapon2CalcMaxEle?: number;
  weapon2CalcAttackSpeed?: number;
  weapon2CalcCritChance?: number;
}

// O arquivo agora serve apenas como ponto de tipos, constantes utilitárias e helpers globais. 