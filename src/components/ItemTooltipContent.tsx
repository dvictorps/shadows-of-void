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
    isSpellWeapon,
    finalMinPhys,
    finalMaxPhys,
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
      {/* Exibir % de block padrão se for escudo */}
      {item.itemType === 'Shield' && item.baseBlockChance !== undefined && (
        <p className="text-yellow-300">Chance de Block: {item.baseBlockChance}%</p>
      )}

      {/* <<< UPDATE Conditional Display for Weapon Stats >>> */}
      {isWeapon && (finalMinDamage > 0 || finalMaxDamage > 0) && (
        <>
          {(finalItemArmor !== null ||
            finalItemEvasion !== null ||
            finalItemBarrier !== null) && (
            <hr className="border-gray-600 my-1" />
          )}
          {/* Dano físico e elementais juntos no bloco principal */}
          {!isSpellWeapon && (
            <>
              <p className="text-gray-300">
                Dano Físico: {finalMinPhys} - {finalMaxPhys}
              </p>
              {finalFireMin > 0 || finalFireMax > 0 ? (
                <p className="text-orange-400">Dano de Fogo: {finalFireMin} - {finalFireMax}</p>
              ) : null}
              {finalColdMin > 0 || finalColdMax > 0 ? (
                <p className="text-cyan-400">Dano de Frio: {finalColdMin} - {finalColdMax}</p>
              ) : null}
              {finalLightningMin > 0 || finalLightningMax > 0 ? (
                <p className="text-yellow-300">Dano de Raio: {finalLightningMin} - {finalLightningMax}</p>
              ) : null}
              {finalVoidMin > 0 || finalVoidMax > 0 ? (
                <p className="text-purple-400">Dano de Vazio: {finalVoidMin} - {finalVoidMax}</p>
              ) : null}
              <p className="text-gray-300 mb-1">
                Vel. Ataque: {finalAttackSpeed.toFixed(2)}
              </p>
              <p className="text-gray-300 mb-1">
                Chance de Crítico: {finalCritChance.toFixed(2)}%
              </p>
            </>
          )}
          {isSpellWeapon && (
            <p className="text-gray-300">
              Dano de Magia: {finalMinDamage} - {finalMaxDamage}
            </p>
          )}
        </>
      )}
      {/* --- ADD Colored Elemental Damage Lines for non-weapons only --- */}
      {/* Removido: não exibir linhas coloridas para itens não-armas, apenas como mod */}
      {/* --- END Elemental Damage Lines --- */}

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

      {/* Exibir regeneração de mana se o item conceder (explícito ou implícito) */}
      {(() => {
        let flatMana = 0;
        let percentMana = 0;
        sortedModifiers.forEach((mod) => {
          if (mod.type === ModifierType.FlatManaRegen) flatMana += mod.value ?? 0;
          if (mod.type === ModifierType.PercentManaRegen) percentMana += mod.value ?? 0;
        });
        if (item.implicitModifier) {
          if (item.implicitModifier.type === ModifierType.FlatManaRegen) flatMana += item.implicitModifier.value ?? 0;
          if (item.implicitModifier.type === ModifierType.PercentManaRegen) percentMana += item.implicitModifier.value ?? 0;
        }
        if (flatMana > 0 || percentMana > 0) {
          return (
            <div className="mt-1 text-cyan-300">
              {flatMana > 0 && <div>Regeneração de Mana: +{flatMana}/s</div>}
              {percentMana > 0 && <div>Regeneração de Mana: +{percentMana}%/s</div>}
            </div>
          );
        }
        return null;
      })()}

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

      {/* Texto especial para itens únicos */}
      {item.uniqueText && (
        <div className="mt-2 text-xs text-orange-900 italic text-center">
          {item.uniqueText}
        </div>
      )}
    </>
  );
};

export default ItemTooltipContent;
