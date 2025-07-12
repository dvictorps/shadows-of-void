import { useState, useCallback } from "react";
import { EquippableItem, Character, OverallGameData } from "@/types/gameData";
import { calculateSellPrice } from "@/utils/itemUtils";
import { saveOverallData } from "@/utils/localStorage";
import {
  POTION_COST,
  TELEPORT_STONE_COST,
  WIND_CRYSTAL_COST,
} from "@/constants/game";

interface UseVendorActionsParams {
  activeCharacter: Character | null;
  overallData: OverallGameData | null;
  updateCharacterStore: (updates: Partial<Character>) => void;
  saveCharacterStore: () => void;
  saveOverallDataState: (data: OverallGameData) => void;
  displayTemporaryMessage: (msg: string, duration?: number) => void;
  displayFloatingRubyChange: (value: number, type: "gain" | "loss") => void;
  isHardcore?: boolean;
}

export function useVendorActions({
  activeCharacter,
  overallData,
  updateCharacterStore,
  saveCharacterStore,
  saveOverallDataState,
  displayTemporaryMessage,
  displayFloatingRubyChange,
  isHardcore,
}: UseVendorActionsParams) {
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // --- Open / Close Modal ---
  const handleOpenVendorModal = useCallback(() => {
    if (activeCharacter?.currentAreaId === "cidade_principal") {
      setIsVendorModalOpen(true);
    } else {
      displayTemporaryMessage("Vendedor só está disponível na cidade.", 2000);
    }
  }, [activeCharacter?.currentAreaId, displayTemporaryMessage]);

  const handleCloseVendorModal = useCallback(() => {
    setIsVendorModalOpen(false);
  }, []);

  // --- Sell Items ---
  const handleSellItems = useCallback(
    (itemsToSell: EquippableItem[]) => {
      if (!activeCharacter || !overallData || itemsToSell.length === 0) return;
      let totalValue = 0;
      itemsToSell.forEach((item) => {
        totalValue += calculateSellPrice(item);
      });
      const newInventory = activeCharacter.inventory.filter(
        (item) => !itemsToSell.includes(item)
      );
      updateCharacterStore({ inventory: newInventory });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: (overallData.currencies.ruby || 0) + totalValue,
        },
      } as OverallGameData;
      saveOverallData(newOverallData, isHardcore);

      displayTemporaryMessage(
        `Vendeu ${itemsToSell.length} itens por ${totalValue} Rubis!`,
        2000
      );
      if (totalValue > 0) {
        displayFloatingRubyChange(totalValue, "gain");
      }
    },
    [
      activeCharacter,
      overallData,
      updateCharacterStore,
      saveCharacterStore,
      saveOverallDataState,
      displayTemporaryMessage,
      displayFloatingRubyChange,
      isHardcore,
    ]
  );

  // --- Buy Potion ---
  const handleBuyPotion = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    if (activeCharacter.healthPotions >= 20) {
      displayTemporaryMessage("Máximo de poções atingido (20).", 2000);
      return;
    }
    if (overallData.currencies.ruby >= POTION_COST) {
      const newPotionCount = Math.min(20, (activeCharacter.healthPotions || 0) + 1);
      updateCharacterStore({ healthPotions: newPotionCount });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - POTION_COST,
        },
      } as OverallGameData;
      saveOverallData(newOverallData, isHardcore);
      displayTemporaryMessage(
        `Comprou 1 Poção de Vida (-${POTION_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(POTION_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${POTION_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
    displayFloatingRubyChange,
    isHardcore,
  ]);

  // --- Buy Teleport Stone ---
  const handleBuyTeleportStone = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    if (overallData.currencies.ruby >= TELEPORT_STONE_COST) {
      updateCharacterStore({
        teleportStones: (activeCharacter.teleportStones || 0) + 1,
      });
      setTimeout(() => saveCharacterStore(), 50);
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - TELEPORT_STONE_COST,
        },
      } as OverallGameData;
      saveOverallData(newOverallData, isHardcore);
      displayTemporaryMessage(
        `Comprou 1 Pedra de Teleporte (-${TELEPORT_STONE_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(TELEPORT_STONE_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${TELEPORT_STONE_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter,
    overallData,
    updateCharacterStore,
    saveCharacterStore,
    saveOverallDataState,
    displayTemporaryMessage,
    displayFloatingRubyChange,
    isHardcore,
  ]);

  // --- Buy Wind Crystal ---
  const handleBuyWindCrystal = useCallback(() => {
    if (!activeCharacter || !overallData) return;
    if (overallData.currencies.ruby >= WIND_CRYSTAL_COST) {
      const newOverallData = {
        ...overallData,
        currencies: {
          ...overallData.currencies,
          ruby: overallData.currencies.ruby - WIND_CRYSTAL_COST,
          windCrystals: (overallData.currencies.windCrystals || 0) + 1,
        },
      } as OverallGameData;
      saveOverallData(newOverallData, isHardcore);
      displayTemporaryMessage(
        `Comprou 1 Cristal do Vento (-${WIND_CRYSTAL_COST} Rubis)!`,
        1500
      );
      displayFloatingRubyChange(WIND_CRYSTAL_COST, "loss");
    } else {
      displayTemporaryMessage(
        `Rubis insuficientes! (${WIND_CRYSTAL_COST} necessários)`,
        2000
      );
    }
  }, [
    activeCharacter,
    overallData,
    saveOverallDataState,
    displayTemporaryMessage,
    displayFloatingRubyChange,
    isHardcore,
  ]);

  return {
    isVendorModalOpen,
    handleOpenVendorModal,
    handleCloseVendorModal,
    handleSellItems,
    handleBuyPotion,
    handleBuyTeleportStone,
    handleBuyWindCrystal,
  } as const;
} 