import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { EquippableItem, act1Locations, MapLocation, EnemyInstance, Character, OverallGameData } from "@/types/gameData";
import { useCharacterStore } from "@/stores/characterStore";
import { BASE_TRAVEL_TIME_MS, calculateTravelTime } from "@/utils/gameLogicUtils";
import { isAreaConnected } from '@/utils/mapUtils';

interface Params {
  currentView: "worldMap" | "areaView";
  isTraveling: boolean;
  displayPersistentMessage: (msg: string) => void;
  handleConfirmDiscard: (item: EquippableItem) => void;
  itemToDiscard: EquippableItem | null;
  effectiveStats: { maxHealth: number; movementSpeed?: number } | null;
  updateCharacterStore: (u: Partial<Character>) => void;
  saveCharacterStore: () => void;
  setCurrentView: (v: "worldMap" | "areaView") => void;
  activeCharacter: Character | null;
  setCurrentArea: (loc: MapLocation | null) => void;
  setIsTraveling: (v: boolean) => void;
  setTravelProgress: (v: number) => void;
  setTravelTargetAreaId: (id: string | null) => void;
  travelTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  travelStartTimeRef: React.MutableRefObject<number | null>;
  travelTargetIdRef: React.MutableRefObject<string | null>;
  setCurrentEnemy: (e: EnemyInstance | null) => void;
  setEnemiesKilledCount: (n: number) => void;
  enemySpawnCooldownRef: React.MutableRefObject<number>;
  pendingDropCount: number;
  openDropModalForCollection: () => void;
  overallData: OverallGameData;
  saveOverallDataState: (data: OverallGameData) => void;
}

// Pequeno delay antes do primeiro spawn ao entrar em uma área (em ms)
const INITIAL_ENEMY_SPAWN_DELAY_MS = 1000;

function getTotalBarrier(stats: unknown): number {
  if (
    stats &&
    typeof stats === 'object' &&
    'totalBarrier' in stats &&
    typeof (stats as { totalBarrier?: unknown }).totalBarrier === 'number'
  ) {
    return (stats as { totalBarrier: number }).totalBarrier;
  }
  return 0;
}

