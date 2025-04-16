"use client";

import React, { useState, useMemo, useCallback } from "react";
import Modal from "./Modal";
import Button from "./Button";
import { EquippableItem } from "../types/gameData";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterInventory: EquippableItem[];
  playerRubies: number;
  onSellItems: (itemsToSell: EquippableItem[]) => void;
  onBuyPotion: () => void;
  onBuyTeleportStone: () => void;
}

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

  // Define costs
  const POTION_COST = 5;
  const STONE_COST = 10;

  // Define actions for the modal
  const modalActions = <Button onClick={onClose}>Fechar</Button>;

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
                  <div
                    key={item.id}
                    className={`relative w-16 h-16 border ${
                      isSelected ? "border-white border-2" : borderClass
                    } rounded cursor-pointer ${glowClass} bg-black bg-opacity-20 hover:bg-opacity-40`}
                    onClick={() => handleSelectItem(item.id)}
                    title={item.name}
                  >
                    <img
                      src={item.icon || "/sprites/default_item.png"}
                      alt={item.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
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
          {/* Rubies Display */}
          <p className="text-right mb-2 text-red-400">
            Seus Rubis: {playerRubies}
          </p>
          <div className="space-y-4">
            {/* Buy Potion */}
            <div className="flex justify-between items-center p-2 border border-gray-700 rounded">
              <div>
                <p className="font-semibold text-white">Poção de Vida</p>
                <p className="text-xs text-gray-400">
                  Restaura uma porção da vida.
                </p>
                <p className="text-red-400">Custo: {POTION_COST} Rubis</p>
              </div>
              <Button
                onClick={onBuyPotion}
                disabled={playerRubies < POTION_COST}
              >
                Comprar Poção
              </Button>
            </div>
            {/* Buy Teleport Stone */}
            <div className="flex justify-between items-center p-2 border border-gray-700 rounded">
              <div>
                <p className="font-semibold text-white">Pedra de Teleporte</p>
                <p className="text-xs text-gray-400">
                  Retorna instantaneamente para a cidade.
                </p>
                <p className="text-red-400">Custo: {STONE_COST} Rubis</p>
              </div>
              <Button
                onClick={onBuyTeleportStone}
                disabled={playerRubies < STONE_COST}
              >
                Comprar Pedra
              </Button>
            </div>
            {/* Add more items to buy here later */}
          </div>
        </>
      )}
    </Modal>
  );
};

export default VendorModal;
