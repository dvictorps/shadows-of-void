export const calculatePercentage = (
  current: number | null | undefined,
  max: number | null | undefined
): number => {
  const curr = current ?? 0;
  const m = max ?? 0;
  if (m <= 0 || curr <= 0) return 0;
  const pct = Math.max(0, Math.min(100, (curr / m) * 100));
  return isNaN(pct) ? 0 : pct;
}; 