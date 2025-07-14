"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import { EquippableItem } from "@/types/gameData";
import {
  getRarityBorderClass,
  // getRarityTextColorClass, // Remove unused
  getRarityInnerGlowClass,
 
} from "@/utils/itemDisplay";
// import * as Popover from "@radix-ui/react-popover"; // Remove unused
import * as Tooltip from "@radix-ui/react-tooltip";
import ItemTooltipContent from "@/components/ItemTooltipContent";
import { calculateSellPrice } from "@/utils/equipmentHelpers";
// Removed uuidv4 import earlier

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterInventory: EquippableItem[];
  playerRubies: number;
  onSellItems: (itemsToSell: EquippableItem[]) => void;
  onBuyPotion: () => void;
  onBuyTeleportStone: () => void;
  onBuyWindCrystal: () => void;
}

// Define costs here (or pass as props if they vary)
const POTION_COST = 2;
const STONE_COST = 10;
const WIND_CRYSTAL_COST = 30;

// Helper function to calculate sell price (adjust logic as needed)
// const calculateSellPrice = (item: EquippableItem): number => {
//   let price = 1; // Base price for Normal
//   switch (item.rarity) {
//     case "Mágico":
//       price = 3;
//       break;
//     case "Raro":
//       price = 7;
//       break;
//     case "Lendário":
//       price = 15;
//       break;
//   }
//   // Add bonus per modifier
//   price += (item.modifiers?.length ?? 0) * 1; // Example: +1 Ruby per mod
//   return price;
// };

