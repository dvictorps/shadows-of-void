import { useState, useCallback } from "react";
import { useAnimation } from "framer-motion";
import { HitEffectType } from "@/types/gameData";
import { getShakeKeyframes, getScreenShakeKeyframes, getSimplifiedHitType } from "@/utils/areaUtils";

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
    screenShakeControls.start(getScreenShakeKeyframes());
  }, [screenShakeControls]);

  const handleShowHitEffect = useCallback((type: HitEffectType) => {
    const newId = Date.now();
    const simplifiedType = getSimplifiedHitType(type);
    setHitEffects((prev) => [...prev, { id: newId, type: simplifiedType }]);
    setSpriteFlash(true);
    setTimeout(() => setSpriteFlash(false), 120);
    setTimeout(() => {
      setHitEffects((prev) => prev.filter((e) => e.id !== newId));
    }, 500);
  }, []);

  const handleTriggerEnemyShake = useCallback(() => {
    shakeControls.start(getShakeKeyframes());
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