export function useTravelHandlers({
  currentView,
  isTraveling,
  displayPersistentMessage,
  handleConfirmDiscard,
  itemToDiscard,
  effectiveStats,
  updateCharacterStore,
  saveCharacterStore,
  setCurrentView,
  activeCharacter,
  setCurrentArea,
  setIsTraveling,
  setTravelProgress,
  setTravelTargetAreaId,
  travelTimerRef,
  travelStartTimeRef,
  travelTargetIdRef,
  setCurrentEnemy,
  setEnemiesKilledCount,
  enemySpawnCooldownRef,
  pendingDropCount,
  openDropModalForCollection,
  overallData,
  saveOverallDataState,
}: Params) {
  const router = useRouter();

  // Mouse hover handlers
  const handleMouseEnterLocation = useCallback(
    (description: string) => {
      if (currentView === "worldMap" && !isTraveling) {
        displayPersistentMessage(description);
      }
    },
    [currentView, isTraveling, displayPersistentMessage]
  );

  const handleMouseLeaveLocation = useCallback(() => {
    if (currentView === "worldMap" && !isTraveling) {
      displayPersistentMessage("Mapa - Ato 1");
    }
  }, [currentView, isTraveling, displayPersistentMessage]);

  // Navigation back to character list
  const handleBackToCharacters = useCallback(() => {
    router.push("/characters");
  }, [router]);

  // Discard confirmation trigger
  const triggerConfirmDiscard = useCallback(() => {
    if (itemToDiscard) {
      handleConfirmDiscard(itemToDiscard);
    } else {
      console.error("[triggerConfirmDiscard] itemToDiscard é null");
    }
  }, [itemToDiscard, handleConfirmDiscard]);

  // --- Player Heal handler (real) ---
  const handlePlayerHeal = useCallback(
    (amount: number) => {
      const currentChar = useCharacterStore.getState().activeCharacter;
      const currentMaxHp = effectiveStats?.maxHealth ?? 0;

      if (
        !currentChar ||
        amount <= 0 ||
        currentChar.currentHealth >= currentMaxHp
      ) {
        return;
      }

      const newHealth = Math.min(
        currentMaxHp,
        currentChar.currentHealth + amount
      );

      if (newHealth !== currentChar.currentHealth) {
        updateCharacterStore({ currentHealth: newHealth });
        setTimeout(() => saveCharacterStore(), 50);
      }
    },
    [effectiveStats, updateCharacterStore, saveCharacterStore]
  );

  // --- Return to World Map handler ---
  const handleReturnToMap = useCallback(
    (areaWasCompleted: boolean) => {
      if (pendingDropCount > 0) {
        openDropModalForCollection();
      }
      if (currentView === "areaView") {
        setCurrentView("worldMap");
        setCurrentEnemy(null);
        setEnemiesKilledCount(0);
        enemySpawnCooldownRef.current = INITIAL_ENEMY_SPAWN_DELAY_MS;
        displayPersistentMessage("Mapa - Ato 1");
        const char = useCharacterStore.getState().activeCharacter;
        const townArea = act1Locations.find((l) => l.id === "cidade_principal");
        if (townArea) {
          updateCharacterStore({
            healthPotions: Math.max(char?.healthPotions ?? 0, 3),
            currentHealth: effectiveStats?.maxHealth ?? char?.maxHealth ?? 0,
            currentMana: char?.maxMana ?? 0,
            currentBarrier: getTotalBarrier(effectiveStats),
          });
          setTimeout(() => saveCharacterStore(), 50);
        }
        if (areaWasCompleted) {
          const char = useCharacterStore.getState().activeCharacter;
          if (char) {
            const { unlockedAreaIds = [], currentAreaId } = char;
            const areaData = act1Locations.find((loc: MapLocation) => loc.id === currentAreaId);
            let newUnlocked = unlockedAreaIds;
            if (areaData?.unlocks) {
              newUnlocked = Array.from(new Set([...unlockedAreaIds, ...areaData.unlocks]));
            }
            if (newUnlocked !== unlockedAreaIds) {
              updateCharacterStore({ unlockedAreaIds: newUnlocked });
              setTimeout(() => saveCharacterStore(), 50);
            }
          }
        }
      }
    },
    [currentView, setCurrentView, displayPersistentMessage, updateCharacterStore, saveCharacterStore, setCurrentEnemy, setEnemiesKilledCount, enemySpawnCooldownRef, pendingDropCount, openDropModalForCollection, effectiveStats]
  );

  // --- Enter Area View (called after travel finishes) ---
  const handleEnterAreaView = useCallback(
    (targetAreaId: string) => {
      const areaData = act1Locations.find((loc) => loc.id === targetAreaId);
      if (!areaData) {
        console.error("[handleEnterAreaView] Area not found", targetAreaId);
        return;
      }

      // Update character currentAreaId
      updateCharacterStore({ currentAreaId: targetAreaId });
      setTimeout(() => saveCharacterStore(), 50);

      // Reset combat state then update current area and switch view
      setCurrentEnemy(null);
      setEnemiesKilledCount(0);
      enemySpawnCooldownRef.current = INITIAL_ENEMY_SPAWN_DELAY_MS;
      setCurrentArea(areaData);
      setCurrentView("areaView");

      // Reset travel state
      setIsTraveling(false);
      setTravelProgress(0);
      setTravelTargetAreaId(null);
      travelStartTimeRef.current = null;
      travelTargetIdRef.current = null;

      displayPersistentMessage(areaData.description);
    },
    [setCurrentArea, setCurrentView, updateCharacterStore, saveCharacterStore, setIsTraveling, setTravelProgress, setTravelTargetAreaId, displayPersistentMessage, setCurrentEnemy, setEnemiesKilledCount, enemySpawnCooldownRef]
  );

  // --- Handle Travel initiation ---
  const handleTravel = useCallback(
    (targetAreaId: string) => {
      if (isTraveling || currentView !== "worldMap") return;

      if (activeCharacter && targetAreaId === activeCharacter.currentAreaId) {
        handleEnterAreaView(targetAreaId);
        return;
      }

      const targetArea = act1Locations.find((loc) => loc.id === targetAreaId);
      if (!targetArea) {
        console.error("[handleTravel] Target area not found", targetAreaId);
        return;
      }

      if (
        activeCharacter &&
        !activeCharacter.unlockedAreaIds.includes(targetAreaId)
      ) {
        displayPersistentMessage("Você ainda não desbloqueou essa área.");
        return;
      }

      const currentAreaId = activeCharacter?.currentAreaId;
      if (activeCharacter && currentAreaId && !isAreaConnected(currentAreaId, targetAreaId, act1Locations)) {
        if ((overallData?.currencies?.windCrystals ?? 0) <= 0) {
          displayPersistentMessage("Você não possui Cristais do Vento suficientes para viajar diretamente.");
          return;
        }
        const newOverallData = {
          ...overallData,
          currencies: {
            ...overallData.currencies,
            windCrystals: (overallData.currencies.windCrystals ?? 1) - 1,
          },
        };
        saveOverallDataState(newOverallData);
        displayPersistentMessage("Você usou um Cristal do Vento para viajar diretamente.");
      }

      const baseTime = BASE_TRAVEL_TIME_MS * (targetArea.distance || 1);
      const movementSpeed = activeCharacter?.movementSpeed ?? 0;
      const travelTime = calculateTravelTime(baseTime, movementSpeed);

      setIsTraveling(true);
      setTravelProgress(0);
      setTravelTargetAreaId(targetAreaId);

      travelStartTimeRef.current = Date.now();
      travelTargetIdRef.current = targetAreaId;

      displayPersistentMessage(`Viajando para ${targetArea.name}...`);

      if (travelTimerRef.current){
        clearInterval(travelTimerRef.current);
      }

      travelTimerRef.current = setInterval(() => {
        if (!travelStartTimeRef.current) return;
        const elapsed = Date.now() - travelStartTimeRef.current;
        const progress = Math.min(100, (elapsed / travelTime) * 100);
        setTravelProgress(progress);

        if (progress >= 100) {
          if (travelTimerRef.current) {
            clearInterval(travelTimerRef.current);
            travelTimerRef.current = null;
          }
          handleEnterAreaView(targetAreaId);
        }
      }, 100);
    },
    [isTraveling, currentView, activeCharacter, setIsTraveling, setTravelProgress, setTravelTargetAreaId, travelStartTimeRef, travelTimerRef, handleEnterAreaView, displayPersistentMessage, updateCharacterStore, saveCharacterStore, overallData, saveOverallDataState]
  );

  // --- Use Teleport Stone ---
  const handleUseTeleportStone = useCallback(() => {
    const char = useCharacterStore.getState().activeCharacter;
    if (!char || (char.teleportStones ?? 0) <= 0) {
      displayPersistentMessage("Sem pedras de teleporte disponíveis.");
      return;
    }
    updateCharacterStore({ teleportStones: (char.teleportStones || 0) - 1 });
    setTimeout(() => saveCharacterStore(), 50);
    const townArea = act1Locations.find((l) => l.id === "cidade_principal");
    if (!townArea) {
      console.error("[handleUseTeleportStone] Town area not found");
      return;
    }
    setCurrentEnemy(null);
    setEnemiesKilledCount(0);
    enemySpawnCooldownRef.current = INITIAL_ENEMY_SPAWN_DELAY_MS;
    setCurrentArea(townArea);
    setCurrentView("worldMap");
    setIsTraveling(false);
    setTravelProgress(0);
    setTravelTargetAreaId(null);
    if (travelTimerRef.current) {
      clearInterval(travelTimerRef.current);
      travelTimerRef.current = null;
    }
    travelStartTimeRef.current = null;
    travelTargetIdRef.current = null;
    updateCharacterStore({
      currentAreaId: townArea.id,
      healthPotions: Math.max(char.healthPotions, 3),
      currentHealth: effectiveStats?.maxHealth ?? char.maxHealth,
      currentMana: char.maxMana,
      currentBarrier: getTotalBarrier(effectiveStats),
    });
    setTimeout(() => saveCharacterStore(), 50);
    displayPersistentMessage("Você usou uma Pedra de Teleporte e retornou à Cidade Principal.");
  }, [updateCharacterStore, saveCharacterStore, setCurrentArea, setCurrentView, setIsTraveling, setTravelProgress, setTravelTargetAreaId, displayPersistentMessage, setCurrentEnemy, setEnemiesKilledCount, enemySpawnCooldownRef, effectiveStats]);

  return {
    handleTravel,
    handleEnterAreaView,
    handleReturnToMap,
    handleReEnterAreaView: useCallback(() => {
      if (currentView === "worldMap" && !isTraveling) {
        setCurrentView("areaView");

        // Ensure currentArea is synced (in case of refresh)
        if (activeCharacter) {
          const area = act1Locations.find(
            (loc) => loc.id === activeCharacter.currentAreaId
          );
          if (area) {
            setCurrentArea(area);
            displayPersistentMessage(area.description);
          }
        }
      }
    }, [currentView, isTraveling, activeCharacter, setCurrentView, setCurrentArea, displayPersistentMessage]),
    handleMouseEnterLocation,
    handleMouseLeaveLocation,
    handleBackToCharacters,
    handleUseTeleportStone,
    triggerConfirmDiscard,
    handlePlayerHeal,
  } as const;
} 