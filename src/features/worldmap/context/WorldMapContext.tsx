import React, { createContext, useContext, useState, useRef } from "react";
import { MapLocation } from "@/types/gameData";
import { EffectiveStats } from "@/utils/statUtils";
import useAreaCombatState from "@/hooks/useAreaCombatState";

interface WorldMapState {
  currentArea: MapLocation | null;
  setCurrentArea: React.Dispatch<React.SetStateAction<MapLocation | null>>;
  currentView: "worldMap" | "areaView";
  setCurrentView: React.Dispatch<React.SetStateAction<"worldMap" | "areaView">>;
  isTraveling: boolean;
  setIsTraveling: React.Dispatch<React.SetStateAction<boolean>>;
  travelProgress: number;
  setTravelProgress: React.Dispatch<React.SetStateAction<number>>;
  travelTargetAreaId: string | null;
  setTravelTargetAreaId: React.Dispatch<React.SetStateAction<string | null>>;
  effectiveStatsRef: React.MutableRefObject<EffectiveStats | null>;
  // Combat slice
  combat: ReturnType<typeof useAreaCombatState>;
}

const WorldMapContext = createContext<WorldMapState | undefined>(undefined);

export const WorldMapProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentArea, setCurrentArea] = useState<MapLocation | null>(null);
  const [currentView, setCurrentView] = useState<"worldMap" | "areaView">(
    "worldMap"
  );
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelProgress, setTravelProgress] = useState(0);
  const [travelTargetAreaId, setTravelTargetAreaId] = useState<string | null>(
    null
  );
  const effectiveStatsRef = useRef<EffectiveStats | null>(null);
  const combat = useAreaCombatState();

  return (
    <WorldMapContext.Provider
      value={{
        currentArea,
        setCurrentArea,
        currentView,
        setCurrentView,
        isTraveling,
        setIsTraveling,
        travelProgress,
        setTravelProgress,
        travelTargetAreaId,
        setTravelTargetAreaId,
        effectiveStatsRef,
        combat,
      }}
    >
      {children}
    </WorldMapContext.Provider>
  );
};

export const useWorldMapContext = () => {
  const ctx = useContext(WorldMapContext);
  if (!ctx) throw new Error("useWorldMapContext must be used within provider");
  return ctx;
}; 