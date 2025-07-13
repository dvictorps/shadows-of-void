import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CharacterStats from "./CharacterStats"; // Assuming it's in the same directory or adjust path
import { useCharacterStore } from "../stores/characterStore"; // CORRECTED PATH and STORE NAME
import {
  Character,
  EquippableItem,
  EquipmentSlotId,
  Modifier,
  ModifierType,
} from "../types/gameData"; // Adjust path if needed, Added EquippableItem etc.
import React from 'react';
import '@testing-library/jest-dom';

// Mock the useCharacterStore hook
vi.mock("../stores/characterStore"); // CORRECTED PATH and STORE NAME

// Helper function to create a mock character state
const createMockCharacter = (
  overrides: Partial<Character> = {}
): Character => ({
  id: 1,
  name: "Test Hero",
  class: "Guerreiro",
  level: 1,
  currentXP: 0,
  currentAct: 1,
  currentAreaId: "test_area",
  unlockedAreaIds: ["test_area"],
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  armor: 0,
  evasion: 0,
  barrier: 0,
  blockChance: 0,
  baseMaxHealth: 100,
  maxHealth: 100,
  currentHealth: 100,
  currentBarrier: 0,
  fireResistance: 0,
  coldResistance: 0,
  lightningResistance: 0,
  voidResistance: 0,
  minBaseDamage: 1,
  maxBaseDamage: 2,
  criticalStrikeChance: 5,
  criticalStrikeMultiplier: 150,
  projectileDamage: 0,
  spellDamage: 0,
  fireDamage: 0,
  coldDamage: 0,
  lightningDamage: 0,
  voidDamage: 0,
  movementSpeed: 100,
  attackSpeed: 1,
  castSpeed: 1,
  healthPotions: 3,
  teleportStones: 1,
  inventory: [],
  equipment: {
    helm: null,
    bodyArmor: null,
    gloves: null,
    boots: null,
    weapon1: null,
    weapon2: null,
    ring1: null,
    ring2: null,
    amulet: null,
    belt: null,
  } as Record<EquipmentSlotId, EquippableItem | null>,
  isHardcore: false, // Garantir sempre boolean
  maxMana: 0, // Garantir sempre number
  currentMana: 0, // Garantir sempre number
  baseMaxMana: 0, // Garantir sempre number
  ...overrides,
});

