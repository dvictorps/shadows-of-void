import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useTravelHandlers } from "../useTravelHandlers";
import { EquippableItem } from "../../types/gameData";
import React from "react";

// Mock next/router navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Minimal EquippableItem stub
const mockItem: EquippableItem = {
  id: "item1",
  baseId: "base",
  name: "Test Item",
  rarity: "Normal",
  itemType: "Helm",
  icon: "icon",
  baseArmor: 1,
  requirements: { level: 1 },
  modifiers: [],
  implicitModifier: null,
};

describe("useTravelHandlers", () => {
  it("triggerConfirmDiscard should call handleConfirmDiscard with item", () => {
    const confirmDiscard = vi.fn();

    const { result } = renderHook(() =>
      useTravelHandlers({
        currentView: "worldMap",
        isTraveling: false,
        displayPersistentMessage: vi.fn(),
        handleConfirmDiscard: confirmDiscard,
        itemToDiscard: mockItem,
        effectiveStats: null,
        updateCharacterStore: vi.fn(),
        saveCharacterStore: vi.fn(),
        setCurrentView: vi.fn(),
        activeCharacter: null,
        setCurrentArea: vi.fn(),
        setIsTraveling: vi.fn(),
        setTravelProgress: vi.fn(),
        setTravelTargetAreaId: vi.fn(),
        travelTimerRef: { current: null } as React.MutableRefObject<NodeJS.Timeout | null>,
        travelStartTimeRef: { current: null } as React.MutableRefObject<number | null>,
        travelTargetIdRef: { current: null } as React.MutableRefObject<string | null>,
        setCurrentEnemy: vi.fn(),
        setEnemiesKilledCount: vi.fn(),
        enemySpawnCooldownRef: { current: 0 } as React.MutableRefObject<number>,
        pendingDropCount: 0,
        openDropModalForCollection: vi.fn(),
      })
    );

    act(() => {
      result.current.triggerConfirmDiscard();
    });

    expect(confirmDiscard).toHaveBeenCalledWith(mockItem);
  });
}); 