"use client";

import React from "react";
import Image from "next/image";
import { Character } from "../types/gameData";
import {
  getRarityBorderClass,
  getRarityInnerGlowClass,
} from "../utils/itemUtils";
import ItemTooltipContent from "./ItemTooltipContent";
import * as Tooltip from "@radix-ui/react-tooltip";
import { BsHandbag } from "react-icons/bs";

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
      relative
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
  onOpenInventory: () => void;
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  equipment,
  onOpenInventory,
}) => {
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
          {/* Empty placeholder, no visual slot needed */}
        </div>
        <div className={`${weaponSize} row-start-2 row-span-2`}>
          {(() => {
            const item = equipment?.weapon1;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${weaponSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${ringAmmySize} row-start-4`}>
          {(() => {
            const item = equipment?.ring1;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${ringAmmySize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${helmGloveBootSize} row-start-5`}>
          {(() => {
            const item = equipment?.gloves;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${helmGloveBootSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        {/* Column 2 */}
        <div className={`${helmGloveBootSize} row-start-1`}>
          {(() => {
            const item = equipment?.helm;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${helmGloveBootSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${bodySize} row-start-2 row-span-3`}>
          {(() => {
            const item = equipment?.bodyArmor;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${bodySize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${beltSize} row-start-5`}>
          {(() => {
            const item = equipment?.belt;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${beltSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        {/* Column 3 */}
        <div className={`${ringAmmySize} row-start-1`}>
          {(() => {
            const item = equipment?.amulet;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${ringAmmySize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${weaponSize} row-start-2 row-span-2`}>
          {(() => {
            const item = equipment?.weapon2;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${weaponSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${ringAmmySize} row-start-4`}>
          {(() => {
            const item = equipment?.ring2;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${ringAmmySize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
        <div className={`${helmGloveBootSize} row-start-5`}>
          {(() => {
            const item = equipment?.boots;
            if (!item) return <Slot />;
            const borderColorClass = getRarityBorderClass(item.rarity);
            const innerGlowClass = getRarityInnerGlowClass(item.rarity);
            return (
              <Tooltip.Provider delayDuration={100}>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    className={`${helmGloveBootSize} p-0 border-none bg-transparent appearance-none focus:outline-none`}
                  >
                    <Slot
                      className="w-full h-full"
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
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="w-max max-w-xs p-2 bg-gray-900 text-white text-xs rounded border border-gray-600 shadow-lg z-50"
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
          })()}
        </div>
      </div>
      {/* Backpack Icon Button */}
      <button
        onClick={onOpenInventory}
        className="absolute bottom-2 left-2 p-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
        aria-label="Abrir Inventário"
      >
        <BsHandbag size={24} />
      </button>
    </div>
  );
};

// Export with the InventoryDisplay name
export default InventoryDisplay;
