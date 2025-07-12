import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import useAreaCombatState from "../useAreaCombatState";

describe("useAreaCombatState", () => {
  it("should initialise with correct default values and allow updates", () => {
    const { result } = renderHook(() => useAreaCombatState());

    // Initial defaults
    expect(result.current.currentEnemy).toBeNull();
    expect(result.current.enemiesKilledCount).toBe(0);
    expect(result.current.isNextAttackMainHand).toBe(true);
    expect(result.current.isBossSpawning).toBe(false);

    // Update kill count
    act(() => {
      result.current.setEnemiesKilledCount(7);
    });
    expect(result.current.enemiesKilledCount).toBe(7);

    // Toggle hand flag
    act(() => {
      result.current.setIsNextAttackMainHand(false);
    });
    expect(result.current.isNextAttackMainHand).toBe(false);
  });
}); 