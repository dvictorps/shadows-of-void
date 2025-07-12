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
  saveCharacters,
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
  const [isHardcore, setIsHardcore] = useState<boolean | null>(null);
  const [charId, setCharId] = useState<number | null>(null);
  const [char, setChar] = useState<Character | null>(null);

  // Função para salvar OverallData na chave correta
  const saveOverallDataState = useCallback(
    (data: OverallGameData) => {
      if (isHardcore == null) return;
      saveOverallData(data, isHardcore);
      setOverallData(data);
    },
    [isHardcore]
  );

  // Primeiro efeito: detectar personagem e modo
  useEffect(() => {
    try {
      const charIdStr = localStorage.getItem("selectedCharacterId");
      if (!charIdStr) {
        router.push("/characters");
        return;
      }
      const id = parseInt(charIdStr, 10);
      if (isNaN(id)) {
        router.push("/characters");
        return;
      }
      setCharId(id);
      // Carregar valor de hardcore salvo
      const isHardcoreStr = localStorage.getItem("selectedCharacterIsHardcore");
      const hc = isHardcoreStr === "1";
      setIsHardcore(hc);
      // Carregar personagens normais e hardcore
      const charsNormal = loadCharacters(false);
      const charsHC = loadCharacters(true);
      let foundChar = hc
        ? charsHC.find((c) => c.id === id)
        : charsNormal.find((c) => c.id === id);
      if (!foundChar) {
        // fallback: tentar achar em ambas as listas
        foundChar = charsNormal.find((c) => c.id === id) || charsHC.find((c) => c.id === id);
      }
      if (!foundChar) {
        router.push("/characters");
        return;
      }
      setChar(foundChar);
    } catch (err) {
      console.error(err);
      router.push("/characters");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Segundo efeito: carregar overallData e setar personagem ativo
  useEffect(() => {
    if (isHardcore == null || !char) return;
    let loadedOverall = loadOverallData(isHardcore);
    setOverallData(loadedOverall);
    if (loadedOverall.lastPlayedCharacterId !== char.id) {
      saveOverallDataState({
        ...loadedOverall,
        lastPlayedCharacterId: char.id,
      });
      loadedOverall = { ...loadedOverall, lastPlayedCharacterId: char.id };
    }
    // Heal / barrier se estiver na cidade
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
      // Salvar personagem na lista correta
      const chars = isHardcore ? loadCharacters(true) : loadCharacters(false);
      const idx = chars.findIndex((c) => c.id === updatedChar.id);
      if (idx !== -1) {
        chars[idx] = updatedChar;
        saveCharacters(chars, isHardcore);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHardcore, char]);

  return { overallData, saveOverallDataState, isHardcore: isHardcore ?? false } as const;
} 