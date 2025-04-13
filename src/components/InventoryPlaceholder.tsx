"use client"; // If Slot might use hooks later or for consistency

import React from "react";

// Simplified Slot component (defined within InventoryPlaceholder)
const Slot = ({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    className={`
      border border-gray-600
      flex items-center justify-center
      text-[10px] text-gray-500
      w-full h-full /* Let container div handle size */
      ${className}
    `}
  >
    {children}
  </div>
);

const InventoryPlaceholder: React.FC = () => {
  // Define sizes
  const weaponSize = "w-24 h-44";
  const bodySize = "w-32 h-48";
  const helmGloveBootSize = "w-24 h-24";
  const ringAmmySize = "w-10 h-10";
  const beltSize = "w-32 h-12"; // Restored Belt Size

  return (
    // Main inventory container - Restore border
    <div className="border border-white p-2 flex flex-col gap-2 flex-grow items-center">
      {/* Equipment Slots Grid - Auto columns, 5 rows, COLUMN flow */}
      <div className="grid grid-flow-col grid-rows-5 auto-cols-max gap-x-1 gap-y-1 place-items-center w-auto mb-2 h-full">
        {/* Column 1 Content */}
        <div className={`${helmGloveBootSize} row-start-1`}></div>{" "}
        {/* Transparent Placeholder */}
        <div className={`${weaponSize} row-start-2 row-span-2`}>
          <Slot></Slot>
        </div>{" "}
        {/* R2, R3 */}
        <div className={`${ringAmmySize} row-start-4`}>
          <Slot></Slot>
        </div>{" "}
        {/* R4 */}
        <div className={`${helmGloveBootSize} row-start-5`}>
          <Slot></Slot>
        </div>{" "}
        {/* R5 - Gloves */}
        {/* Column 2 Content */}
        <div className={`${helmGloveBootSize} row-start-1`}>
          <Slot></Slot>
        </div>{" "}
        {/* R1 */}
        <div className={`${bodySize} row-start-2 row-span-3`}>
          <Slot></Slot>
        </div>{" "}
        {/* R2, R3, R4 */}
        <div className={`${beltSize} row-start-5`}>
          <Slot></Slot>
        </div>{" "}
        {/* R5 - Belt */}
        {/* Column 3 Content */}
        <div className={`${ringAmmySize} row-start-1`}>
          <Slot></Slot>
        </div>{" "}
        {/* R1 */}
        <div className={`${weaponSize} row-start-2 row-span-2`}>
          <Slot></Slot>
        </div>{" "}
        {/* R2, R3 */}
        <div className={`${ringAmmySize} row-start-4`}>
          <Slot></Slot>
        </div>{" "}
        {/* R4 */}
        <div className={`${helmGloveBootSize} row-start-5`}>
          <Slot></Slot>
        </div>{" "}
        {/* R5 - Boots */}
      </div>
      {/* Keep Flask/Backpack section separate if needed later */}
      {/* <div className="border border-white w-full p-2 flex flex-row gap-1 mt-auto items-start">
            <div className={`w-8 ${flaskSize}`}><Slot>Flask 1</Slot></div>
            <div className={`w-8 ${flaskSize}`}><Slot>Flask 2</Slot></div>
            <div className={`flex-grow ${backpackMinHeight}`}><Slot>Backpack Area</Slot></div>
          </div> */}
    </div>
  );
};

export default InventoryPlaceholder; // Export the component
