import { v4 as uuidv4 } from 'uuid';
import { EquippableItem, Modifier, ModifierType, ItemRarity } from '../types/gameData';
import { ALL_ITEM_BASES, BaseItemTemplate } from '../data/items';
import { MODIFIER_RANGES } from '../constants/modifierRanges';
import { getBiasedRandomInt } from './modifierGeneration';
import { generateModifiers, getItemTierInfo } from './itemGeneration';

export function generateDrop(
  monsterLevel: number,
  forceItemType?: string,
  forcedRarity?: ItemRarity,
  forcedBossId?: string
): EquippableItem | null {
  // Filtrar bases elegíveis
  const possibleBaseItems = ALL_ITEM_BASES.filter(base =>
    base.baseId !== 'starter_2h_sword_base' &&
    base.minLevel <= monsterLevel &&
    (base.maxLevel === undefined || monsterLevel <= base.maxLevel) &&
    (!forceItemType || base.itemType === forceItemType) &&
    (!base.bossDropOnly)
  );

  // Drop único de boss
  if (forcedRarity === 'Único' && forcedBossId) {
    const uniqueBase = ALL_ITEM_BASES.find(
      b => b.bossDropOnly && b.bossDropId === forcedBossId && b.baseId === forceItemType
    );
    if (uniqueBase) {
      return {
        ...(JSON.parse(JSON.stringify(uniqueBase))),
        id: uuidv4(),
        rarity: 'Único',
        modifiers: [
          { type: ModifierType.LifeLeech, value: 20 },
          { type: ModifierType.ReducedLifeLeechRecovery, value: 20 },
        ],
        implicitModifier: null,
        name: uniqueBase.name,
        requirements: {
          ...(uniqueBase.requirements),
          level: monsterLevel
        },
        uniqueText: uniqueBase.uniqueText,
      };
    }
    return null;
  }

  if (!possibleBaseItems.length) {
    return null;
  }

  // Selecionar base
  const selectedBaseTemplate = possibleBaseItems[Math.floor(Math.random() * possibleBaseItems.length)];
  const itemLevel = monsterLevel;
  const rarity = forcedRarity ?? determineRarity(itemLevel);

  // Gerar modificador implícito
  let implicitMod: Modifier | null = null;
  const templateWithPool = selectedBaseTemplate as BaseItemTemplate;
  if (templateWithPool.implicitModifierPool && templateWithPool.implicitModifierPool.length > 0) {
    const pool = templateWithPool.implicitModifierPool;
    const totalWeight = pool.reduce((sum: number, mod: { type: ModifierType; weight: number; }) => sum + mod.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    let chosenImplicitType: ModifierType | null = null;
    for (const modOption of pool) {
      randomWeight -= modOption.weight;
      if (randomWeight <= 0) {
        chosenImplicitType = modOption.type;
        break;
      }
    }
    if (chosenImplicitType) {
      const tierInfo = getItemTierInfo(itemLevel);
      const baseRange = MODIFIER_RANGES[chosenImplicitType]?.[tierInfo.index];
      if (baseRange) {
        const biasFactor = Math.max(0, Math.min(1, (itemLevel - tierInfo.start) / Math.max(1, tierInfo.end - tierInfo.start)));
        const minValue = baseRange.valueMin;
        const maxValue = baseRange.valueMax;
        if ([ModifierType.AddsFlatPhysicalDamage, ModifierType.AddsFlatFireDamage, ModifierType.AddsFlatColdDamage, ModifierType.AddsFlatLightningDamage, ModifierType.AddsFlatVoidDamage].includes(chosenImplicitType)) {
          const rolledMin = getBiasedRandomInt(minValue, maxValue, biasFactor);
          const rolledMax = getBiasedRandomInt(minValue, maxValue, biasFactor);
          implicitMod = {
            type: chosenImplicitType,
            valueMin: Math.min(rolledMin, rolledMax),
            valueMax: Math.max(rolledMin, rolledMax)
          };
        } else {
          const value = getBiasedRandomInt(minValue, maxValue, biasFactor);
          implicitMod = { type: chosenImplicitType, value };
        }
      }
    }
  }

  // Gerar modificadores explícitos
  const modifiers = generateModifiers(
    {
      baseId: selectedBaseTemplate.baseId,
      name: selectedBaseTemplate.name,
      itemType: selectedBaseTemplate.itemType,
      icon: selectedBaseTemplate.icon,
      baseArmor: selectedBaseTemplate.baseArmor,
      baseEvasion: selectedBaseTemplate.baseEvasion,
      baseBarrier: selectedBaseTemplate.baseBarrier,
      baseAttackSpeed: selectedBaseTemplate.baseAttackSpeed,  
      baseCriticalStrikeChance: selectedBaseTemplate.baseCriticalStrikeChance,
      baseBlockChance: selectedBaseTemplate.baseBlockChance,
      requirements: selectedBaseTemplate.requirements,
      classification: selectedBaseTemplate.classification,
      minLevel: selectedBaseTemplate.minLevel,
      allowedModifiers: selectedBaseTemplate.allowedModifiers,
      // rarity: 'Normal', // Removido para evitar erro de tipo
    },
    rarity,
    itemLevel
  );

  // Construir item final
  const newItem: EquippableItem = {
    ...(JSON.parse(JSON.stringify(selectedBaseTemplate))),
    id: uuidv4(),
    rarity,
    modifiers,
    implicitModifier: implicitMod,
    name: `${rarity !== 'Normal' ? `${rarity} ` : ''}${selectedBaseTemplate.name}`,
    requirements: {
      ...(selectedBaseTemplate.requirements),
      level: monsterLevel
    }
  };

  return newItem;
}

function determineRarity(itemLevel: number): ItemRarity {
  const roll = Math.random();
  let legendaryChance = 0.01;
  if (itemLevel >= 75) {
    legendaryChance = 0.15;
  } else if (itemLevel >= 50) {
    legendaryChance = 0.05;
  }
  if (roll < legendaryChance) return 'Lendário';
  const remainingProb = 1.0 - legendaryChance;
  const rareChanceBase = itemLevel >= 25 ? 0.20 : 0.10;
  const magicChanceBase = 0.50;
  const rareChanceAbsolute = remainingProb * rareChanceBase;
  const magicChanceAbsolute = remainingProb * magicChanceBase;
  if (roll < legendaryChance + rareChanceAbsolute) return 'Raro';
  if (roll < legendaryChance + rareChanceAbsolute + magicChanceAbsolute) return 'Mágico';
  return 'Normal';
} 