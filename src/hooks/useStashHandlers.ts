import { useState, useCallback } from "react";
import { Character, OverallGameData } from "@/types/gameData";
import { STASH_SLOTS, INVENTORY_SLOTS } from "@/constants/game";

interface UseStashHandlersParams {
  activeCharacter: Character | null;
  overallData: OverallGameData | null;
  updateCharacterStore: (updates: Partial<Character>) => void;
  saveCharacterStore: () => void;
  saveOverallDataState: (data: OverallGameData) => void;
  displayTemporaryMessage: (msg: string, duration?: number) => void;
}

export function useStashHandlers({
  activeCharacter,
  overallData,
  updateCharacterStore,
  saveCharacterStore,
  saveOverallDataState,
  displayTemporaryMessage,
}: UseStashHandlersParams) {
  const [isStashOpen, setIsStashOpen] = useState(false);

  // Open/Close
  const handleOpenStash = useCallback(() => {
    if (activeCharacter?.currentAreaId === "cidade_principal") {
      setIsStashOpen(true);
    } else {
      displayTemporaryMessage("O baú só está disponível na cidade.", 2000);
    }
  }, [activeCharacter?.currentAreaId, displayTemporaryMessage]);

  const handleCloseStash = useCallback(() => setIsStashOpen(false), []);

  // Single item move to stash
  const handleMoveItemToStash = useCallback(
    (itemId: string) => {
      if (!activeCharacter || !overallData) return;
      const currentStash = overallData.stash || [];
      if (currentStash.length >= STASH_SLOTS) {
        displayTemporaryMessage("Baú cheio!", 1500);
        return;
      }
      const inv = activeCharacter.inventory || [];
      const idx = inv.findIndex((i) => i.id === itemId);
      if (idx === -1) return;
      const item = inv[idx];
      const newInventory = [...inv.slice(0, idx), ...inv.slice(idx + 1)];
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);
      const newStash = [...currentStash, item];
      saveOverallDataState({ ...overallData, stash: newStash });
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  // Single item move to inventory
  const handleMoveItemToInventory = useCallback(
    (itemId: string) => {
      if (!activeCharacter || !overallData) return;
      const inv = activeCharacter.inventory || [];
      if (inv.length >= INVENTORY_SLOTS) {
        displayTemporaryMessage("Inventário cheio!", 1500);
        return;
      }
      const stash = overallData.stash || [];
      const idx = stash.findIndex((i) => i.id === itemId);
      if (idx === -1) return;
      const item = stash[idx];
      const newStash = [...stash.slice(0, idx), ...stash.slice(idx + 1)];
      const newInventory = [...inv, item];
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);
      saveOverallDataState({ ...overallData, stash: newStash });
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  // Move selected items to stash
  const handleMoveSelectedToStash = useCallback(
    (itemIds: string[]) => {
      if (!activeCharacter || !overallData || itemIds.length === 0) return;
      const currentStash = overallData.stash || [];
      const itemsToMove = activeCharacter.inventory?.filter((i) => itemIds.includes(i.id)) || [];
      const spaceNeeded = itemsToMove.length;
      const available = STASH_SLOTS - currentStash.length;
      if (spaceNeeded > available) {
        displayTemporaryMessage(
          `Baú cheio! Precisa de ${spaceNeeded} espaços, ${available} disponíveis.`,
          2000
        );
        return;
      }
      const newInventory = activeCharacter.inventory?.filter((i) => !itemIds.includes(i.id)) || [];
      const newStash = [...currentStash, ...itemsToMove];
      updateCharacterStore({ inventory: newInventory });
      saveOverallDataState({ ...overallData, stash: newStash });
      setTimeout(() => saveCharacterStore(), 50);
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  // Move selected items to inventory
  const handleMoveSelectedToInventory = useCallback(
    (itemIds: string[]) => {
      if (!activeCharacter || !overallData || itemIds.length === 0) return;
      const currentInventory = activeCharacter.inventory || [];
      const itemsToMove = overallData.stash?.filter((i) => itemIds.includes(i.id)) || [];
      const spaceNeeded = itemsToMove.length;
      const available = INVENTORY_SLOTS - currentInventory.length;
      if (spaceNeeded > available) {
        displayTemporaryMessage(
          `Inventário cheio! Precisa de ${spaceNeeded} espaços, ${available} disponíveis.`,
          2000
        );
        return;
      }
      const newStash = overallData.stash?.filter((i) => !itemIds.includes(i.id)) || [];
      const newInventory = [...currentInventory, ...itemsToMove];
      updateCharacterStore({ inventory: newInventory });
      saveOverallDataState({ ...overallData, stash: newStash });
      setTimeout(() => saveCharacterStore(), 50);
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
    ]
  );

  // Move all to stash
  const handleMoveAllToStash = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    const inventory = activeCharacter.inventory || [];
    if (inventory.length === 0) {
      displayTemporaryMessage("Inventário já está vazio.", 1500);
      return;
    }
    const currentStash = overallData.stash || [];
    const available = STASH_SLOTS - currentStash.length;
    if (inventory.length > available) {
      displayTemporaryMessage(
        `Baú cheio! Precisa de ${inventory.length} espaços, ${available} disponíveis.`,
        2000
      );
      return;
    }
    const newStash = [...currentStash, ...inventory];
    updateCharacterStore({ inventory: [] });
    saveOverallDataState({ ...overallData, stash: newStash });
    setTimeout(() => saveCharacterStore(), 50);
    displayTemporaryMessage(`Movidos ${inventory.length} itens para o baú.`, 1500);
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
  ]);

  return {
    isStashOpen,
    handleOpenStash,
    handleCloseStash,
    handleMoveItemToStash,
    handleMoveItemToInventory,
    handleMoveSelectedToStash,
    handleMoveSelectedToInventory,
    handleMoveAllToStash,
  } as const;
} 