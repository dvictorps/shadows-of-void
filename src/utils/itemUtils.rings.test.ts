import { describe, it, expect } from 'vitest';
import { ModifierType } from '../types/gameData';
import { ALL_ITEM_BASES } from '../data/items';
import { generateDrop } from './itemUtils';

describe('Geração de implicito em novas bases de anéis (ALL_ITEM_BASES real)', () => {
  it('Anel de Fogo deve sortear IncreasedCastSpeed ou AddsFlatSpellFireDamage como implicito', () => {
    const fireRingBase = ALL_ITEM_BASES.find(b => b.baseId === 'fire_ring_t1');
    expect(fireRingBase).toBeTruthy();
    const found = new Set<ModifierType>();
    for (let i = 0; i < 100; i++) {
      const drop = generateDrop(1, 'Ring');
      if (drop?.baseId === 'fire_ring_t1' && drop.implicitModifier) {
        found.add(drop.implicitModifier.type);
      }
      if (found.size === 2) break;
    }
    expect(found.has(ModifierType.IncreasedCastSpeed)).toBe(true);
    expect(found.has(ModifierType.AddsFlatSpellFireDamage)).toBe(true);
  });

  it('Anel do Oculto deve sortear todos os implicitos possíveis', () => {
    const skullRingBase = ALL_ITEM_BASES.find(b => b.baseId === 'skull_ring_t1');
    expect(skullRingBase).toBeTruthy();
    const expected = new Set([
      ModifierType.IncreasedCastSpeed,
      ModifierType.IncreasedSpellDamage,
      ModifierType.AddsFlatSpellFireDamage,
      ModifierType.AddsFlatSpellColdDamage,
      ModifierType.AddsFlatSpellLightningDamage,
      ModifierType.AddsFlatSpellVoidDamage,
    ]);
    const found = new Set<ModifierType>();
    for (let i = 0; i < 300; i++) {
      const drop = generateDrop(1, 'Ring');
      if (drop?.baseId === 'skull_ring_t1' && drop.implicitModifier) {
        found.add(drop.implicitModifier.type);
      }
      if (expected.size === found.size) break;
    }
    for (const mod of expected) {
      expect(found.has(mod)).toBe(true);
    }
  });
}); 