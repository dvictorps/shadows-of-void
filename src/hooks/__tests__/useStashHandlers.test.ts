import { renderHook, act } from "@testing-library/react";
import { Character, OverallGameData } from '../../types/gameData';
import { describe, it, expect, vi } from "vitest";
import { useStashHandlers } from "../useStashHandlers";

describe("useStashHandlers", () => {
  const baseParams = {
    activeCharacter: { currentAreaId: "cidade_principal", inventory: [] } as Partial<Character>,
    overallData: null as OverallGameData | null,
    updateCharacterStore: vi.fn(),
    saveCharacterStore: vi.fn(),
    saveOverallDataState: vi.fn(),
    displayTemporaryMessage: vi.fn(),
  };

  it("should toggle stash modal state", () => {
    const { result } = renderHook(() => useStashHandlers(baseParams));
    expect(result.current.isStashOpen).toBe(false);

    act(() => {
      result.current.handleOpenStash();
    });
    expect(result.current.isStashOpen).toBe(true);

    act(() => {
      result.current.handleCloseStash();
    });
    expect(result.current.isStashOpen).toBe(false);
  });
}); 