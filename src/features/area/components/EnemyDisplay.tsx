import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence, Variants, useAnimation } from "framer-motion";
import Image from "next/image";
import { EnemyInstance, EnemyDamageType } from "@/types/gameData";

interface HitEffectItem {
  id: number;
  type: "physical" | "elemental";
}

interface EnemyDisplayProps {
  currentEnemy: EnemyInstance | null;
  hitEffects: HitEffectItem[];
  spriteFlash: boolean;
  shakeControls: ReturnType<typeof useAnimation>;
  enemyContainerRef: React.RefObject<HTMLDivElement | null>;
  isBossEncounter: boolean;
  bossEncounterPhase: "none" | "sprite" | "nameAndHp" | "complete";
}

const EnemyDisplay: React.FC<EnemyDisplayProps> = ({
  currentEnemy,
  hitEffects,
  spriteFlash,
  shakeControls,
  enemyContainerRef,
  isBossEncounter,
  bossEncounterPhase,
}) => {
  // Early return when there is no current enemy (parent shows placeholder)
  if (!currentEnemy) {
    return <p className="text-gray-500">Procurando inimigos...</p>;
  }

  const enemyHealthPercentage = (currentEnemy.currentHealth / currentEnemy.maxHealth) * 100;

  const hitEffectVariants: Variants = {
    initial: { opacity: 0, scale: 0.6 },
    animate: {
      opacity: [1, 1, 0],
      scale: [1, 1.15, 1.2],
      transition: { duration: 0.25, times: [0, 0.6, 1], ease: "easeOut" },
    },
  };

  const spriteScaleClass = currentEnemy.isBoss
    ? "scale-[2.26] group-hover:scale-[2.5]"
    : "scale-[1.1] group-hover:scale-[1.2]";

  const getDamageTypeDisplayName = (type: EnemyDamageType): string => {
    switch (type) {
      case "physical":
        return "Físico";
      case "cold":
        return "Frio";
      case "void":
        return "Vazio";
      case "fire":
        return "Fogo";
      case "lightning":
        return "Raio";
      default:
        return type;
    }
  };

  return (
    <Tooltip.Provider delayDuration={100}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.div
            className="text-center relative z-0"
            ref={enemyContainerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: currentEnemy && !currentEnemy.isDying ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Enemy Name */}
            {(!isBossEncounter || bossEncounterPhase === "nameAndHp" || bossEncounterPhase === "complete") && (
              <motion.p
                layout="position"
                className={`relative z-20 text-lg font-medium ${isBossEncounter ? "mb-20 text-red-400" : "mb-2 text-white"}`}
                initial={isBossEncounter ? { opacity: 0, y: -10 } : undefined}
                animate={isBossEncounter ? { opacity: 1, y: 0 } : undefined}
                transition={isBossEncounter ? { duration: 0.8, ease: "easeOut" } : undefined}
              >
                {currentEnemy.name} (Nv. {currentEnemy.level})
              </motion.p>
            )}

            {/* Sprite + Hit Effects */}
            <motion.div
              layout="position"
              className="relative text-6xl my-4 h-48 w-48 mx-auto flex items-center justify-center"
              animate={shakeControls}
            >
              {/* Hit Effects Layer */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <AnimatePresence>
                  {hitEffects.map((effect) => (
                    <motion.div
                      key={effect.id}
                      className="absolute w-16 h-16"
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={hitEffectVariants}
                      style={{ left: `calc(50% - 2rem)`, top: `calc(50% - 2rem)` }}
                    >
                      {effect.type === "physical" ? (
                        <Image
                          src="/sprites/effects/slash.png"
                          alt="Physical Hit Effect"
                          width={50}
                          height={50}
                          className="absolute inset-0 m-auto w-full h-full object-contain pointer-events-none"
                          style={{ transform: `rotate(${Math.random() * 360}deg)` }}
                        />
                      ) : (
                        <Image
                          src="/assets/icons/elemental_hit.svg"
                          alt="Elemental Hit Effect"
                          width={50}
                          height={50}
                          className="absolute inset-0 m-auto w-full h-full object-contain pointer-events-none"
                        />
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Sprite / Emoji */}
              <motion.div className="relative w-full h-full flex items-center justify-center" animate={shakeControls}>
                {currentEnemy.iconPath ? (
                  <Image
                    src={currentEnemy.iconPath}
                    alt={currentEnemy.name}
                    fill
                    className={`object-contain mx-auto transition-transform ${currentEnemy.typeId === "ice_dragon_boss" ? "boss-sprite-ice-blue" : ""} ${spriteScaleClass} ${spriteFlash ? "flash-red" : ""}`}
                  />
                ) : (
                  <span
                    className={`text-6xl mx-auto transition-transform ${spriteScaleClass} ${spriteFlash ? "flash-red" : ""}`}
                    role="img"
                    aria-label={currentEnemy.name}
                  >
                    {currentEnemy.emoji}
                  </span>
                )}
              </motion.div>
            </motion.div>

            {/* Health Bar & Text */}
            {(!isBossEncounter || bossEncounterPhase === "nameAndHp" || bossEncounterPhase === "complete") && (
              <motion.div
                layout="position"
                className="relative z-20"
                initial={isBossEncounter ? { opacity: 0, y: 10 } : undefined}
                animate={isBossEncounter ? { opacity: 1, y: 0 } : undefined}
                transition={isBossEncounter ? { duration: 0.8, ease: "easeOut", delay: 0.2 } : undefined}
              >
                <div className={`w-full bg-gray-700 rounded h-4 border border-gray-500 overflow-hidden ${isBossEncounter ? "mt-20" : ""} mb-1`}>
                  <div
                    className="bg-red-600 h-full transition-width duration-150 ease-linear"
                    style={{ width: `${enemyHealthPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-300 mb-4">
                  {currentEnemy.currentHealth} / {currentEnemy.maxHealth}
                </p>
              </motion.div>
            )}
          </motion.div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-gray-900 text-white text-sm px-2 py-1 rounded shadow-lg border border-gray-600 z-50" sideOffset={5}>
            {`Tipo de Dano: ${getDamageTypeDisplayName(currentEnemy.damageType)}`}
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default EnemyDisplay; 