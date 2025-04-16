"use client";

import React, { useState, useCallback, useMemo } from "react";
// import Image from "next/image"; // Remove unused
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem } from "../types/gameData";
import {
  getRarityBorderClass,
  // getRarityTextColorClass, // Remove unused
  getRarityInnerGlowClass,
} from "../utils/itemUtils";
// import * as Popover from "@radix-ui/react-popover"; // Remove unused
import * as Tooltip from "@radix-ui/react-tooltip";
import ItemTooltipContent from "./ItemTooltipContent";
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
const POTION_COST = 5;
const STONE_COST = 10;
const WIND_CRYSTAL_COST = 30;

// Helper function to calculate sell price (adjust logic as needed)
const calculateSellPrice = (item: EquippableItem): number => {
  let price = 1; // Base price for Normal
  switch (item.rarity) {
    case "Mágico":
      price = 3;
      break;
    case "Raro":
      price = 7;
      break;
    case "Lendário":
      price = 15;
      break;
  }
  // Add bonus per modifier
  price += (item.modifiers?.length ?? 0) * 1; // Example: +1 Ruby per mod
  return price;
};

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
  const modalActions = <Button onClick={onClose}>Fechar</Button>;

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
          className="text-xs px-3 py-1 border border-white hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
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
          className="text-xs px-3 py-1 border border-white hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
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
          className="text-xs px-3 py-1 border border-white hover:bg-gray-700 disabled:opacity-50 flex-shrink-0 ml-4"
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
        <div className="flex flex-col">
          {/* Inventory Grid (First) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-3 h-64 overflow-y-auto pr-2 custom-scrollbar border-b border-gray-700 pb-3">
            {characterInventory.length > 0 ? (
              characterInventory.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const borderClass = getRarityBorderClass(item.rarity);
                const glowClass = getRarityInnerGlowClass(item.rarity);
                return (
                  <Tooltip.Provider key={item.id} delayDuration={100}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div
                          className={`relative w-16 h-16 border ${
                            isSelected ? "border-white border-2" : borderClass
                          } rounded cursor-pointer ${glowClass} bg-black bg-opacity-20 hover:bg-opacity-40`}
                          onClick={() => handleSelectItem(item.id)}
                        >
                          <img
                            src={item.icon || "/sprites/default_item.png"}
                            alt={item.name}
                            className="w-full h-full object-contain p-1 pointer-events-none"
                          />
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50 pointer-events-none"
                          sideOffset={5}
                          align="center"
                        >
                          <ItemTooltipContent item={item} />
                          <Tooltip.Arrow className="fill-gray-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                );
              })
            ) : (
              <p className="col-span-full text-center text-gray-500 self-center">
                Inventário vazio.
              </p>
            )}
          </div>

          {/* <<< Sell Summary & Button BELOW Grid >>> */}
          <div className="mt-2 flex flex-col items-center gap-2">
            {/* Value Total */}
            <span className="text-gray-300">
              Valor Total:{" "}
              <span className="text-red-400">{totalSellValue} Rubis</span>
            </span>
            {/* Sell Button */}
            <Button
              onClick={handleConfirmSell}
              disabled={selectedItems.size === 0}
              className="w-full max-w-xs"
            >
              Vender Selecionados ({selectedItems.size})
            </Button>
          </div>
        </div>
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
