import React from "react";
import InventoryDisplay from "@/components/InventoryDisplay";
import CharacterStats from "@/components/CharacterStats";
import { OverallGameData } from "@/types/gameData";

interface RightSidebarProps {
  onOpenInventory: () => void;
  currencies: OverallGameData["currencies"];
  xpToNextLevel: number;
  totalStrength: number;
  totalDexterity: number;
  totalIntelligence: number;
  onUseTeleportStone: () => void;
  windCrystals: number;
}

export default function RightSidebar({
  onOpenInventory,
  currencies,
  xpToNextLevel,
  totalStrength,
  totalDexterity,
  totalIntelligence,
  onUseTeleportStone,
  windCrystals,
}: RightSidebarProps) {
  return (
    <div className="w-full md:w-1/3 flex flex-col">
      <div className="h-full flex flex-col">
        <InventoryDisplay
          onOpenInventory={onOpenInventory}
          currencies={currencies}
        />
        <div className="mt-2">
          <CharacterStats
            xpToNextLevel={xpToNextLevel}
            totalStrength={totalStrength}
            totalDexterity={totalDexterity}
            totalIntelligence={totalIntelligence}
            onUseTeleportStone={onUseTeleportStone}
            windCrystals={windCrystals}
          />
        </div>
      </div>
    </div>
  );
} 