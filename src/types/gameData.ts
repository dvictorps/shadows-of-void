// src/types/gameData.ts

import { FaHome, FaTree, FaMountain, FaWater, FaCrosshairs } from 'react-icons/fa'; // Example Icons

// Define possible character classes
export type CharacterClass =
  | "Guerreiro"
  | "Ladino"
  | "Mago"

// Define the structure for a character
export interface Character {
  id: number;
  name: string;
  class: CharacterClass;
  level: number; // Max Level 100
  currentXP: number; // Current XP towards next level
  currentAct: number; // Current act player is in
  currentAreaId: string; // ID of the specific area within the act
  unlockedAreaIds: string[]; // IDs of areas player has access to

  // Defensive Stats
  armor: number;
  evasion: number;
  barrier: number; // Or maybe energy shield?
  blockChance: number; // Percentage (Max 75%)
  maxHealth: number;
  currentHealth: number;

  // Resistances (Percentage - Max 75% each)
  fireResistance: number;
  coldResistance: number;
  lightningResistance: number;
  voidResistance: number;

  // Offensive Stats (Assuming base values/modifiers)
  attackDamage: number;
  projectileDamage: number;
  spellDamage: number;
  fireDamage: number;
  coldDamage: number;
  lightningDamage: number;
  voidDamage: number;

  // inventory: InventoryItem[]; // Add later if needed
  // skills: Skill[]; // Add later if needed
  // Add other relevant fields like experience, currency, etc.
}

// Define the structure for a map location
export interface MapLocation {
  id: string; // Unique identifier for the area (e.g., 'cidade_principal')
  name: string; // Display name (e.g., "Cidade Principal")
  description: string; // Text box content
  act: number; // Which act this location belongs to
  position: { top: string; left: string }; // CSS position (e.g., '70%', '20%')
  icon?: React.ComponentType<{ className?: string }>; // Optional: React icon component
  connections: string[]; // IDs of directly connected locations
  // Add other fields like available quests, monster levels, etc. later
}

// Define the structure for overall game data
export interface OverallGameData {
  currencies: {
    ruby: number;
    sapphire: number;
    voidCrystals: number;
  };
  lastPlayedCharacterId: number | null; // Optional: track last selected
  // Add other global fields later (settings, unlocked features, etc.)
}

// Default values when no data is found in localStorage
export const defaultOverallData: OverallGameData = {
  currencies: {
    ruby: 0,
    sapphire: 0,
    voidCrystals: 0,
  },
  lastPlayedCharacterId: null,
};

export const defaultCharacters: Character[] = [];

// Define Act 1 Locations
export const act1Locations: MapLocation[] = [
  {
    id: "cidade_principal",
    name: "Cidade Principal",
    description: "A última fortaleza da civilização neste ato.",
    act: 1,
    position: { top: "70%", left: "20%" },
    icon: FaHome,
    connections: ["floresta_sombria"],
  },
  {
    id: "floresta_sombria",
    name: "Floresta Sombria",
    description: "Uma floresta antiga e perigosa.",
    act: 1,
    position: { top: "50%", left: "50%" },
    icon: FaTree,
    connections: ["cidade_principal", "colinas_ecoantes"],
  },
  {
    id: "colinas_ecoantes",
    name: "Colinas Ecoantes",
    description: "Ventos uivantes carregam segredos antigos.",
    act: 1,
    position: { top: "30%", left: "30%" },
    icon: FaMountain,
    connections: ["floresta_sombria", "rio_esquecido"],
  },
  {
    id: "rio_esquecido",
    name: "Rio Esquecido",
    description: "Águas turvas escondem perigos submersos.",
    act: 1,
    position: { top: "65%", left: "75%" },
    icon: FaWater,
    connections: ["colinas_ecoantes", "acampamento_cacadores"],
  },
  {
    id: "acampamento_cacadores",
    name: "Acampamento de Caçadores",
    description: "Um pequeno refúgio para batedores experientes.",
    act: 1,
    position: { top: "40%", left: "80%" },
    icon: FaCrosshairs,
    connections: ["rio_esquecido"], // End of this path for now
  },
]; 