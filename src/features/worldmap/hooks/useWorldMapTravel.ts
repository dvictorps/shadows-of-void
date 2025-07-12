import { useWorldMapContext } from "@/features/worldmap/context/WorldMapContext";
import { useTravelHandlers } from "@/hooks/useTravelHandlers";
import { EquippableItem, Character, EnemyInstance, OverallGameData } from "@/types/gameData";

interface Params {
  displayPersistentMessage: (msg: string) => void;
  handleConfirmDiscard: (item: EquippableItem) => void;
  itemToDiscard: EquippableItem | null;
  effectiveStats: { maxHealth: number; movementSpeed?: number } | null;
  updateCharacterStore: (u: Partial<Character>) => void;
  saveCharacterStore: () => void;
  activeCharacter: Character | null;
  setCurrentEnemy: (e: EnemyInstance | null) => void;
  setEnemiesKilledCount: (n: number) => void;
  enemySpawnCooldownRef: React.MutableRefObject<number>;
  pendingDropCount: number;
  openDropModalForCollection: () => void;
  travelTimerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  travelStartTimeRef: React.MutableRefObject<number | null>;
  travelTargetIdRef: React.MutableRefObject<string | null>;
  overallData: OverallGameData;
  saveOverallDataState: (data: OverallGameData) => void;
}

export function useWorldMapTravel(params: Params) {
  const {
    currentView,
    isTraveling,
    setCurrentView,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
  } = useWorldMapContext();

  return useTravelHandlers({
    currentView,
    isTraveling,
    displayPersistentMessage: params.displayPersistentMessage,
    handleConfirmDiscard: params.handleConfirmDiscard,
    itemToDiscard: params.itemToDiscard,
    effectiveStats: params.effectiveStats,
    updateCharacterStore: params.updateCharacterStore,
    saveCharacterStore: params.saveCharacterStore,
    setCurrentView,
    activeCharacter: params.activeCharacter,
    setCurrentArea,
    setIsTraveling,
    setTravelProgress,
    setTravelTargetAreaId,
    travelTimerRef: params.travelTimerRef,
    travelStartTimeRef: params.travelStartTimeRef,
    travelTargetIdRef: params.travelTargetIdRef,
    setCurrentEnemy: params.setCurrentEnemy,
    setEnemiesKilledCount: params.setEnemiesKilledCount,
    enemySpawnCooldownRef: params.enemySpawnCooldownRef,
    pendingDropCount: params.pendingDropCount,
    openDropModalForCollection: params.openDropModalForCollection,
    overallData: params.overallData,
    saveOverallDataState: params.saveOverallDataState,
  });
} 