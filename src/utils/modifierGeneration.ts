// Lógica de rolagem de modificadores e bias
import { ModifierType } from '../types/gameData';
import { MODIFIER_RANGES } from '../constants/modifierRanges';

export function getBiasedRandomInt(min: number, max: number, biasFactor: number): number {
  const clampedBias = Math.max(0, Math.min(1, biasFactor));
  const random = Math.random();
  const biasedRandom = Math.pow(random, 1 - clampedBias * 0.8);
  const value = min + Math.floor(biasedRandom * (max - min + 1));
  return Math.max(min, Math.min(max, value));
}

export function getAbsoluteMaxValue(modType: ModifierType): number | null {
  const ranges = MODIFIER_RANGES[modType];
  if (!ranges || ranges.length === 0) return null;
  return ranges[ranges.length - 1].valueMax;
}

// Função para rolar o valor de um modificador (pode ser adaptada conforme uso)
// export function rollModifierValue(...) { ... } 