"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { FaArrowCircleUp } from "react-icons/fa"; // Re-import the icon
import { EquippableItem, EquipmentSlotId } from "../types/gameData";
import ItemTooltipContent from "./ItemTooltipContent"; // Import the new component

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EquippableItem, slotId: EquipmentSlotId) => void;
  droppedItems: EquippableItem[];
}

const ItemDropModal: React.FC<ItemDropModalProps> = ({
  isOpen,
  onClose,
  onEquip,
  droppedItems,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Itens Encontrados!"
      actions={
        <div className="flex justify-center w-full">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      }
    >
      <div className="my-4 flex flex-col items-center gap-4 min-h-[20vh] w-full max-w-xl mx-auto">
        {droppedItems.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {droppedItems.map((item) => {
              // Rarity class logic remains here as it styles the item container
              let rarityBorderClass = "border-gray-500"; // Default Branco
              if (item.rarity === "Mágico") {
                rarityBorderClass = "border-blue-500 ring-2 ring-blue-500";
              } else if (item.rarity === "Raro") {
                rarityBorderClass = "border-yellow-400 ring-2 ring-yellow-400";
              } else if (item.rarity === "Lendário") {
                rarityBorderClass = "border-red-600 ring-2 ring-red-500";
              }

              return (
                <div key={item.id} className="flex flex-col items-center">
                  {/* Item Display with Group Hover for Tooltip */}
                  <div
                    className={`border p-1 flex flex-col items-center aspect-square relative group bg-black bg-opacity-60 hover:bg-opacity-80 transition-all duration-150 ${rarityBorderClass}`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="object-contain flex-shrink-0"
                      unoptimized
                    />
                    {/* CSS Tooltip Content */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                      <ItemTooltipContent item={item} />
                    </div>
                  </div>
                  {/* Equip Button with its own Tooltip (Optional) */}
                  <div className="relative group/equip mt-1">
                    <Button
                      onClick={() => onEquip(item, "weapon1")} // TODO: Add logic
                      className="p-1 text-sm"
                      aria-label="Equipar Item"
                    >
                      <FaArrowCircleUp />
                    </Button>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/equip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-gray-600">
                      Equipar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">Nenhum item encontrado.</p>
        )}
      </div>
    </Modal>
  );
};

export default ItemDropModal;
