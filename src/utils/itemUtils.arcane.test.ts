import { generateDrop } from './itemUtils';
import { ModifierType } from '../types/gameData';
import { ALL_ITEM_BASES } from '../data/items';
import { describe, it, expect } from 'vitest';

const ARCANE_MODS = [
  ModifierType.AddsFlatSpellFireDamage,
  ModifierType.AddsFlatSpellColdDamage,
  ModifierType.AddsFlatSpellLightningDamage,
  ModifierType.AddsFlatSpellVoidDamage,
  ModifierType.IncreasedSpellDamage,
];
const ATTACK_MODS = [
  ModifierType.AddsFlatPhysicalDamage,
  ModifierType.AddsFlatFireDamage,
  ModifierType.AddsFlatColdDamage,
  ModifierType.AddsFlatLightningDamage,
  ModifierType.AddsFlatVoidDamage,
  ModifierType.IncreasedPhysicalDamage,
];

function runArcaneItemTest(itemType: 'Wand' | 'Staff' | 'Tome') {
  it(`deve gerar pelo menos um mod arcano (flat ou increased) e cast speed em ${itemType}, e nunca mods de ataque físico/elemental`, () => {
    const monsterLevel = 15;
    const tries = 200;
    const bases = ALL_ITEM_BASES.filter(b => b.itemType === itemType);
    expect(bases.length).toBeGreaterThan(0);
    const base = bases.find(b => b.minLevel <= monsterLevel && (!b.maxLevel || monsterLevel <= b.maxLevel));
    expect(base).toBeTruthy();
    const allMods: ModifierType[] = [];
    for (let i = 0; i < tries; i++) {
      const item = generateDrop(monsterLevel, itemType, 'Raro');
      if (item) allMods.push(...item.modifiers.map(m => m.type));
    }
    // Pelo menos um mod arcano (flat ou increased) e um cast speed
    const hasArcane = allMods.some(type => ARCANE_MODS.includes(type));
    const hasCastSpeed = allMods.includes(ModifierType.IncreasedCastSpeed);
    if (!hasArcane || !hasCastSpeed) {
      // Log detalhado para debug
      console.error(`Mods gerados para ${itemType}:`, allMods);
    }
    expect(hasArcane).toBe(true);
    expect(hasCastSpeed).toBe(true);
    // NUNCA pode ter mods de ataque físico/elemental
    const hasAttackMod = allMods.some(type => ATTACK_MODS.includes(type));
    if (hasAttackMod) {
      console.error(`Mods de ataque indevidos encontrados em ${itemType}:`, allMods.filter(type => ATTACK_MODS.includes(type)));
    }
    expect(hasAttackMod).toBe(false);
  });
}

describe('Geração de mods arcanos em itens mágicos (parametrizado)', () => {
  runArcaneItemTest('Wand');
  runArcaneItemTest('Staff');
  runArcaneItemTest('Tome');
}); 