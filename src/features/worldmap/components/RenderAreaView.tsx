"use client";

import React from "react";
import AreaView, { AreaViewHandles } from "@/features/area/components/AreaView";
import { Character, MapLocation, EnemyInstance } from "@/types/gameData";
import { EffectiveStats } from "@/utils/statUtils";

export interface RenderAreaViewProps {
  areaViewRef: React.RefObject<AreaViewHandles | null>;
  areaViewKey: string;
  character: Character;
  area: MapLocation | null;
  effectiveStats: EffectiveStats | null;
  onReturnToMap: (areaWasCompleted: boolean) => void;
  xpToNextLevel: number;
  pendingDropCount: number;
  onOpenDropModalForViewing: () => void;
  onOpenVendor: () => void;
  onOpenStash: () => void;
  onUseTeleportStone: () => void;
  windCrystals: number;
  currentEnemy: EnemyInstance | null;
  enemiesKilledCount: number;
  killsToComplete: number;
}

const RenderAreaView = React.forwardRef<AreaViewHandles, RenderAreaViewProps>(
  (
    {
      areaViewKey,
      character,
      area,
      effectiveStats,
      onReturnToMap,
      xpToNextLevel,
      pendingDropCount,
      onOpenDropModalForViewing,
      onOpenVendor,
      onOpenStash,
      onUseTeleportStone,
      windCrystals,
      currentEnemy,
      enemiesKilledCount,
      killsToComplete,
    },
    ref
  ) => {
    return (
      <AreaView
        ref={ref}
        key={areaViewKey}
        character={character}
        area={area}
        effectiveStats={effectiveStats}
        onReturnToMap={onReturnToMap}
        xpToNextLevel={xpToNextLevel}
        pendingDropCount={pendingDropCount}
        onOpenDropModalForViewing={onOpenDropModalForViewing}
        onOpenVendor={onOpenVendor}
        onOpenStash={onOpenStash}
        onUseTeleportStone={onUseTeleportStone}
        windCrystals={windCrystals}
        currentEnemy={currentEnemy}
        enemiesKilledCount={enemiesKilledCount}
        killsToComplete={killsToComplete}
      />
    );
  }
);

RenderAreaView.displayName = "RenderAreaView";

export default RenderAreaView; 