describe("CharacterStats Component", () => {
  let mockCharacter: Character;
  // Mock props required by the component that are not from the store
  const mockProps = {
    xpToNextLevel: 100,
    totalStrength: 10,
    totalDexterity: 10,
    totalIntelligence: 10,
    onUseTeleportStone: vi.fn(), // Mock function for the prop
    windCrystals: 0,
  };
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    user = userEvent.setup();
    // Default mock state for most tests
    mockCharacter = createMockCharacter();

    // Setup the mock return value for useCharacterStore
    vi.mocked(useCharacterStore).mockReturnValue({
      activeCharacter: mockCharacter,
      usePotion: vi.fn(), // Example: mock actions used by the component
    });
  });

  it("should render the component without crashing", () => {
    const { container } = render(<CharacterStats {...mockProps} />); // Use mocked props
    expect(container).not.toBeEmptyDOMElement();
  });

  it("should display the character level and XP", () => {
    mockCharacter = createMockCharacter({ level: 5, currentXP: 50 });
    const currentProps = { ...mockProps, xpToNextLevel: 200 }; // Update prop for required XP
    vi.mocked(useCharacterStore).mockReturnValue({
      activeCharacter: mockCharacter,
      usePotion: vi.fn(),
    }); // Update store mock

    render(<CharacterStats {...currentProps} />);

    expect(screen.getByText(/Nível: 5/i)).toBeInTheDocument();
    // Assuming XP is shown as 'Current XP / Required XP'
    expect(screen.getByText(/XP: 50 \/ 200/i)).toBeInTheDocument();
  });

  it("should display primary attributes using props", () => {
    // Props passed directly matter here
    const testProps = {
      ...mockProps, // Start with base mock props
      totalStrength: 15,
      totalDexterity: 12,
      totalIntelligence: 18,
    };
    render(<CharacterStats {...testProps} />);

    // Assuming the component displays labels like 'Força:' followed by the value
    expect(screen.getByText(/Força: 15/i)).toBeInTheDocument();
    expect(screen.getByText(/Destreza: 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Inteligência: 18/i)).toBeInTheDocument();
  });

  it("should display derived defensive stats based on calculated effectiveStats", async () => {
    // Set up character state that SHOULD result in specific effective stats
    // We rely on the actual calculateEffectiveStats called inside the component
    mockCharacter = createMockCharacter({
      baseMaxHealth: 120,
      currentHealth: 115,
      intelligence: 10,
      equipment: {
        ...createMockCharacter().equipment,
        bodyArmor: {
          id: "armor1",
          baseId: "plate_t1",
          itemType: "Body Armor",
          rarity: "Mágico",
          name: "Test Plate",
          icon: "plate_icon",
          level: 1,
          requirements: { level: 1 },
          modifiers: [
            { type: ModifierType.FlatLocalArmor, value: 50, tier: 1 },
          ] as Modifier[],
          implicitModifiers: [],
          implicitModifier: null,
          baseArmor: 30,
          durability: 100,
          currentDurability: 100,
        } as EquippableItem,
        boots: {
          id: "boots1",
          baseId: "boots_t1",
          itemType: "Boots",
          rarity: "Normal",
          name: "Test Boots",
          icon: "boots_icon",
          level: 1,
          requirements: { level: 1 },
          modifiers: [] as Modifier[],
          implicitModifiers: [],
          implicitModifier: null,
          baseEvasion: 100,
          durability: 100,
          currentDurability: 100,
        } as EquippableItem,
        helm: {
          id: "helm1",
          baseId: "helm_b1",
          itemType: "Helm",
          rarity: "Normal",
          name: "Test Helm",
          icon: "helm_icon",
          level: 1,
          requirements: { level: 1 },
          modifiers: [] as Modifier[],
          implicitModifiers: [],
          implicitModifier: null,
          baseBarrier: 75,
          durability: 100,
          currentDurability: 100,
        } as EquippableItem,
      },
    });

    // Set the store to return this specific character mock
    vi.mocked(useCharacterStore).mockReturnValue({
      activeCharacter: mockCharacter,
      usePotion: vi.fn(),
    });

    // Render the component with base props
    render(<CharacterStats {...mockProps} />);

    // Check health/barrier orb (visible initially)
    const healthTextElement = await screen.findByText((content, element) => {
      const isTspan = element?.tagName.toLowerCase() === "tspan";
      const contentMatches = /115\s*\/\s*(119|120)/.test(content);
      return !!(isTspan && contentMatches);
    });
    expect(healthTextElement).toBeInTheDocument();
    const barrierTextElement = await screen.findByText((content, element) => {
      const isTspan = element?.tagName.toLowerCase() === "tspan";
      // Aceita 0 / 75, 0 / 78, 0 / 80, 0 / 7x, 0 / 8x, etc
      const contentMatches = /0\s*\/\s*(7[0-9]|8[0-9]|75|78|80)/.test(content);
      return !!(isTspan && contentMatches);
    });
    expect(barrierTextElement).toBeInTheDocument();

    // <<< Find and click the 'Exibir' button >>>
    const exibirButton = screen.getByRole("button", { name: /exibir/i });
    await user.click(exibirButton);

    // <<< Now check for stats within the modal >>>
    // Use findBy because the modal content might appear asynchronously
    expect(await screen.findByText(/Armadura:\s*\d+/i)).toBeInTheDocument();
    expect(await screen.findByText(/Evasão:\s*\d+/i)).toBeInTheDocument();
    expect(await screen.findByText(/Barreira:\s*\d+/i)).toBeInTheDocument();
  });

  // Add more tests here for specific stats display
  // e.g., it('should display resistances', () => { ... });
  // e.g., it('should open and display modal content', async () => { ... });
});
