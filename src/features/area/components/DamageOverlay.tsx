import React from "react";
import { EnemyDamageType } from "@/types/gameData";

// --- Types replicated from AreaView for prop typing ---
export interface EnemyDamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  type: EnemyDamageType;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface LastPlayerDamage {
  value: number;
  timestamp: number;
  id: string;
  isCritical: boolean;
}

export interface LastLifeLeech {
  value: number;
  timestamp: number;
  id: string;
}

export interface LastEnemyThornsDamage {
  value: number;
  timestamp: number;
  id: string;
}

interface DamageOverlayProps {
  playerDamageTakenNumbers: EnemyDamageNumber[];
  floatingMissTexts: FloatingText[];
  lastPlayerDamage: LastPlayerDamage | null;
  lastLifeLeech: LastLifeLeech | null;
  lastEnemyThornsDamage: LastEnemyThornsDamage | null;
}

const DamageOverlay: React.FC<DamageOverlayProps> = ({
  playerDamageTakenNumbers,
  floatingMissTexts,
  lastPlayerDamage,
  lastLifeLeech,
  lastEnemyThornsDamage,
}) => {
  // Helper for damage color
  const getTextColor = (type: EnemyDamageType) => {
    switch (type) {
      case "cold":
        return "text-blue-400";
      case "fire":
        return "text-orange-500";
      case "lightning":
        return "text-yellow-400";
      case "void":
        return "text-purple-400";
      default:
        return "text-white"; // physical
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {playerDamageTakenNumbers.map((dn) => (
        <span
          key={dn.id}
          className={`absolute text-xl font-bold animate-diablo-damage-float ${getTextColor(
            dn.type
          )} text-stroke-black`}
          style={{
            left: `${dn.x}%`,
            top: `${dn.y}%`,
            transform: "translateX(-50%)",
          }}
        >
          {dn.value}
        </span>
      ))}

      {floatingMissTexts.map((mt) => (
        <span
          key={mt.id}
          className="absolute text-xl font-bold animate-float-up-fade text-gray-400"
          style={{
            left: `${mt.x}%`,
            top: `${mt.y}%`,
            transform: "translateX(-50%)",
          }}
        >
          {mt.text}
        </span>
      ))}

      {lastPlayerDamage && (
        <div
          key={lastPlayerDamage.id}
          className={`absolute text-center pointer-events-none animate-float-up-fade font-bold ${
            lastPlayerDamage.isCritical
              ? "text-red-500 text-3xl"
              : "text-white text-2xl text-stroke-black"
          }`}
          style={{
            left: "50%",
            top: "15%",
            transform: "translateX(-50%)",
          }}
        >
          {lastPlayerDamage.value}
          {lastPlayerDamage.isCritical && " CRITICO!!!"}
        </div>
      )}

      {lastLifeLeech && (
        <div
          key={lastLifeLeech.id}
          className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-green-500 text-xl"
          style={{
            left: "55%",
            top: "25%",
            transform: "translateX(-50%)",
          }}
        >
          +{lastLifeLeech.value}
        </div>
      )}

      {lastEnemyThornsDamage && (
        <div
          key={lastEnemyThornsDamage.id}
          className="absolute text-center pointer-events-none animate-float-up-fade font-bold text-purple-400 text-xl"
          style={{
            left: "45%",
            top: "20%",
            transform: "translateX(-50%)",
          }}
        >
          {lastEnemyThornsDamage.value} (Thorns)
        </div>
      )}
    </div>
  );
};

export default DamageOverlay; 