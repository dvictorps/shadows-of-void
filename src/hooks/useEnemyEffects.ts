import { useState, useCallback } from "react";
import { useAnimation } from "framer-motion";
import { HitEffectType } from "@/types/gameData";

interface HitEffectItem {
  id: number;
  type: "physical" | "elemental";
}

export const useEnemyEffects = () => {
  const [hitEffects, setHitEffects] = useState<HitEffectItem[]>([]);
  const [spriteFlash, setSpriteFlash] = useState(false);

  const shakeControls = useAnimation();
  const screenShakeControls = useAnimation();

  const triggerScreenShake = useCallback(() => {
    const shakeKeyframes = {
      x: [0, -8, 8, -6, 6, -3, 3, 0],
      y: [0, 4, -4, 3, -3, 2, -2, 0],
      transition: { duration: 0.8, ease: "easeInOut" as const },
    };
    screenShakeControls.start(shakeKeyframes);
  }, [screenShakeControls]);

  const handleShowHitEffect = useCallback((type: HitEffectType) => {
    const newId = Date.now();
    const simplifiedType =
      type.type === "slash" || type.type === "pierce" || type.type === "hit"
        ? "physical"
        : "elemental";

    setHitEffects((prev) => [...prev, { id: newId, type: simplifiedType }]);
    setSpriteFlash(true);
    setTimeout(() => setSpriteFlash(false), 120);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== newId));
    }, 500);
  }, []);

  const handleTriggerEnemyShake = useCallback(() => {
    shakeControls.start({
      x: [0, -5, 5, -5, 5, -3, 3, -2, 2, 0],
      transition: { duration: 0.3, ease: "easeInOut" },
    });
    setTimeout(() => shakeControls.stop(), 300);
  }, [shakeControls]);

  return {
    hitEffects,
    spriteFlash,
    shakeControls,
    screenShakeControls,
    handleShowHitEffect,
    handleTriggerEnemyShake,
    triggerScreenShake,
  };
}; 