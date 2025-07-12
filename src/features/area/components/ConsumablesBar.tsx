import React from "react";
// Remover ícones, vamos usar sprites

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
      <div className="relative group">
        <button
          onClick={onUsePotion}
          disabled={potionDisabled}
          className={`flex items-center justify-center px-1 py-1 rounded border border-white transition-opacity bg-black focus:outline-none focus:ring-2 focus:ring-red-400 ${
            potionDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]"
          }`}
          style={{ minWidth: 0, minHeight: 0 }}
          title={`Usar Poção de Vida (${healthPotions} restantes)`}
        >
          <span className="flex items-center gap-1">
            <span className="inline-block w-16 h-16 rounded bg-black">
              <img
                src="/sprites/ui/heal-potion.png"
                alt="Poção de Vida"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </span>
            <span className="text-white font-bold">{healthPotions}</span>
          </span>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
          Poção de Vida
        </span>
      </div>

      <div className="relative group">
        <button
          onClick={onUseTeleportStone}
          disabled={teleportDisabled}
          className={`flex items-center justify-center px-1 py-1 rounded border border-white transition-opacity bg-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
            teleportDisabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_8px_2px_rgba(59,130,246,0.7)]"
          }`}
          style={{ minWidth: 0, minHeight: 0 }}
          title={`Usar Pedra de Teleporte (${teleportStones} restantes)`}
        >
          <span className="flex items-center gap-1">
            <span className="inline-block w-16 h-16 rounded bg-black">
              <img
                src="/sprites/ui/teleport-stone.png"
                alt="Pedra de Teleporte"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </span>
            <span className="text-white font-bold">{teleportStones}</span>
          </span>
        </button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 border border-white whitespace-nowrap z-10 shadow-lg">
          Pedra de Teleporte
        </span>
      </div>
    </div>
  );
};

export default ConsumablesBar; 