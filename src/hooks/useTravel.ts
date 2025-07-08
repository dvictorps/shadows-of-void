import { useState, useRef, useCallback, useEffect } from "react";

interface UseTravelReturn {
  isTraveling: boolean;
  progress: number;
  targetAreaId: string | null;
  startTravel: (
    targetId: string,
    durationMs: number,
    onComplete: (finalTargetId: string) => void
  ) => void;
  cancelTravel: () => void;
}

/**
 * Generic travel helper that manages progress over a given duration.
 * Consumers control side-effects through the onComplete callback.
 */
export const useTravel = (): UseTravelReturn => {
  const [isTraveling, setIsTraveling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetAreaId, setTargetAreaId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);
  const onCompleteRef = useRef<((id: string) => void) | null>(null);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Begins a travel timer. If another travel is active it will be cancelled.
   */
  const startTravel = useCallback(
    (
      targetId: string,
      durationMs: number,
      onComplete: (finalTargetId: string) => void
    ) => {
      cleanupTimer();
      setIsTraveling(true);
      setProgress(0);
      setTargetAreaId(targetId);

      startTimeRef.current = Date.now();
      durationRef.current = Math.max(1, durationMs);
      onCompleteRef.current = onComplete;

      timerRef.current = setInterval(() => {
        if (!startTimeRef.current) return;
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min((elapsed / durationRef.current) * 100, 100);
        setProgress(pct);
        if (pct >= 100) {
          const finalId = targetId;
          cleanupTimer();
          setIsTraveling(false);
          setProgress(0);
          setTargetAreaId(null);
          onCompleteRef.current?.(finalId);
        }
      }, 50);
    },
    [cleanupTimer]
  );

  const cancelTravel = useCallback(() => {
    cleanupTimer();
    setIsTraveling(false);
    setProgress(0);
    setTargetAreaId(null);
    startTimeRef.current = null;
  }, [cleanupTimer]);

  // Ensure timer cleared on unmount
  useEffect(() => {
    return cleanupTimer;
  }, [cleanupTimer]);

  return { isTraveling, progress, targetAreaId, startTravel, cancelTravel };
}; 