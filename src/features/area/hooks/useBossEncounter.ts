import { useState, useEffect } from "react";
import { EnemyInstance } from "@/types/gameData";
import { playSound } from "@/utils/soundUtils";
import { enemyTypes } from "@/types/gameData";
import { getBossPhase, playBossSpawnEffects } from "@/utils/areaUtils";

export type BossPhase = "none" | "sprite" | "nameAndHp" | "complete";

interface Params {
  currentEnemy: EnemyInstance | null;
  enemyContainerRef: React.RefObject<HTMLDivElement | null>;
  triggerScreenShake: () => void;
}

export const useBossEncounter = ({
  currentEnemy,
  enemyContainerRef,
  triggerScreenShake,
}: Params) => {
  const [bossEncounterPhase, setBossEncounterPhase] = useState<BossPhase>("none");
  const [isBossEncounter, setIsBossEncounter] = useState(false);

  useEffect(() => {
    if (currentEnemy && !currentEnemy.isDying) {
      const isBoss = currentEnemy.isBoss ?? false;
      setIsBossEncounter(isBoss);

      if (isBoss && bossEncounterPhase === "none") {
        setBossEncounterPhase(getBossPhase(currentEnemy, bossEncounterPhase) as BossPhase);
        const enemyTypeData = enemyTypes.find((e) => e.id === currentEnemy.typeId);
        // Play sound immediately as sprite starts fading in
        if (enemyTypeData?.spawnSoundPath) playSound(enemyTypeData.spawnSoundPath);
        playBossSpawnEffects(enemyTypeData, triggerScreenShake, enemyContainerRef);
        // 1. Wait for sprite fade-in (e.g., 700ms)
        setTimeout(() => {
          // 2. Wait a bit more, then show name/HP bar (e.g., 400ms)
          setTimeout(() => {
            setBossEncounterPhase("nameAndHp");
            // 3. Wait, then set to complete (e.g., 1000ms)
        setTimeout(() => {
          setBossEncounterPhase("complete");
            }, 1000);
          }, 400);
        }, 700);
      } else if (!isBoss) {
        setBossEncounterPhase("none");
        setTimeout(() => {
          if (enemyContainerRef.current) {
            enemyContainerRef.current.classList.remove("enemy-spawn-initial");
            enemyContainerRef.current.classList.add("enemy-spawn-visible");
          }
        }, 50);
      }
    }
  }, [currentEnemy, bossEncounterPhase, enemyContainerRef, triggerScreenShake]);

  // Reset when enemy dies or changes
  useEffect(() => {
    if (!currentEnemy || currentEnemy.isDying) {
      setBossEncounterPhase("none");
      setIsBossEncounter(false);
    }
  }, [currentEnemy?.instanceId, currentEnemy?.isDying]);

  return { isBossEncounter, bossEncounterPhase, setBossEncounterPhase };
}; 