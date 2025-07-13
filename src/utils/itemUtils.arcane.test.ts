import { generateDrop } from './itemUtils';
import { ModifierType } from '../types/gameData';
import { ALL_ITEM_BASES } from '../data/items';
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ItemTooltipContent from '../components/ItemTooltipContent';

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

describe('Frequência dos mods arcanos em varinhas mágicas', () => {
  it('deve mostrar a frequência de cada mod arcano em 1000 varinhas mágicas de nível 15', () => {
    const monsterLevel = 15;
    const tries = 1000;
    const modCounts: Record<string, number> = {};
    for (let i = 0; i < tries; i++) {
      const wand = generateDrop(monsterLevel, 'Wand', 'Mágico');
      if (wand) {
        for (const mod of wand.modifiers) {
          modCounts[mod.type] = (modCounts[mod.type] || 0) + 1;
        }
      }
    }
    // Logar o resultado
    console.log('Frequência dos mods em varinhas mágicas:', modCounts);
    // O teste não falha, é só para inspeção
    expect(Object.keys(modCounts).length).toBeGreaterThan(0);
  });
});

describe('Frequência de varinhas mágicas com pelo menos um mod flat arcano', () => {
  it('deve mostrar quantas varinhas mágicas de nível 15 possuem pelo menos um mod flat arcano', () => {
    const monsterLevel = 15;
    const tries = 1000;
    let countWithFlat = 0;
    for (let i = 0; i < tries; i++) {
      const wand = generateDrop(monsterLevel, 'Wand', 'Mágico');
      if (wand) {
        if (wand.modifiers.some(mod =>
          mod.type === ModifierType.AddsFlatSpellFireDamage ||
          mod.type === ModifierType.AddsFlatSpellColdDamage ||
          mod.type === ModifierType.AddsFlatSpellLightningDamage ||
          mod.type === ModifierType.AddsFlatSpellVoidDamage
        )) {
          countWithFlat++;
        }
      }
    }
    console.log('Varinhas mágicas com pelo menos um mod flat arcano:', countWithFlat, 'de', tries);
    expect(countWithFlat).toBeGreaterThan(0);
  });
});

describe('Não deve haver mods explícitos duplicados em tomes mágicos', () => {
  it('não deve gerar dois mods explícitos do mesmo tipo no mesmo tomo', () => {
    const monsterLevel = 15;
    const tries = 1000;
    for (let i = 0; i < tries; i++) {
      const tome = generateDrop(monsterLevel, 'Tome', 'Mágico');
      if (tome) {
        const modTypes = tome.modifiers.map(mod => mod.type);
        const uniqueTypes = new Set(modTypes);
        if (modTypes.length !== uniqueTypes.size) {
          // Logar o item problemático
          console.log('Tomo com mods duplicados:', tome);
          throw new Error('Encontrado tomo com mods explícitos duplicados!');
        }
      }
    }
  });
});