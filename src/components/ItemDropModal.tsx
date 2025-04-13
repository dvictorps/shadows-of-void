"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import { EquippableItem, EquipmentSlotId } from "../types/gameData";

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EquippableItem, slotId: EquipmentSlotId) => void;
  droppedItems: EquippableItem[];
}

// Helper to get rarity color class (can be moved to utils later)
const getRarityClass = (rarity: string) => {
  switch (rarity) {
    case "Raro":
      return "text-yellow-400";
    case "Azul":
      return "text-blue-400";
    default:
      return "text-white";
  }
};

// --- Calculation Helper ---
function calculateFinalStats(item: EquippableItem): {
  finalMinDamage: number;
  finalMaxDamage: number;
  finalAttackSpeed: number;
} {
  let minDamage = item.baseMinDamage ?? 0;
  let maxDamage = item.baseMaxDamage ?? 0;
  let attackSpeed = item.baseAttackSpeed ?? 1;

  let totalIncreasedPhysical = 0;
  let addedMinDamage = 0;
  let addedMaxDamage = 0;
  let totalIncreasedAttackSpeed = 0;

  item.modifiers.forEach((mod) => {
    switch (mod.type) {
      case "AddsFlatPhysicalDamage":
        addedMinDamage += mod.valueMin ?? 0;
        addedMaxDamage += mod.valueMax ?? 0;
        break;
      case "IncreasedPhysicalDamage":
        totalIncreasedPhysical += mod.value;
        break;
      case "AttackSpeed":
        totalIncreasedAttackSpeed += mod.value;
        break;
    }
  });

  // Apply added flat damage
  minDamage += addedMinDamage;
  maxDamage += addedMaxDamage;

  // Ensure min damage is not greater than max damage
  if (minDamage > maxDamage) {
    minDamage = maxDamage;
  }

  // Apply increased physical damage %
  const physicalMultiplier = 1 + totalIncreasedPhysical / 100;
  minDamage = Math.round(minDamage * physicalMultiplier);
  maxDamage = Math.round(maxDamage * physicalMultiplier);

  // Apply increased attack speed %
  const attackSpeedMultiplier = 1 + totalIncreasedAttackSpeed / 100;
  attackSpeed = attackSpeed * attackSpeedMultiplier;

  return {
    finalMinDamage: minDamage,
    finalMaxDamage: maxDamage,
    finalAttackSpeed: attackSpeed,
  };
}
// --- End Calculation Helper ---

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
              const { finalMinDamage, finalMaxDamage, finalAttackSpeed } =
                calculateFinalStats(item);

              // Determine border/ring class based on rarity (removed shadow-lg)
              let rarityClass = "border-gray-500"; // Default for Branco
              if (item.rarity === "Azul") {
                // Use border and ring for blue outline
                rarityClass = "border-blue-500 ring-2 ring-blue-500";
              } else if (item.rarity === "Raro") {
                // Use border and ring for yellow outline
                rarityClass = "border-yellow-400 ring-2 ring-yellow-400";
              }

              return (
                <div key={item.id} className="flex flex-col items-center">
                  <div
                    className={`border p-1 flex flex-col items-center aspect-square relative group bg-black bg-opacity-60 hover:bg-opacity-80 transition-all duration-150 ${rarityClass}`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      width={56}
                      height={56}
                      className="object-contain flex-shrink-0"
                      unoptimized
                    />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                      <p
                        className={`font-bold ${getRarityClass(
                          item.rarity
                        )} mb-1`}
                      >
                        {item.name}
                      </p>

                      <p className="text-gray-300">
                        Dano Físico: {finalMinDamage} - {finalMaxDamage}
                      </p>
                      <p className="text-gray-300 mb-2">
                        Vel. Ataque: {finalAttackSpeed.toFixed(2)}
                      </p>

                      {item.modifiers.length > 0 && (
                        <hr className="border-gray-600 my-1" />
                      )}

                      {item.modifiers.map((mod, index) => (
                        <p key={index} className="text-blue-300">
                          {`${
                            mod.type === "IncreasedPhysicalDamage"
                              ? `+${mod.value}% Dano Físico Aumentado`
                              : mod.type === "AddsFlatPhysicalDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano Físico`
                              : mod.type === "AttackSpeed"
                              ? `+${mod.value}% Velocidade de Ataque`
                              : mod.type === "LifeLeech"
                              ? `${mod.value}% do Dano de Ataque Físico é Roubado como Vida`
                              : mod.type === "Strength"
                              ? `+${mod.value} Força`
                              : mod.type === "Dexterity"
                              ? `+${mod.value} Destreza`
                              : mod.type === "Intelligence"
                              ? `+${mod.value} Inteligência`
                              : `${mod.type}: ${mod.value}` // Fallback
                          }`}
                        </p>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => onEquip(item, "weapon1")}
                    className="mt-1 px-1.5 py-px text-xs"
                  >
                    Equipar
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400">Sem itens para exibir.</p>
        )}
      </div>
    </Modal>
  );
};

export default ItemDropModal;
