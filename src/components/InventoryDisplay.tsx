"use client";

import React from "react";
import Image from "next/image";
import { Character, ItemRarity, EquippableItem } from "../types/gameData";

// Update Slot props and apply border and glow classes
const Slot = ({
  className = "",
  children,
  borderColorClassName = "border-gray-600", // Default border color
  innerGlowClassName = "", // Default no glow
}: {
  className?: string;
  children?: React.ReactNode;
  borderColorClassName?: string;
  innerGlowClassName?: string; // Prop for inner glow
}) => (
  <div
    className={`
      border ${borderColorClassName} ${innerGlowClassName} // Apply classes here
      flex items-center justify-center
      text-[10px] text-gray-500
      w-full h-full
      transition-all duration-150 // Added transition for smoothness
      ${className}
    `}
  >
    {children}
  </div>
);

// Interface using the types implicitly
interface InventoryDisplayProps {
  equipment: Character["equipment"] | null;
}

// Helper to get rarity color class for text
const getRarityClassText = (rarity?: ItemRarity): string => {
  if (!rarity) return "text-white";
  switch (rarity) {
    case "Raro":
      return "text-yellow-400";
    case "Azul":
      return "text-blue-400";
    default:
      return "text-white";
  }
};

// Helper function for inner glow class
const getRarityInnerGlowClass = (rarity?: ItemRarity): string => {
  if (!rarity) return "";
  switch (rarity) {
    case "Raro":
      // Stronger inset yellow glow
      return "[box-shadow:inset_0_0_10px_2px_rgba(250,204,21,0.6)]";
    case "Azul":
      // Stronger inset blue glow
      return "[box-shadow:inset_0_0_10px_2px_rgba(96,165,250,0.6)]";
    default:
      return ""; // No glow for Branco
  }
};

// Calculation Helper (Needs EquippableItem type)
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
  minDamage += addedMinDamage;
  maxDamage += addedMaxDamage;
  if (minDamage > maxDamage) {
    minDamage = maxDamage;
  }
  const physicalMultiplier = 1 + totalIncreasedPhysical / 100;
  minDamage = Math.round(minDamage * physicalMultiplier);
  maxDamage = Math.round(maxDamage * physicalMultiplier);
  const attackSpeedMultiplier = 1 + totalIncreasedAttackSpeed / 100;
  attackSpeed = attackSpeed * attackSpeedMultiplier;
  return {
    finalMinDamage: minDamage,
    finalMaxDamage: maxDamage,
    finalAttackSpeed: attackSpeed,
  };
}

// Update component signature
const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ equipment }) => {
  // Define sizes (adjust if they were different)
  const weaponSize = "w-24 h-44";
  const bodySize = "w-32 h-48";
  const helmGloveBootSize = "w-24 h-24";
  const ringAmmySize = "w-10 h-10";
  const beltSize = "w-32 h-12";

  const equippedWeapon1 = equipment?.weapon1;

  // Determine dynamic classes for weapon 1 slot
  let weapon1BorderColorClass = "border-gray-600";
  let weapon1InnerGlowClass = "";

  if (equippedWeapon1) {
    weapon1InnerGlowClass = getRarityInnerGlowClass(equippedWeapon1.rarity);
    if (equippedWeapon1.rarity === "Azul") {
      weapon1BorderColorClass = "border-blue-500";
    } else if (equippedWeapon1.rarity === "Raro") {
      weapon1BorderColorClass = "border-yellow-400";
    }
  }

  return (
    <div className="border border-white p-2 flex flex-col gap-2 flex-grow items-center relative">
      {/* Equipment Slots Grid */}
      <div className="grid grid-flow-col grid-rows-5 auto-cols-max gap-x-1 gap-y-1 place-items-center w-auto mb-2 h-full">
        {/* Column 1 */}
        <div className={`${helmGloveBootSize} row-start-1`}></div>{" "}
        {/* Placeholder */}
        <div className={`${weaponSize} row-start-2 row-span-2 relative group`}>
          <Slot
            borderColorClassName={weapon1BorderColorClass}
            innerGlowClassName={weapon1InnerGlowClass}
          />
          {equippedWeapon1 && (
            <>
              {/* Item Image Div */}
              <div
                className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
              >
                <Image
                  src={equippedWeapon1.icon}
                  alt={equippedWeapon1.name}
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                />
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                {(() => {
                  const { finalMinDamage, finalMaxDamage, finalAttackSpeed } =
                    calculateFinalStats(equippedWeapon1);
                  return (
                    <>
                      <p
                        className={`font-bold ${getRarityClassText(
                          equippedWeapon1.rarity
                        )} mb-1`}
                      >
                        {equippedWeapon1.name}
                      </p>
                      <p className="text-gray-300">
                        Dano Físico: {finalMinDamage} - {finalMaxDamage}
                      </p>
                      <p className="text-gray-300 mb-2">
                        Vel. Ataque: {finalAttackSpeed.toFixed(2)}
                      </p>
                      {equippedWeapon1.modifiers.length > 0 && (
                        <hr className="border-gray-600 my-1" />
                      )}
                      {equippedWeapon1.modifiers.map((mod, index) => (
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
                              : `${mod.type}: ${mod.value}`
                          }`}
                        </p>
                      ))}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </div>
        <div className={`${ringAmmySize} row-start-4`}>
          <Slot></Slot> {/* Ring 1 */}
        </div>
        <div className={`${helmGloveBootSize} row-start-5`}>
          <Slot></Slot> {/* Gloves */}
        </div>
        {/* Column 2 */}
        <div className={`${helmGloveBootSize} row-start-1`}>
          <Slot></Slot> {/* Helm */}
        </div>
        <div className={`${bodySize} row-start-2 row-span-3`}>
          <Slot></Slot> {/* Body Armor */}
        </div>
        <div className={`${beltSize} row-start-5`}>
          <Slot></Slot> {/* Belt */}
        </div>
        {/* Column 3 */}
        <div className={`${ringAmmySize} row-start-1`}>
          <Slot></Slot> {/* Amulet */}
        </div>
        <div className={`${weaponSize} row-start-2 row-span-2`}>
          <Slot></Slot> {/* Weapon 2 / Shield */}
        </div>
        <div className={`${ringAmmySize} row-start-4`}>
          <Slot></Slot> {/* Ring 2 */}
        </div>
        <div className={`${helmGloveBootSize} row-start-5`}>
          <Slot></Slot> {/* Boots */}
        </div>
      </div>
      {/* Future: Flasks / Backpack Area */}
    </div>
  );
};

// Export with the InventoryDisplay name
export default InventoryDisplay;
