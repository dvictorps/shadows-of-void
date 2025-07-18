import { describe, it, expect } from 'vitest';
import { generateModifiers } from './itemGeneration';
import { ALL_ITEM_BASES } from '../data/items';
import { ModifierType } from '../types/gameData';

describe('itemGeneration - mods arcanos em barrier_gloves_t1 e knowledge_amulet_t1', () => {
  it('barrier_gloves_t1 pode rolar mods de flat damage de spells', () => {
    const base = ALL_ITEM_BASES.find(b => b.baseId === 'barrier_gloves_t1');
    expect(base).toBeDefined();
    let found = false;
    for (let i = 0; i < 30; i++) {
      const mods = generateModifiers(base!, 'Mágico', 10);
      if (mods.some(m => [
        ModifierType.AddsFlatSpellFireDamage,
        ModifierType.AddsFlatSpellColdDamage,
        ModifierType.AddsFlatSpellLightningDamage,
        ModifierType.AddsFlatSpellVoidDamage
      ].includes(m.type))) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('knowledge_amulet_t1 pode rolar mods de flat damage de spells', () => {
    const base = ALL_ITEM_BASES.find(b => b.baseId === 'knowledge_amulet_t1');
    expect(base).toBeDefined();
    let found = false;
    for (let i = 0; i < 30; i++) {
      const mods = generateModifiers(base!, 'Mágico', 10);
      if (mods.some(m => [
        ModifierType.AddsFlatSpellFireDamage,
        ModifierType.AddsFlatSpellColdDamage,
        ModifierType.AddsFlatSpellLightningDamage,
        ModifierType.AddsFlatSpellVoidDamage
      ].includes(m.type))) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
}); 