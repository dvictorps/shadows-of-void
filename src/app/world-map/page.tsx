"use client";

import React, { useState } from "react";
import { FaHome, FaMapMarkerAlt } from "react-icons/fa"; // Icons for map

// Placeholder component for the Inventory section (PoE Style - Revert to Attempt 21)
const InventoryPlaceholder: React.FC = () => {
  // Simplified Slot component
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

  // Define sizes
  const weaponSize = "w-24 h-44";
  const bodySize = "w-32 h-48";
  const helmGloveBootSize = "w-24 h-24";
  const ringAmmySize = "w-10 h-10";
  const beltSize = "w-32 h-12"; // Restored Belt Size
  // Removed flaskSize as it's not used in equipment grid

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

// Placeholder component for Character Stats
const CharacterStats: React.FC = () => {
  const charName = "Php"; // Placeholder
  const charClass = "Guerreiro"; // Placeholder
  const level = 1;
  const currentXp = 0;
  const xpToNextLevel = 100;
  const xpPercentage = (currentXp / xpToNextLevel) * 100;

  // Placeholder stats
  const stats = {
    armadura: 0,
    evasao: 0,
    chanceBlock: 0,
    chanceEvadir: 0,
    reducaoDano: 0,
    dpsEstimado: 0,
    resFogo: 0,
    resGelo: 0,
    resRaio: 0,
    resVoid: 0,
  };

  return (
    // Restore border, ensure text-[10px], ensure no internal borders
    <div className="border border-white p-4 flex flex-col text-[10px]">
      {/* Name and Class - No bottom border */}
      <div className="flex justify-between mb-2 pb-1">
        {" "}
        <span className="font-semibold">{charName}</span>
        <span>{charClass}</span>
      </div>

      {/* Level and XP Bar - Adjust size */}
      <div className="mb-3">
        <span className="block">Lvl {level}</span> {/* Use block for spacing */}
        <div className="w-full bg-gray-700 rounded h-1.5 border border-gray-500 overflow-hidden mt-1">
          <div
            className="bg-white h-full transition-all duration-300 ease-linear"
            style={{ width: `${xpPercentage}%` }}
          ></div>
        </div>
        <span className="text-[10px] text-gray-400 block text-right">
          {currentXp} / {xpToNextLevel} XP
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 flex-grow leading-tight">
        {" "}
        {/* Reduced gap/leading */}
        <span>Armadura: {stats.armadura}</span>
        <span>Chance Evadir: {stats.chanceEvadir}%</span> {/* Shortened */}
        <span>Evasão: {stats.evasao}</span>
        <span>Redução Dano: {stats.reducaoDano}%</span> {/* Shortened */}
        <span>Chance Block: {stats.chanceBlock}%</span>
        <span>DPS Estimado: {stats.dpsEstimado}</span>
        {/* Resistances Title - No top border */}
        <span className="col-span-2 mt-1 pt-0.5 font-semibold">
          Resistências:
        </span>
        <span>Fogo: {stats.resFogo}%</span>
        <span>Gelo: {stats.resGelo}%</span>
        <span>Raio: {stats.resRaio}%</span>
        <span>Void: {stats.resVoid}%</span>
      </div>
    </div>
  );
};

export default function WorldMapPage() {
  const [textBoxContent, setTextBoxContent] = useState("...");

  const handleMouseEnterLocation = (description: string) => {
    setTextBoxContent(description);
  };

  const handleMouseLeaveLocation = () => {
    setTextBoxContent("...");
  };

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-2rem)] bg-black text-white gap-x-2">
        {/* Left Section (Map + Text Box) */}
        <div className="flex flex-col w-full md:w-2/3">
          {/* Map Area - Add back mb-2 */}
          <div
            className="border border-white flex-grow p-10 relative mb-2"
            style={{ minHeight: "70vh" }}
          >
            {/* Placeholder Map Elements */}
            {/* City */}
            <div
              className="absolute top-[70%] left-[20%] p-2 border border-white rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
              onMouseEnter={() =>
                handleMouseEnterLocation("Cidade Principal - Ato 1")
              }
              onMouseLeave={handleMouseLeaveLocation}
            >
              <FaHome className="text-xl" />
            </div>
            {/* Forest (Current Location) - Add yellow border */}
            <div
              className="absolute top-[50%] left-[50%] p-2 border border-yellow-400 rounded-full cursor-pointer hover:bg-gray-800 transition-colors"
              onMouseEnter={() =>
                handleMouseEnterLocation("Floresta Sombria - Ato 1")
              }
              onMouseLeave={handleMouseLeaveLocation}
            >
              <div className="w-4 h-4 rounded-full bg-transparent"></div>
              {/* Adjust icon margin and color */}
              <FaMapMarkerAlt className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-lg text-yellow-400" />
            </div>
            {/* Dashed line connecting city and forest */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: -1 }} // Place behind interactive elements
            >
              <line
                x1="25%" // Approx City center x
                y1="72%" // Approx City center y
                x2="52%" // Approx Forest center x
                y2="52%" // Approx Forest center y
                stroke="white"
                strokeWidth="1"
                strokeDasharray="4 4" // Dashed line pattern
              />
            </svg>
          </div>

          {/* Text Box Area - Fix Double Border */}
          {/* Outer div needs full border and padding */}
          <div className="h-[100px] md:h-[150px] border border-white p-1 bg-black">
            {/* Inner div has ring, no border */}
            <div className="ring-1 ring-inset ring-white ring-offset-1 ring-offset-black h-full w-full p-3 font-sans overflow-y-auto">
              {/* Removed redundant dots */}
              {textBoxContent}
            </div>
          </div>
        </div>

        {/* Right Sidebar (Inventory + Stats) */}
        <div className="w-full md:w-1/3 flex flex-col">
          {/* Remove border from this wrapper */}
          <div className="h-full flex flex-col">
            {/* InventoryPlaceholder should already have its border from previous partial edit */}
            <InventoryPlaceholder />
            <div className="mt-2">
              <CharacterStats />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
