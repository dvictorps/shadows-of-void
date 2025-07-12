import { EquippableItem } from "../../types/gameData";

// Calcula armadura final de um item
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

// Calcula evasão final de um item
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
  return Math.round(totalEvasion);
}

// Calcula barreira final de um item
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
  return Math.round(totalBarrier);
} 