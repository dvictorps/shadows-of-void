import React from "react";

interface PlayerOrbsProps {
  currentHealth: number;
  maxHealth: number;
  currentBarrier: number | null | undefined;
  totalBarrier: number | null | undefined;
  currentMana?: number | null;
  maxMana?: number | null;
  isMage: boolean;
}

// Utility calc (early return style)
const calcPercentage = (current: number | null | undefined, max: number | null | undefined) => {
  if (!max || max <= 0 || !current || current <= 0) return 0;
  const pct = (current / max) * 100;
  return isNaN(pct) ? 0 : Math.max(0, Math.min(100, pct));
};

const PlayerOrbs: React.FC<PlayerOrbsProps> = ({
  currentHealth,
  maxHealth,
  currentBarrier,
  totalBarrier,
  currentMana,
  maxMana,
  isMage,
}) => {
  const healthPct = calcPercentage(currentHealth, maxHealth);
  const barrierPct = calcPercentage(currentBarrier, totalBarrier);
  const manaPct = calcPercentage(currentMana, maxMana);

  return (
    <div className="flex items-end gap-2">
      {/* Health & Barrier */}
      <div className="relative w-20 h-20 flex flex-col items-center">
        <div className="h-8 flex flex-col justify-end items-center">
          <p className="text-xs text-blue-300 font-semibold mb-0">
            {Math.floor(currentBarrier ?? 0)}/{Math.floor(totalBarrier ?? 0)}
          </p>
          <p className="text-xs text-white font-semibold mb-0.5">
            {Math.floor(currentHealth)}/{Math.floor(maxHealth)}
          </p>
        </div>
        <svg className="w-16 h-16 overflow-visible orb-glow-red" viewBox="0 0 100 100">
          <defs>
            <clipPath id="healthClipPathArea">
              <rect x="0" y={100 - healthPct} width="100" height={healthPct} />
            </clipPath>
            <clipPath id="barrierClipPathArea">
              <rect x="0" y={100 - barrierPct} width="100" height={barrierPct} />
            </clipPath>
          </defs>
          <circle cx="50" cy="50" r="48" fill="#1f2937" stroke="white" strokeWidth="2" />
          <circle cx="50" cy="50" r="48" fill="#60a5fa" fillOpacity="0.6" clipPath="url(#barrierClipPathArea)" />
          <circle cx="50" cy="50" r="48" fill="#991b1b" clipPath="url(#healthClipPathArea)" />
          <circle cx="50" cy="50" r="48" fill="#60a5fa" fillOpacity="0.6" clipPath="url(#barrierClipPathArea)" />
        </svg>
      </div>

      {isMage && (
        <div className="relative w-20 h-20 flex flex-col items-center">
          <div className="h-8 flex flex-col justify-end items-center">
            <p className="text-xs">&nbsp;</p>
            <p className="text-xs text-white font-semibold mb-0.5">
              {Math.floor(currentMana ?? 0)}/{Math.floor(maxMana ?? 0)}
            </p>
          </div>
          <svg className="w-16 h-16 overflow-visible orb-glow-blue" viewBox="0 0 100 100">
            <defs>
              <clipPath id="manaClipPathArea">
                <rect x="0" y={100 - manaPct} width="100" height={manaPct} />
              </clipPath>
            </defs>
            <circle cx="50" cy="50" r="48" fill="#1f2937" stroke="white" strokeWidth="2" />
            <circle cx="50" cy="50" r="48" fill="#3b82f6" clipPath="url(#manaClipPathArea)" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default PlayerOrbs; 