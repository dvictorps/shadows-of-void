import { useState, useCallback, useEffect } from "react";

export interface FloatingRubyChange {
  value: number;
  type: "gain" | "loss";
  id: string;
}

export function useFloatingRubyText() {
  const [floatingRubyChange, setFloatingRubyChange] = useState<FloatingRubyChange | null>(null);

  const displayFloatingRubyChange = useCallback(
    (value: number, type: "gain" | "loss") => {
      setFloatingRubyChange({ value, type, id: crypto.randomUUID() });
    },
    []
  );

  // Auto clear after 1.2s
  useEffect(() => {
    if (floatingRubyChange) {
      const timer = setTimeout(() => setFloatingRubyChange(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [floatingRubyChange]);

  return { floatingRubyChange, displayFloatingRubyChange } as const;
} 