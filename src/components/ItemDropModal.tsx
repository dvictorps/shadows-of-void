"use client";

import React from "react";
import Image from "next/image";
import Modal from "./Modal"; // Assuming Modal component exists
import Button from "./Button"; // Assuming Button component exists
import {
  EquippableItem,
  EquipmentSlotId,
  ItemRarity,
  ModifierType,
  PREFIX_MODIFIERS, // Import sets
  SUFFIX_MODIFIERS,
} from "../types/gameData";
import { FaArrowCircleUp } from "react-icons/fa"; // Import the icon

interface ItemDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EquippableItem, slotId: EquipmentSlotId) => void;
  droppedItems: EquippableItem[];
}

// Helper to get rarity TEXT color class
const getRarityClass = (rarity: ItemRarity | string) => {
  switch (rarity) {
    case "Lendário":
      return "text-red-500"; // Red text for legendary
    case "Raro":
      return "text-yellow-400";
    case "Mágico": // Changed from Azul
      return "text-blue-400";
    default:
      return "text-white"; // Branco
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

// Define display order for modifiers
const MODIFIER_DISPLAY_ORDER: Record<ModifierType, number> = {
  // Prefixes (Lower numbers first)
  IncreasedPhysicalDamage: 10,
  AddsFlatPhysicalDamage: 20,
  AddsFlatFireDamage: 30,
  AddsFlatColdDamage: 40,
  AddsFlatLightningDamage: 50,
  AddsFlatVoidDamage: 60,
  // Suffixes (Higher numbers first, within suffixes)
  AttackSpeed: 100,
  IncreasedCriticalStrikeChance: 110,
  IncreasedCriticalStrikeMultiplier: 120,
  IncreasedElementalDamage: 130,
  LifeLeech: 140,
  Strength: 200, // Attributes last
  Dexterity: 210,
  Intelligence: 220,
};

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

              // Determine border/ring class based on rarity
              let rarityBorderClass = "border-gray-500"; // Default Branco
              if (item.rarity === "Mágico") {
                // Changed from Azul
                rarityBorderClass = "border-blue-500 ring-2 ring-blue-500";
              } else if (item.rarity === "Raro") {
                rarityBorderClass = "border-yellow-400 ring-2 ring-yellow-400";
              } else if (item.rarity === "Lendário") {
                // Added Legendary
                rarityBorderClass = "border-red-600 ring-2 ring-red-500"; // Red border/ring
              }

              // Sort modifiers for display
              const sortedModifiers = item.modifiers.slice().sort((a, b) => {
                const aIsPrefix = PREFIX_MODIFIERS.has(a.type);
                const bIsPrefix = PREFIX_MODIFIERS.has(b.type);
                const aIsSuffix = SUFFIX_MODIFIERS.has(a.type);
                const bIsSuffix = SUFFIX_MODIFIERS.has(b.type);

                // 1. Group by Prefix then Suffix
                if (aIsPrefix && bIsSuffix) return -1;
                if (aIsSuffix && bIsPrefix) return 1;

                // 2. Sort within group using defined order
                const orderA = MODIFIER_DISPLAY_ORDER[a.type] ?? 999; // Place unknown mods last
                const orderB = MODIFIER_DISPLAY_ORDER[b.type] ?? 999;
                if (orderA !== orderB) {
                  return orderA - orderB;
                }

                // 3. Fallback: alphabetical sort if order is the same or unknown
                return a.type.localeCompare(b.type);
              });

              return (
                <div key={item.id} className="flex flex-col items-center">
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

                      {/* Render SORTED modifiers */}
                      {sortedModifiers.length > 0 && (
                        <hr className="border-gray-600 my-1" />
                      )}
                      {sortedModifiers.map((mod, index) => (
                        <p
                          key={`${item.id}-mod-${index}`}
                          className="text-blue-300"
                        >
                          {`${
                            mod.type === "IncreasedPhysicalDamage"
                              ? `+${mod.value}% Dano Físico Aumentado`
                              : mod.type === "AddsFlatPhysicalDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano Físico`
                              : // Add cases for new mods
                              mod.type === "AddsFlatFireDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano de Fogo`
                              : mod.type === "AddsFlatColdDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano de Frio`
                              : mod.type === "AddsFlatLightningDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano de Raio`
                              : mod.type === "AddsFlatVoidDamage"
                              ? `Adiciona ${mod.valueMin}-${mod.valueMax} Dano de Vazio`
                              : mod.type === "AttackSpeed"
                              ? `+${mod.value}% Velocidade de Ataque`
                              : mod.type === "IncreasedCriticalStrikeChance"
                              ? `+${mod.value}% Chance de Acerto Crítico`
                              : mod.type === "IncreasedCriticalStrikeMultiplier"
                              ? `+${mod.value}% Multiplicador de Dano Crítico`
                              : mod.type === "IncreasedElementalDamage"
                              ? `+${mod.value}% Dano Elemental Aumentado`
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
                  <div className="relative group/equip mt-1">
                    <Button
                      onClick={() => onEquip(item, "weapon1")}
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
          <p className="text-gray-400">Sem itens para exibir.</p>
        )}
      </div>
    </Modal>
  );
};

export default ItemDropModal;
