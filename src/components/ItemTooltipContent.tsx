"use client";

import React from "react";
import {
  EquippableItem,
  ModifierType,
  PREFIX_MODIFIERS,
} from "../types/gameData";
import {
  calculateItemDisplayStats,
  calculateItemArmor,
  calculateItemEvasion,
  calculateItemBarrier,
} from "../utils/statUtils";
import {
  getRarityTextColorClass,
  MODIFIER_DISPLAY_ORDER,
  getModifierText,
  ONE_HANDED_WEAPON_TYPES,
  TWO_HANDED_WEAPON_TYPES,
} from "../utils/itemUtils";

interface ItemTooltipContentProps {
  item: EquippableItem;
}

const ItemTooltipContent: React.FC<ItemTooltipContentProps> = ({ item }) => {
  const {
    finalMinDamage,
    finalMaxDamage,
    finalAttackSpeed,
    finalFireMin,
    finalFireMax,
    finalColdMin,
    finalColdMax,
    finalLightningMin,
    finalLightningMax,
    finalVoidMin,
    finalVoidMax,
    finalCritChance,
  } = calculateItemDisplayStats(item);

  // Sort modifiers for display using the imported order
  const sortedModifiers = item.modifiers.slice().sort((a, b) => {
    const aIsPrefix = PREFIX_MODIFIERS.has(a.type);
    const bIsPrefix = PREFIX_MODIFIERS.has(b.type);

    // Prefix comes before suffix
    if (aIsPrefix && !bIsPrefix) return -1;
    if (!aIsPrefix && bIsPrefix) return 1;

    // Sort within group using defined order
    const orderA = MODIFIER_DISPLAY_ORDER[a.type as ModifierType] ?? 999;
    const orderB = MODIFIER_DISPLAY_ORDER[b.type as ModifierType] ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Tier sorting as fallback within the same group/order
    return (a.tier ?? 99) - (b.tier ?? 99);
  });

  // Calculate final item armor, evasion, and barrier
  const finalItemArmor =
    item.baseArmor !== undefined ? calculateItemArmor(item) : null;
  const finalItemEvasion =
    item.baseEvasion !== undefined ? calculateItemEvasion(item) : null;
  const finalItemBarrier =
    item.baseBarrier !== undefined ? calculateItemBarrier(item) : null;

  // <<< ADD Check if item is a weapon >>>
  const isWeapon =
    ONE_HANDED_WEAPON_TYPES.has(item.itemType) ||
    TWO_HANDED_WEAPON_TYPES.has(item.itemType);

  return (
    <>
      {/* Item Name */}
      <p className={`font-bold ${getRarityTextColorClass(item.rarity)} mb-1`}>
        {item.name}
      </p>
      {/* --- Add Separator Line --- */}
      <hr className="border-gray-600 my-1" />
      {/* -------------------------- */}

      {/* Display Base Defensive Stats */}
      {finalItemArmor !== null && (
        <p className="text-gray-300">Armadura: {finalItemArmor}</p>
      )}
      {finalItemEvasion !== null && finalItemEvasion > 0 && (
        <p className="text-gray-300">Evasão: {finalItemEvasion}</p>
      )}
      {finalItemBarrier !== null && finalItemBarrier > 0 && (
        <p className="text-gray-300">Barreira: {finalItemBarrier}</p>
      )}

      {/* <<< UPDATE Conditional Display for Weapon Stats >>> */}
      {isWeapon &&
        (finalMinDamage > 0 ||
          finalMaxDamage > 0 ||
          finalFireMin > 0 ||
          finalColdMin > 0 ||
          finalLightningMin > 0 ||
          finalVoidMin > 0) && (
          <>
            {/* Add divider only if base def stats were shown */}
            {(finalItemArmor !== null ||
              finalItemEvasion !== null ||
              finalItemBarrier !== null) && (
              <hr className="border-gray-600 my-1" />
            )}
            {(finalMinDamage > 0 || finalMaxDamage > 0) && (
              <p className="text-gray-300">
                Dano Físico: {finalMinDamage} - {finalMaxDamage}
              </p>
            )}
            {/* --- ADD Colored Elemental Damage Lines --- */}
            {(finalFireMin > 0 || finalFireMax > 0) && (
              <p className="text-orange-400">
                {" "}
                {/* PoE Fire Color */}
                Dano de Fogo: {finalFireMin} - {finalFireMax}
              </p>
            )}
            {(finalColdMin > 0 || finalColdMax > 0) && (
              <p className="text-cyan-400">
                {" "}
                {/* PoE Cold Color */}
                Dano de Frio: {finalColdMin} - {finalColdMax}
              </p>
            )}
            {(finalLightningMin > 0 || finalLightningMax > 0) && (
              <p className="text-yellow-300">
                {" "}
                {/* PoE Lightning Color */}
                Dano de Raio: {finalLightningMin} - {finalLightningMax}
              </p>
            )}
            {(finalVoidMin > 0 || finalVoidMax > 0) && (
              <p className="text-purple-400">
                {" "}
                {/* PoE Chaos/Void Color */}
                Dano de Vazio: {finalVoidMin} - {finalVoidMax}
              </p>
            )}
            {/* --- END Elemental Damage Lines --- */}
            <p className="text-gray-300 mb-1">
              Vel. Ataque: {finalAttackSpeed.toFixed(2)}
            </p>
            <p className="text-gray-300 mb-1">
              Chance de Crítico: {finalCritChance.toFixed(2)}%
            </p>
          </>
        )}

      {/* --- Implicit Modifier Display --- */}
      {item.implicitModifier && (
        <>
          {/* Add divider only if base stats (Armor/Eva/Barrier) were shown */}
          {(item.baseArmor !== undefined ||
            item.baseEvasion !== undefined ||
            item.baseBarrier !== undefined) && (
            <hr className="border-gray-600 my-1" />
          )}
          <p className="text-white">{getModifierText(item.implicitModifier)}</p>
        </>
      )}
      {/* ------------------------------- */}

      {/* Divider before explicit mods - Show if implicit exists OR base stats (Armor/Eva/Barrier) exist */}
      {(item.implicitModifier ||
        item.baseArmor !== undefined ||
        item.baseEvasion !== undefined ||
        item.baseBarrier !== undefined) &&
        sortedModifiers.length > 0 && <hr className="border-gray-600 my-1" />}

      {/* Modifiers (Explicit) */}
      {sortedModifiers.map((mod, index) => (
        <p key={`${item.id}-mod-${index}`} className="text-blue-300">
          {getModifierText(mod)}
        </p>
      ))}

      {/* Divider if both explicit mods and requirements exist */}
      {sortedModifiers.length > 0 &&
        item.requirements &&
        Object.keys(item.requirements).length > 0 && (
          <hr className="border-gray-600 my-1" />
        )}

      {/* Requirements LAST */}
      {item.requirements && (
        <div className="mt-1">
          <p className="text-gray-400 text-xs">Requerimentos:</p>
          {item.requirements.strength && (
            <p className="text-gray-400 text-xs ml-2">
              - Força: {item.requirements.strength}
            </p>
          )}
          {item.requirements.dexterity && (
            <p className="text-gray-400 text-xs ml-2">
              - Destreza: {item.requirements.dexterity}
            </p>
          )}
          {item.requirements.intelligence && (
            <p className="text-gray-400 text-xs ml-2">
              - Inteligência: {item.requirements.intelligence}
            </p>
          )}
          {item.requirements.level && (
            <p className="text-gray-400 text-xs ml-2">
              - Nível: {item.requirements.level}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default ItemTooltipContent;
