// Utils for area logic, boss, effects, floating numbers
import { MapLocation, EnemyInstance, HitEffectType } from "@/types/gameData";

export function isTown(area: MapLocation | null): boolean {
  return area?.id === "cidade_principal";
}

export function isAreaComplete(
  area: MapLocation | null,
  currentEnemy: EnemyInstance | null,
  enemiesKilledCount: number,
  killsToComplete: number,
  showBossAreaComplete: boolean
): boolean {
  const town = isTown(area);
  return !town && (
    currentEnemy?.isBoss
      ? showBossAreaComplete
      : killsToComplete > 0 && enemiesKilledCount >= killsToComplete
  );
}

export function getBossPhase(currentEnemy: EnemyInstance | null, bossEncounterPhase: string) {
  if (!currentEnemy) return "none";
  if (currentEnemy.isBoss && bossEncounterPhase === "none") return "sprite";
  // ...expand as needed
  return bossEncounterPhase;
}

export function playBossSpawnEffects(enemyTypeData: unknown, triggerScreenShake: () => void, enemyContainerRef: React.RefObject<HTMLDivElement | null>) {
  if ((enemyTypeData as { spawnSoundPath?: string })?.spawnSoundPath) {
    // playSound((enemyTypeData as { spawnSoundPath?: string }).spawnSoundPath); // Import playSound where needed
    triggerScreenShake();
  }
  if (enemyContainerRef.current) {
    enemyContainerRef.current.classList.remove("enemy-spawn-initial");
    enemyContainerRef.current.classList.add("enemy-spawn-visible");
  }
}

export function getShakeKeyframes() {
  return {
    x: [0, -5, 5, -5, 5, -3, 3, -2, 2, 0],
    transition: { duration: 0.3, ease: "easeInOut" as const },
  };
}

export function getScreenShakeKeyframes() {
  return {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    y: [0, 4, -4, 3, -3, 2, -2, 0],
    transition: { duration: 0.8, ease: "easeInOut" as const },
  };
}

export function getSimplifiedHitType(type: HitEffectType) {
  return type.type === "slash" || type.type === "pierce" || type.type === "hit"
    ? "physical"
    : "elemental";
}

export function getRandomFloatingPosition() {
  return {
    x: 15 + (Math.random() * 10 - 5),
    y: 75 + (Math.random() * 10 - 5),
  };
}

export function getRandomId() {
  return crypto.randomUUID();
} 