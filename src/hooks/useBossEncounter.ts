import { useState, useEffect } from "react";
import { EnemyInstance } from "@/types/gameData";
import { playSound } from "../utils/soundUtils";
import { enemyTypes } from "@/types/gameData";

export type BossPhase = "none" | "sprite" | "nameAndHp" | "complete";

interface Params {
  currentEnemy: EnemyInstance | null;
  enemyContainerRef: React.RefObject<HTMLDivElement | null>;
  setIsBossSpawning: (v: boolean) => void;
  triggerScreenShake: () => void;
}

export const useBossEncounter = ({
  currentEnemy,
  enemyContainerRef,
  setIsBossSpawning,
  triggerScreenShake,
}: Params) => {
  const [bossEncounterPhase, setBossEncounterPhase] = useState<BossPhase>("none");
  const [isBossEncounter, setIsBossEncounter] = useState(false);

  useEffect(() => {
    if (currentEnemy && !currentEnemy.isDying) {
      const isBoss = currentEnemy.isBoss ?? false;
      setIsBossEncounter(isBoss);

      if (isBoss && bossEncounterPhase === "none") {
        // PAUSE combat while intro plays
        setIsBossSpawning(true);
        setBossEncounterPhase("sprite");

        const enemyTypeData = enemyTypes.find((e) => e.id === currentEnemy.typeId);
        if (enemyTypeData?.spawnSoundPath) {
          playSound(enemyTypeData.spawnSoundPath);
          triggerScreenShake();
        }

        // show sprite (remove invisible class)
        if (enemyContainerRef.current) {
          enemyContainerRef.current.classList.remove("enemy-spawn-initial");
          enemyContainerRef.current.classList.add("enemy-spawn-visible");
        }

        // Phase transitions
        setTimeout(() => setBossEncounterPhase("nameAndHp"), 2000);
        setTimeout(() => {
          setBossEncounterPhase("complete");
          setIsBossSpawning(false); // UNPAUSE
        }, 3000);
      } else if (!isBoss) {
        setBossEncounterPhase("none");
        // regular enemy: quick spawn animation
        setTimeout(() => {
          if (enemyContainerRef.current) {
            enemyContainerRef.current.classList.remove("enemy-spawn-initial");
            enemyContainerRef.current.classList.add("enemy-spawn-visible");
          }
        }, 50);
      }
    }
  }, [currentEnemy, bossEncounterPhase, enemyContainerRef, setIsBossSpawning, triggerScreenShake]);

  // Reset when enemy dies or changes
  useEffect(() => {
    if (!currentEnemy || currentEnemy.isDying) {
      setBossEncounterPhase("none");
      setIsBossEncounter(false);
    }
  }, [currentEnemy?.instanceId, currentEnemy?.isDying]);

  return { isBossEncounter, bossEncounterPhase };
}; 