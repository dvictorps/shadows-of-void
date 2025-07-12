import { renderHook, act } from "@testing-library/react";
import { vi, expect, it, describe } from "vitest";
import { useFloatingRubyText } from "../useFloatingRubyText";

// Mock crypto.randomUUID in node environment
vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });

describe("useFloatingRubyText", () => {
  it("should set and auto-clear floatingRubyChange", () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useFloatingRubyText());

    // Initially null
    expect(result.current.floatingRubyChange).toBeNull();

    act(() => {
      result.current.displayFloatingRubyChange(42, "gain");
    });

    expect(result.current.floatingRubyChange).toEqual({
      value: 42,
      type: "gain",
      id: "uuid-1",
    });

    // Advance timers beyond 1.2s to auto-clear
    act(() => {
      vi.advanceTimersByTime(1300);
    });

    expect(result.current.floatingRubyChange).toBeNull();

    vi.useRealTimers();
  });
}); 