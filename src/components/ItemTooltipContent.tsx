"use client";

import React from "react";
import {
  EquippableItem,
  ModifierType,
  PREFIX_MODIFIERS,
} from "../types/gameData";
import { calculateItemDisplayStats } from "../utils/statUtils";
import {
  getRarityTextColorClass,
  MODIFIER_DISPLAY_ORDER,
} from "../utils/itemUtils";

interface ItemTooltipContentProps {
  item: EquippableItem;
}

// Helper function to render a single modifier line
const renderModifierText = (
  mod: EquippableItem["modifiers"][number],
  itemId: string,
  index: number
): React.ReactNode => {
  let text = "";
  switch (mod.type) {
    case "IncreasedPhysicalDamage":
      text = `+${mod.value}% Dano Físico Aumentado`;
      break;
    case "AddsFlatPhysicalDamage":
      text = `Adiciona ${mod.valueMin ?? "?"}-${
        mod.valueMax ?? "?"
      } Dano Físico`;
      break;
    case "AddsFlatFireDamage":
      text = `Adiciona ${mod.valueMin ?? "?"}-${
        mod.valueMax ?? "?"
      } Dano de Fogo`;
      break;
    case "AddsFlatColdDamage":
      text = `Adiciona ${mod.valueMin ?? "?"}-${
        mod.valueMax ?? "?"
      } Dano de Frio`;
      break;
    case "AddsFlatLightningDamage":
      text = `Adiciona ${mod.valueMin ?? "?"}-${
        mod.valueMax ?? "?"
      } Dano de Raio`;
      break;
    case "AddsFlatVoidDamage":
      text = `Adiciona ${mod.valueMin ?? "?"}-${
        mod.valueMax ?? "?"
      } Dano de Vazio`;
      break;
    case "AttackSpeed":
      text = `+${mod.value}% Velocidade de Ataque`;
      break;
    case "IncreasedCriticalStrikeChance":
      text = `+${mod.value}% Chance de Acerto Crítico`;
      break;
    case "IncreasedCriticalStrikeMultiplier":
      text = `+${mod.value}% Multiplicador de Dano Crítico`;
      break;
    case "IncreasedElementalDamage":
      text = `+${mod.value}% Dano Elemental Aumentado`;
      break;
    case "LifeLeech":
      text = `${mod.value}% do Dano de Ataque Físico é Roubado como Vida`;
      break;
    case "Strength":
      text = `+${mod.value} Força`;
      break;
    case "Dexterity":
      text = `+${mod.value} Destreza`;
      break;
    case "Intelligence":
      text = `+${mod.value} Inteligência`;
      break;
    default:
      text = `${mod.type}: ${mod.value}`; // Fallback
  }
  return (
    <p key={`${itemId}-mod-${index}`} className="text-blue-300">
      {text}
    </p>
  );
};

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

  return (
    <>
      {/* Item Name */}
      <p className={`font-bold ${getRarityTextColorClass(item.rarity)} mb-1`}>
        {item.name}
      </p>

      {/* Conditionally Display Weapon Stats */}
      {(item.baseMinDamage !== undefined ||
        item.baseMaxDamage !== undefined) && (
        <>
          <p className="text-gray-300">
            Dano Físico: {finalMinDamage} - {finalMaxDamage}
          </p>
          {(finalFireMin > 0 || finalFireMax > 0) && (
            <p className="text-orange-400">
              Dano de Fogo: {finalFireMin} - {finalFireMax}
            </p>
          )}
          {(finalColdMin > 0 || finalColdMax > 0) && (
            <p className="text-cyan-400">
              Dano de Frio: {finalColdMin} - {finalColdMax}
            </p>
          )}
          {(finalLightningMin > 0 || finalLightningMax > 0) && (
            <p className="text-yellow-300">
              Dano de Raio: {finalLightningMin} - {finalLightningMax}
            </p>
          )}
          {(finalVoidMin > 0 || finalVoidMax > 0) && (
            <p className="text-purple-400">
              Dano de Vazio: {finalVoidMin} - {finalVoidMax}
            </p>
          )}
          <p className="text-gray-300 mb-1">
            Vel. Ataque: {finalAttackSpeed.toFixed(2)}
          </p>
          <p className="text-gray-300 mb-1">
            Chance de Crítico: {finalCritChance.toFixed(2)}%
          </p>
        </>
      )}

      {/* Divider */}
      {(item.requirements || sortedModifiers.length > 0) && (
        <hr className="border-gray-600 my-1" />
      )}

      {/* Requirements */}
      {item.requirements && (
        <div className="mb-1">
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

      {/* Divider if both requirements and modifiers exist */}
      {item.requirements && sortedModifiers.length > 0 && (
        <hr className="border-gray-600 my-1" />
      )}

      {/* All Modifiers */}
      {sortedModifiers.map((mod, index) =>
        renderModifierText(mod, item.id, index)
      )}
    </>
  );
};

export default ItemTooltipContent;
