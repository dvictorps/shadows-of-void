import { ModifierType } from '../types/gameData';

export const MODIFIER_RANGES: { [key in ModifierType]?: { valueMin: number; valueMax: number }[] } = {
  // Attributes
  [ModifierType.Strength]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],
  [ModifierType.Dexterity]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],
  [ModifierType.Intelligence]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],

  // Health
  [ModifierType.MaxHealth]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 30 }, // T4
    { valueMin: 31, valueMax: 40 }, // T3
    { valueMin: 41, valueMax: 50 }, // T2
    { valueMin: 51, valueMax: 60 }, // T1
  ],
  [ModifierType.FlatLifeRegen]: [
    { valueMin: 0.5, valueMax: 1.0 }, // T6
    { valueMin: 1.1, valueMax: 2.0 }, // T5
    { valueMin: 2.1, valueMax: 3.0 }, // T4
    { valueMin: 3.1, valueMax: 4.0 }, // T3
    { valueMin: 4.1, valueMax: 5.0 }, // T2
    { valueMin: 5.1, valueMax: 6.0 }, // T1
  ],
  [ModifierType.PercentLifeRegen]: [
    { valueMin: 0.1, valueMax: 0.2 }, // T6
    { valueMin: 0.3, valueMax: 0.4 }, // T5
    { valueMin: 0.5, valueMax: 0.6 }, // T4
    { valueMin: 0.7, valueMax: 0.8 }, // T3
    { valueMin: 0.9, valueMax: 1.0 }, // T2
    { valueMin: 1.1, valueMax: 1.2 }, // T1
  ],

  // Resistances
  [ModifierType.FireResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.ColdResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.LightningResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.VoidResistance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],

  // Local Defenses
  [ModifierType.FlatLocalArmor]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 35 }, // T4
    { valueMin: 36, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 70 }, // T2
    { valueMin: 71, valueMax: 90 }, // T1
  ],
  [ModifierType.IncreasedLocalArmor]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],
  [ModifierType.FlatLocalEvasion]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 35 }, // T4
    { valueMin: 36, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 70 }, // T2
    { valueMin: 71, valueMax: 90 }, // T1
  ],
  [ModifierType.IncreasedLocalEvasion]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],
  [ModifierType.FlatLocalBarrier]: [
    { valueMin: 3, valueMax: 6 }, // T6
    { valueMin: 7, valueMax: 12 }, // T5
    { valueMin: 13, valueMax: 18 }, // T4
    { valueMin: 19, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 36 }, // T1
  ],
  [ModifierType.IncreasedLocalBarrier]: [
    { valueMin: 10, valueMax: 20 }, // T6
    { valueMin: 21, valueMax: 30 }, // T5
    { valueMin: 31, valueMax: 40 }, // T4
    { valueMin: 41, valueMax: 50 }, // T3
    { valueMin: 51, valueMax: 60 }, // T2
    { valueMin: 61, valueMax: 70 }, // T1
  ],

  // Physical Damage (Local & Global)
  [ModifierType.AddsFlatPhysicalDamage]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 3, valueMax: 4 }, // T5
    { valueMin: 5, valueMax: 7 }, // T4
    { valueMin: 8, valueMax: 10 }, // T3
    { valueMin: 11, valueMax: 13 }, // T2
    { valueMin: 14, valueMax: 16 }, // T1
  ],
  [ModifierType.IncreasedLocalPhysicalDamage]: [
    { valueMin: 10, valueMax: 19 }, // T6
    { valueMin: 20, valueMax: 29 }, // T5
    { valueMin: 30, valueMax: 39 }, // T4
    { valueMin: 40, valueMax: 49 }, // T3
    { valueMin: 50, valueMax: 59 }, // T2
    { valueMin: 60, valueMax: 70 }, // T1
  ],
  [ModifierType.IncreasedPhysicalDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Elemental Damage (Flat & Global)
  [ModifierType.AddsFlatFireDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatColdDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatLightningDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.AddsFlatVoidDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.IncreasedElementalDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedFireDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedColdDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedLightningDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedVoidDamage]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Attack Speed (Local & Global)
  [ModifierType.IncreasedLocalAttackSpeed]: [
    { valueMin: 3, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 8 }, // T5
    { valueMin: 9, valueMax: 11 }, // T4
    { valueMin: 12, valueMax: 14 }, // T3
    { valueMin: 15, valueMax: 17 }, // T2
    { valueMin: 18, valueMax: 20 }, // T1
  ],
  [ModifierType.IncreasedGlobalAttackSpeed]: [
    { valueMin: 2, valueMax: 4 }, // T6
    { valueMin: 5, valueMax: 7 }, // T5
    { valueMin: 8, valueMax: 10 }, // T4
    { valueMin: 11, valueMax: 13 }, // T3
    { valueMin: 14, valueMax: 16 }, // T2
    { valueMin: 17, valueMax: 19 }, // T1
  ],

  // Critical Strike (Local & Global)
  [ModifierType.IncreasedLocalCriticalStrikeChance]: [
    { valueMin: 10, valueMax: 19 }, // T6
    { valueMin: 20, valueMax: 29 }, // T5
    { valueMin: 30, valueMax: 39 }, // T4
    { valueMin: 40, valueMax: 49 }, // T3
    { valueMin: 50, valueMax: 59 }, // T2
    { valueMin: 60, valueMax: 70 }, // T1
  ],
  [ModifierType.IncreasedGlobalCriticalStrikeChance]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],
  [ModifierType.IncreasedCriticalStrikeMultiplier]: [
    { valueMin: 5, valueMax: 9 }, // T6
    { valueMin: 10, valueMax: 14 }, // T5
    { valueMin: 15, valueMax: 19 }, // T4
    { valueMin: 20, valueMax: 24 }, // T3
    { valueMin: 25, valueMax: 29 }, // T2
    { valueMin: 30, valueMax: 35 }, // T1
  ],

  // Movement Speed
  [ModifierType.IncreasedMovementSpeed]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],

  // Other Utility
  [ModifierType.IncreasedBlockChance]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 15 }, // T5
    { valueMin: 16, valueMax: 20 }, // T4
    { valueMin: 21, valueMax: 25 }, // T3
    { valueMin: 26, valueMax: 30 }, // T2
    { valueMin: 31, valueMax: 35 }, // T1
  ],
  [ModifierType.LifeLeech]: [
    { valueMin: 0.1, valueMax: 0.5 }, // T6
    { valueMin: 0.6, valueMax: 1.0 }, // T5
    { valueMin: 1.1, valueMax: 1.5 }, // T4
    { valueMin: 1.6, valueMax: 2.0 }, // T3
    { valueMin: 2.1, valueMax: 2.5 }, // T2
    { valueMin: 2.6, valueMax: 3.0 }, // T1
  ],
  [ModifierType.ThornsDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.ReducedPhysDamageTaken]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 3, valueMax: 4 }, // T5
    { valueMin: 5, valueMax: 6 }, // T4
    { valueMin: 7, valueMax: 8 }, // T3
    { valueMin: 9, valueMax: 10 }, // T2
    { valueMin: 11, valueMax: 12 }, // T1
  ],
  [ModifierType.PhysDamageTakenAsElement]: [ // Assuming 'Element' refers to a specific type like Fire, Cold, etc.
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 18 }, // T1
  ],
  [ModifierType.MaxMana]: [
    { valueMin: 5, valueMax: 10 }, // T6
    { valueMin: 11, valueMax: 20 }, // T5
    { valueMin: 21, valueMax: 30 }, // T4
    { valueMin: 31, valueMax: 40 }, // T3
    { valueMin: 41, valueMax: 50 }, // T2
    { valueMin: 51, valueMax: 60 }, // T1
  ],
  [ModifierType.FlatManaRegen]: [
    { valueMin: 0.2, valueMax: 0.5 }, // T6
    { valueMin: 0.6, valueMax: 1.0 }, // T5
    { valueMin: 1.1, valueMax: 1.5 }, // T4
    { valueMin: 1.6, valueMax: 2.0 }, // T3
    { valueMin: 2.1, valueMax: 2.5 }, // T2
    { valueMin: 2.6, valueMax: 3.0 }, // T1
  ],
  [ModifierType.PercentManaRegen]: [
    { valueMin: 0.5, valueMax: 1.5 }, // T6
    { valueMin: 1.6, valueMax: 2.5 }, // T5
    { valueMin: 2.6, valueMax: 4.0 }, // T4
    { valueMin: 4.1, valueMax: 6.0 }, // T3
    { valueMin: 6.1, valueMax: 8.0 }, // T2
    { valueMin: 8.1, valueMax: 10.0 }, // T1 (LIMITADO A 10%)
  ],
  [ModifierType.ManaShield]: [
    { valueMin: 1, valueMax: 2 }, // T6
    { valueMin: 2.1, valueMax: 4 }, // T5
    { valueMin: 4.1, valueMax: 6 }, // T4
    { valueMin: 6.1, valueMax: 7 }, // T3
    { valueMin: 7.1, valueMax: 9 }, // T2
    { valueMin: 9.1, valueMax: 10 }, // T1 (LIMITADO A 10%)
  ],
  [ModifierType.ReducedLifeLeechRecovery]: [
    { valueMin: 1, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 10 }, // T5
    { valueMin: 11, valueMax: 15 }, // T4
    { valueMin: 16, valueMax: 20 }, // T3
    { valueMin: 21, valueMax: 25 }, // T2
    { valueMin: 26, valueMax: 30 }, // T1
  ],
  [ModifierType.AddsFlatSpellFireDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 20 }, // T1
  ],
  [ModifierType.AddsFlatSpellColdDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 20 }, // T1
  ],
  [ModifierType.AddsFlatSpellLightningDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 20 }, // T1
  ],
  [ModifierType.AddsFlatSpellVoidDamage]: [
    { valueMin: 1, valueMax: 3 }, // T6
    { valueMin: 4, valueMax: 6 }, // T5
    { valueMin: 7, valueMax: 9 }, // T4
    { valueMin: 10, valueMax: 12 }, // T3
    { valueMin: 13, valueMax: 15 }, // T2
    { valueMin: 16, valueMax: 20 }, // T1
  ],
  [ModifierType.IncreasedSpellDamage]: [
    { valueMin: 10, valueMax: 14 }, // T6
    { valueMin: 15, valueMax: 19 }, // T5
    { valueMin: 20, valueMax: 24 }, // T4
    { valueMin: 25, valueMax: 29 }, // T3
    { valueMin: 30, valueMax: 35 }, // T2
    { valueMin: 36, valueMax: 40 }, // T1
  ],
  [ModifierType.IncreasedCastSpeed]: [
    { valueMin: 3, valueMax: 5 }, // T6
    { valueMin: 6, valueMax: 8 }, // T5
    { valueMin: 9, valueMax: 11 }, // T4
    { valueMin: 12, valueMax: 14 }, // T3
    { valueMin: 15, valueMax: 17 }, // T2
    { valueMin: 18, valueMax: 20 }, // T1
  ],
}; 