"use client";

import React from "react";
import Image from "next/image";
import { Character } from "../types/gameData";
import {
  getRarityClassText,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";
import ItemTooltipContent from "./ItemTooltipContent";

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

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({ equipment }) => {
  // Define sizes (adjust if they were different)
  const weaponSize = "w-24 h-44";
  const bodySize = "w-32 h-48";
  const helmGloveBootSize = "w-24 h-24";
  const ringAmmySize = "w-10 h-10";
  const beltSize = "w-32 h-12";

  return (
    <div className="border border-white p-2 flex flex-col gap-2 flex-grow items-center relative">
      {/* Equipment Slots Grid */}
      <div className="grid grid-flow-col grid-rows-5 auto-cols-max gap-x-1 gap-y-1 place-items-center w-auto mb-2 h-full">
        {/* Column 1 */}
        <div className={`${helmGloveBootSize} row-start-1`}>
          <Slot />
        </div>
        <div className={`${weaponSize} row-start-2 row-span-2 relative group`}>
          {(() => {
            const item = equipment?.weapon1;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${ringAmmySize} row-start-4 relative group`}>
          {(() => {
            const item = equipment?.ring1;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-1 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${helmGloveBootSize} row-start-5 relative group`}>
          {(() => {
            const item = equipment?.gloves;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        {/* Column 2 */}
        <div className={`${helmGloveBootSize} row-start-1 relative group`}>
          {(() => {
            const item = equipment?.helm;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${bodySize} row-start-2 row-span-3 relative group`}>
          {(() => {
            const item = equipment?.bodyArmor;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${beltSize} row-start-5 relative group`}>
          {(() => {
            const item = equipment?.belt;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-1 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        {/* Column 3 */}
        <div className={`${ringAmmySize} row-start-1 relative group`}>
          {(() => {
            const item = equipment?.amulet;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-1 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${weaponSize} row-start-2 row-span-2 relative group`}>
          {(() => {
            const item = equipment?.weapon2;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${ringAmmySize} row-start-4 relative group`}>
          {(() => {
            const item = equipment?.ring2;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-1 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
        <div className={`${helmGloveBootSize} row-start-5 relative group`}>
          {(() => {
            const item = equipment?.boots;
            if (!item) return <Slot />;
            const borderColorClass = getRarityClassText(item.rarity)
              .replace("text-", "border-")
              .replace("-400", "-500")
              .replace("-500", "-600");
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <>
                <Slot
                  borderColorClassName={borderColorClass}
                  innerGlowClassName={innerGlowClass}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center p-2 pointer-events-none`}
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      unoptimized
                    />
                  </div>
                </Slot>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 border border-gray-600 shadow-lg">
                  <ItemTooltipContent item={item} />
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

// Export with the InventoryDisplay name
export default InventoryDisplay;
