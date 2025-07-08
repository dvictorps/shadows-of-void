import React from "react";

interface AreaHeaderProps {
  isTown: boolean;
  areaName: string;
  areaLevel?: number;
  enemiesKilledCount: number;
  killsToComplete: number;
}

const AreaHeader: React.FC<AreaHeaderProps> = ({
  isTown,
  areaName,
  areaLevel,
  enemiesKilledCount,
  killsToComplete,
}) => {
  if (isTown) {
    return (
      <h2 className="text-xl font-semibold mb-1 text-white pt-8">
        {areaName}
      </h2>
    );
  }

  // Avoid division by zero
  const progressPercentage = killsToComplete > 0 ? (enemiesKilledCount / killsToComplete) * 100 : 0;

  return (
    <>
      <h2 className="text-xl font-semibold mb-1 text-white pt-8">
        {`${areaName} (Nv. ${areaLevel})`}
      </h2>
      <div className="mb-3 max-w-xs mx-auto">
        <p className="text-xs text-center text-gray-400 mb-1">
          Inimigos: {enemiesKilledCount} / {killsToComplete}
        </p>
        <div className="w-full bg-gray-700 rounded h-2.5 border border-gray-500 overflow-hidden">
          <div
            className="bg-purple-600 h-full transition-width duration-300 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </>
  );
};

export default AreaHeader; 