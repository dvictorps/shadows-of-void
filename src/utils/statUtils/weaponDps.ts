// Helper: Calcula DPS e breakdown de dano físico/elemental
export function getWeaponDps(params: {
  minPhys: number;
  maxPhys: number;
  minEle: number;
  maxEle: number;
  attackSpeed: number;
  critChance: number;
  critMultiplier: number;
}): {
  dps: number;
  physDps: number;
  eleDps: number;
} {
  const { minPhys, maxPhys, minEle, maxEle, attackSpeed, critChance, critMultiplier } = params;
  const avgPhys = (minPhys + maxPhys) / 2;
  const avgEle = (minEle + maxEle) / 2;
  const avgTotal = avgPhys + avgEle;
  const critC_dec = Math.min(100, critChance) / 100;
  const critM_dec = critMultiplier / 100;
  const dps = avgTotal * attackSpeed * (1 + critC_dec * (critM_dec - 1));
  const physDps = avgPhys * attackSpeed * (1 + critC_dec * (critM_dec - 1));
  const eleDps = avgEle * attackSpeed * (1 + critC_dec * (critM_dec - 1));
  return { dps, physDps, eleDps };
} 