import React from "react";
import { FaHeart, FaMagic } from "react-icons/fa";

interface ConsumablesBarProps {
  healthPotions: number;
  teleportStones: number;
  currentHealth: number;
  maxHealth: number;
  isTown: boolean;
  onUsePotion: () => void;
  onUseTeleportStone: () => void;
}

const ConsumablesBar: React.FC<ConsumablesBarProps> = ({
  healthPotions,
  teleportStones,
  currentHealth,
  maxHealth,
  isTown,
  onUsePotion,
  onUseTeleportStone,
}) => {
  const potionDisabled = healthPotions <= 0 || currentHealth >= maxHealth;
  const teleportDisabled = teleportStones <= 0 || isTown;

  return (
    <div className="flex justify-center h-20 items-end gap-1">
      <button
        onClick={onUsePotion}
        disabled={potionDisabled}
        className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-red-800 text-white rounded border border-white transition-opacity ${
          potionDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
        }`}
        title={`Usar Poção de Vida (${healthPotions} restantes)`}
      >
        <FaHeart /> ({healthPotions})
      </button>

      <button
        onClick={onUseTeleportStone}
        disabled={teleportDisabled}
        className={`flex items-center justify-center gap-1 px-3 py-1 w-16 h-10 bg-blue-800 text-white rounded border border-white transition-opacity ${
          teleportDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700 orb-glow-blue"
        }`}
        title={`Usar Pedra de Teleporte (${teleportStones} restantes)`}
      >
        <FaMagic /> ({teleportStones})
      </button>
    </div>
  );
};

export default ConsumablesBar; 