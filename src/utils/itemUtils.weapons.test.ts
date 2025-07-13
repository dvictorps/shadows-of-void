import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modifier, ItemRarity } from '../types/gameData';
import * as ItemsData from '../data/items';
import { generateModifiers, PREFIX_MODIFIERS, SUFFIX_MODIFIERS } from './itemUtils';
import { vi } from 'vitest';

// Mock data para armas
const mockItemBasesForTest: ItemsData.BaseItemTemplate[] = [
    { baseId: 'test_weapon_t1', name: 'Test Weapon T1', itemType: 'OneHandedSword', icon: '', baseMinDamage: 10, baseMaxDamage: 20, baseAttackSpeed: 1.0, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'starter_2h_sword_base', name: 'Starter Sword', itemType: 'TwoHandedSword', icon: '', baseMinDamage: 3, baseMaxDamage: 6, baseAttackSpeed: 0.8, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 1, requirements: { level: 1 }, allowedModifiers: [] }
];

interface MockBaseItemInput {
    baseId?: string;
    name?: string;
    itemType: string;
    icon?: string;
    baseMinDamage?: number;
    baseMaxDamage?: number;
    baseAttackSpeed?: number;
    baseCriticalStrikeChance?: number;
}
const createMockBaseItemForModifiers = (input: MockBaseItemInput) => ({
    id: 'temp_id',
    rarity: 'Normal' as ItemRarity,
    baseId: input.baseId ?? 'default_base',
    name: input.name ?? 'Default Item',
    itemType: input.itemType,
    icon: input.icon ?? '',
    baseMinDamage: input.baseMinDamage,
    baseMaxDamage: input.baseMaxDamage,
    baseAttackSpeed: input.baseAttackSpeed,
    baseCriticalStrikeChance: input.baseCriticalStrikeChance,
    baseBlockChance: undefined,
    requirements: undefined,
    classification: undefined,
});

let allItemsBasesSpy: vi.SpyInstance;
beforeEach(() => {
    allItemsBasesSpy = vi.spyOn(ItemsData, 'ALL_ITEM_BASES', 'get').mockReturnValue(mockItemBasesForTest);
    vi.clearAllMocks();
});
afterEach(() => {
    allItemsBasesSpy.mockRestore();
    vi.restoreAllMocks();
});

describe('generateModifiers para armas físicas', () => {
    it('should generate 1 prefix or 1 suffix for Mágico rarity (case 1 mod)', () => {
        const baseItem = createMockBaseItemForModifiers({ itemType: 'OneHandedSword' });
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.4)
          .mockReturnValueOnce(0.4);
        const mods = generateModifiers(baseItem, 'Mágico', 10);
        expect(mods).toHaveLength(1);
        vi.restoreAllMocks();
    });
    it('should generate 1 prefix and 1 suffix for Mágico rarity (case 2 mods)', () => {
        const baseItem = createMockBaseItemForModifiers({ itemType: 'OneHandedSword' });
        let mods: Modifier[] = [];
        for (let i=0; i < 50 && mods.length !== 2; i++) { 
          mods = generateModifiers(baseItem, 'Mágico', 10);
        }
        expect(mods).toHaveLength(2);
        const prefixes = mods.filter(m => m && m.type && PREFIX_MODIFIERS.has(m.type));
        const suffixes = mods.filter(m => m && m.type && SUFFIX_MODIFIERS.has(m.type));
        expect(prefixes.length).toBe(1);
        expect(suffixes.length).toBe(1);
    });
}); 