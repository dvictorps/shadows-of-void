import { renderHook, act } from "@testing-library/react";
import { Character, OverallGameData } from '../../types/gameData';
import { describe, it, expect, vi } from "vitest";
import { useVendorActions } from "../useVendorActions";

describe("useVendorActions", () => {
  const baseParams = {
    activeCharacter: { currentAreaId: "cidade_principal" } as Partial<Character>,
    overallData: null as OverallGameData | null,
    updateCharacterStore: vi.fn(),
    saveCharacterStore: vi.fn(),
    saveOverallDataState: vi.fn(),
    displayTemporaryMessage: vi.fn(),
    displayFloatingRubyChange: vi.fn(),
  };

  it("should control vendor modal open/close state", () => {
    const { result } = renderHook(() => useVendorActions(baseParams));

    expect(result.current.isVendorModalOpen).toBe(false);

    act(() => {
      result.current.handleOpenVendorModal();
    });
    expect(result.current.isVendorModalOpen).toBe(true);

    act(() => {
      result.current.handleCloseVendorModal();
    });
    expect(result.current.isVendorModalOpen).toBe(false);
  });
}); 