const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  characterInventory,
  playerRubies,
  onSellItems,
  onBuyPotion,
  onBuyTeleportStone,
  onBuyWindCrystal,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"sell" | "buy">("sell"); // 'sell' or 'buy'

  const handleSelectAll = useCallback(() => {
    const allItemIds = new Set(characterInventory.map((item) => item.id));
    setSelectedItems(allItemIds);
  }, [characterInventory]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleSelectItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const totalSellValue = useMemo(() => {
    let total = 0;
    selectedItems.forEach((itemId) => {
      const item = characterInventory.find((invItem) => invItem.id === itemId);
      if (item) {
        total += calculateSellPrice(item);
      }
    });
    return total;
  }, [selectedItems, characterInventory]);

  const handleConfirmSell = useCallback(() => {
    const itemsToSell = characterInventory.filter((item) =>
      selectedItems.has(item.id)
    );
    if (itemsToSell.length > 0) {
      console.log(
        `[VendorModal] Selling ${itemsToSell.length} items for ${totalSellValue} rubies.`
      );
      onSellItems(itemsToSell);
      setSelectedItems(new Set()); // Clear selection after selling
    }
  }, [characterInventory, selectedItems, totalSellValue, onSellItems]);

  // Define actions for the modal
  const modalActions = (
    <Button
      onClick={onClose}
      className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700"
    >
      Fechar
    </Button>
  );

  const renderSellView = () => {
    const allItemsSelected =
      characterInventory.length > 0 &&
      selectedItems.size === characterInventory.length;

    return (
      <div className="flex flex-col h-full">
        {/* Top section with sell value and buttons */}
        <div className="flex justify-between items-center p-2 border-b border-gray-700 mb-2">
          <div>
            <Button
              onClick={allItemsSelected ? handleDeselectAll : handleSelectAll}
              disabled={characterInventory.length === 0}
              className="text-xs px-3 py-1.5 border border-gray-600 bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 disabled:opacity-50"
            >
              {allItemsSelected ? "Desselecionar Tudo" : "Selecionar Tudo"}
            </Button>
          </div>
          <div className="text-sm text-center">
            <span className="text-gray-400">Valor da Venda: </span>
            <span className="font-bold text-yellow-400">
              {totalSellValue} Rubis
            </span>
          </div>
          <Button
            onClick={handleConfirmSell}
            disabled={selectedItems.size === 0}
            className="text-xs px-4 py-1.5 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vender Selecionados ({selectedItems.size})
          </Button>
        </div>

        {/* Inventory Grid Area */}
        <div className="flex-grow overflow-y-auto p-1 bg-black bg-opacity-30 rounded-lg min-h-[24rem]">
          {characterInventory.length > 0 ? (
            <div className="grid grid-cols-10 gap-1.5">
              {characterInventory.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const rarityBorder = getRarityBorderClass(item.rarity);
                const rarityGlow = getRarityInnerGlowClass(item.rarity);

                return (
                  <Tooltip.Provider key={item.id} delayDuration={200}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div
                          onClick={() => handleSelectItem(item.id)}
                          className={`relative w-full aspect-square cursor-pointer border-2 transition-all duration-150 ${
                            isSelected
                              ? "border-white scale-105"
                              : rarityBorder
                          } rounded-md bg-black bg-opacity-50 flex items-center justify-center group`}
                        >
                          <Image
                            src={item.icon}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="object-contain transition-transform duration-150 group-hover:scale-110"
                          />
                          <div
                            className={`absolute inset-0 rounded-md pointer-events-none ${rarityGlow} ${
                              isSelected ? "shadow-white/50" : ""
                            }`}
                            style={{
                              boxShadow: isSelected
                                ? "0 0 12px 3px var(--tw-shadow-color)"
                                : undefined,
                            }}
                          />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                          sideOffset={5}
                        >
                          <ItemTooltipContent item={item} />
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-sm text-gray-400">
                Seu inventário está vazio.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBuyView = () => (
    <div className="flex flex-col items-center gap-3 pt-2 w-full">
      {/* Title - Changed color to white */}
      <h4 className="text-md font-semibold text-white">Comprar Consumíveis</h4>

      {/* Potion Item Block - Simplified */}
      <div className="flex justify-between items-center p-2 border border-gray-700 rounded w-full max-w-xs">
        {/* Tooltip Trigger: Item Name */}
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <p className="font-semibold text-white text-sm cursor-default">
                Poção de Vida
              </p>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                sideOffset={5}
              >
                Restaura uma porção da vida.
                <br />
                <span className="text-yellow-300">
                  Custo: {POTION_COST} Rubis
                </span>
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {/* Buy Button - Removed background color */}
        <Button
          onClick={onBuyPotion}
          disabled={playerRubies < POTION_COST}
          className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
        >
          Comprar
        </Button>
      </div>

      {/* Teleport Stone Item Block - Simplified */}
      <div className="flex justify-between items-center p-2 border border-gray-700 rounded w-full max-w-xs">
        {/* Tooltip Trigger: Item Name */}
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <p className="font-semibold text-white text-sm cursor-default">
                Pedra de Teleporte
              </p>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                sideOffset={5}
              >
                Retorna instantaneamente para a cidade.
                <br />
                <span className="text-yellow-300">
                  Custo: {STONE_COST} Rubis
                </span>
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {/* Buy Button - Removed background color */}
        <Button
          onClick={onBuyTeleportStone}
          disabled={playerRubies < STONE_COST}
          className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
        >
          Comprar
        </Button>
      </div>

      {/* Wind Crystal Item Block - Simplified */}
      <div className="flex justify-between items-center p-2 border border-gray-700 rounded w-full max-w-xs">
        {/* Tooltip Trigger: Item Name */}
        <Tooltip.Provider delayDuration={100}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <p className="font-semibold text-white text-sm cursor-default">
                Cristal do Vento
              </p>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                sideOffset={5}
              >
                Permite viajar entre quaisquer pontos desbloqueados.
                <br />
                <span className="text-yellow-300">
                  Custo: {WIND_CRYSTAL_COST} Rubis
                </span>
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {/* Buy Button - Removed background color */}
        <Button
          onClick={onBuyWindCrystal}
          disabled={playerRubies < WIND_CRYSTAL_COST}
          className="text-xs px-3 py-1 border border-gray-500 text-gray-300 hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
        >
          Comprar
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vendedor"
      actions={modalActions}
      maxWidthClass="max-w-screen-lg"
    >
      <div className="flex border-b border-gray-600 mb-3">
        <button
          onClick={() => setViewMode("sell")}
          className={`flex-1 py-2 text-center ${
            viewMode === "sell"
              ? "border-b-2 border-yellow-400 text-yellow-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Vender Itens
        </button>
        <button
          onClick={() => setViewMode("buy")}
          className={`flex-1 py-2 text-center ${
            viewMode === "buy"
              ? "border-b-2 border-yellow-400 text-yellow-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Comprar
        </button>
      </div>

      {viewMode === "sell" ? (
        // --- Sell Mode ---
        renderSellView()
      ) : (
        // --- Buy Mode ---
        <>
          {/* Rubies Display - Changed text color */}
          <p className="text-right mb-2 text-yellow-300">
            Seus Rubis: {playerRubies}
          </p>
          {renderBuyView()}
        </>
      )}
    </Modal>
  );
};

export default VendorModal;
