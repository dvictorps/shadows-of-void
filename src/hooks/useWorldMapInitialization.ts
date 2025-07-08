import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Character,
  MapLocation,
  OverallGameData,
  act1Locations,
} from "@/types/gameData";
import {
  loadCharacters,
  loadOverallData,
  saveOverallData,
} from "@/utils/localStorage";
import { useCharacterStore } from "@/stores/characterStore";
import { calculateEffectiveStats } from "@/utils/statUtils";

interface Params {
  setCurrentArea: (area: MapLocation | null) => void;
  setCurrentView: (view: "worldMap" | "areaView") => void;
  displayPersistentMessage: (msg: string) => void;
}

export function useWorldMapInitialization({
  setCurrentArea,
  setCurrentView,
  displayPersistentMessage,
}: Params) {
  const router = useRouter();
  const setActiveCharacterStore = useCharacterStore(
    (s) => s.setActiveCharacter
  );
  const saveCharacterStore = useCharacterStore((s) => s.saveCharacter);

  const [overallData, setOverallData] = useState<OverallGameData | null>(null);

  const saveOverallDataState = useCallback((data: OverallGameData) => {
    saveOverallData(data);
    setOverallData(data);
  }, []);

  useEffect(() => {
    try {
      const charIdStr = localStorage.getItem("selectedCharacterId");
      if (!charIdStr) {
        router.push("/characters");
        return;
      }
      const charId = parseInt(charIdStr, 10);
      if (isNaN(charId)) {
        router.push("/characters");
        return;
      }
      const chars = loadCharacters();
      const char = chars.find((c) => c.id === charId);
      if (!char) {
        router.push("/characters");
        return;
      }

      // Load overall data
      let loadedOverall = loadOverallData();
      setOverallData(loadedOverall);
      if (loadedOverall.lastPlayedCharacterId !== char.id) {
        saveOverallDataState({
          ...loadedOverall,
          lastPlayedCharacterId: char.id,
        });
        loadedOverall = { ...loadedOverall, lastPlayedCharacterId: char.id };
      }

      // Heal / barrier if in town
      const updates: Partial<Character> = {};
      const stats = calculateEffectiveStats(char);
      if (
        char.currentAreaId === "cidade_principal" &&
        char.currentHealth < stats.maxHealth
      ) {
        updates.currentHealth = stats.maxHealth;
        updates.currentBarrier = stats.totalBarrier;
      }
      if (Object.keys(updates).length > 0) {
        const updatedChar = { ...char, ...updates };
        setActiveCharacterStore(updatedChar);
        setTimeout(() => saveCharacterStore(), 50);
      } else {
        setActiveCharacterStore(char);
      }

      const areaData = act1Locations.find((l) => l.id === char.currentAreaId);
      if (areaData) {
        setCurrentArea(areaData);
        setCurrentView("worldMap");
      } else {
        setCurrentArea(null);
        setCurrentView("worldMap");
      }
      displayPersistentMessage("Mapa - Ato 1");
    } catch (err) {
      console.error(err);
      router.push("/characters");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { overallData, saveOverallDataState } as const;
} 