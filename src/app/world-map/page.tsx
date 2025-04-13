"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Remove map-specific icons from here
// import { FaHome, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import { Character } from "../../types/gameData";
import { loadCharacters } from "../../utils/localStorage";

// Import MapArea component
import MapArea from "../../components/MapArea";
// Import location data
import { act1Locations } from "../../types/gameData"; // Or move data later
import InventoryPlaceholder from "@/components/InventoryPlaceholder";
import CharacterStats from "@/components/CharacterStats";
export default function WorldMapPage() {
  const router = useRouter();
  const [textBoxContent, setTextBoxContent] = useState("...");
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(
    null
  );

  useEffect(() => {
    const characters = loadCharacters();
    // Route guard: Check if characters exist
    if (characters.length === 0) {
      console.log("No characters found, redirecting to character selection.");
      router.push("/characters");
      return; // Stop processing if redirecting
    }

    // Characters exist, load the first one as active
    // Later, you might load based on a stored selected ID
    setActiveCharacter(characters[0]);
  }, [router]); // Add router to dependency array

  const handleMouseEnterLocation = (description: string) => {
    setTextBoxContent(description);
  };

  const handleMouseLeaveLocation = () => {
    setTextBoxContent("...");
  };

  // Function to navigate back to character selection
  const handleBackToCharacters = () => {
    router.push("/characters");
  };

  // Prevent rendering null state briefly during redirect
  if (activeCharacter === null && loadCharacters().length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Loading or redirecting...
      </div>
    ); // Or a loading spinner
  }

  return (
    <div className="p-4 bg-black min-h-screen">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-2rem)] bg-black text-white gap-x-2">
        {/* Left Section (Map + Text Box) */}
        <div className="flex flex-col w-full md:w-2/3">
          {/* Use MapArea Component */}
          <MapArea
            character={activeCharacter}
            locations={act1Locations} // Pass locations for the current act
            onHoverLocation={handleMouseEnterLocation}
            onLeaveLocation={handleMouseLeaveLocation}
            onBackClick={handleBackToCharacters}
          />

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
          <div className="h-full flex flex-col">
            <InventoryPlaceholder />
            <div className="mt-2">
              <CharacterStats character={activeCharacter} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
