import React from "react";

interface XPBarProps {
  currentXP: number;
  xpToNextLevel: number;
  level: number;
}

const XPBar: React.FC<XPBarProps> = ({ currentXP, xpToNextLevel, level }) => {
  const percentage = xpToNextLevel > 0 ? (currentXP / xpToNextLevel) * 100 : 0;

  return (
    <div className="flex-1 flex flex-col items-center h-20 justify-end mb-1 mx-2">
      <span className="text-xs text-gray-300 mb-1">
        XP: {currentXP} / {xpToNextLevel} (Nível {level})
      </span>
      <div className="w-full bg-gray-700 rounded h-3 border border-gray-500 overflow-hidden">
        <div
          className="bg-yellow-400 h-full transition-width duration-300 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default XPBar; 