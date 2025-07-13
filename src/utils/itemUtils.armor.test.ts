import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModifierType, ItemRarity } from '../types/gameData';
import * as ItemsData from '../data/items';
import { generateModifiers } from './itemUtils';

// Mock data para armaduras
const mockItemBasesForTest: ItemsData.BaseItemTemplate[] = [
    { baseId: 'test_armor_t1', name: 'Test Armor T1', itemType: 'BodyArmor', icon: '', baseArmor: 50, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'test_evasion_t1', name: 'Test Evasion T1', itemType: 'BodyArmor', icon: '', baseEvasion: 75, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'test_barrier_t1', name: 'Test Barrier T1', itemType: 'BodyArmor', icon: '', baseBarrier: 60, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'test_armor_t3', name: 'Test Armor T3', itemType: 'BodyArmor', icon: '', baseArmor: 400, minLevel: 50, requirements: { level: 50 }, allowedModifiers: [] },
];

interface MockBaseItemInput {
    baseId?: string;
    name?: string;
    itemType: string;
    icon?: string;
    baseArmor?: number;
    baseEvasion?: number;
    baseBarrier?: number;
}
const createMockBaseItemForModifiers = (input: MockBaseItemInput) => ({
    id: 'temp_id',
    rarity: 'Normal' as ItemRarity,
    baseId: input.baseId ?? 'default_base',
    name: input.name ?? 'Default Item',
    itemType: input.itemType,
    icon: input.icon ?? '',
    baseArmor: input.baseArmor,
    baseEvasion: input.baseEvasion,
    baseBarrier: input.baseBarrier,
    baseAttackSpeed: undefined,
    baseCriticalStrikeChance: undefined,
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

describe('generateModifiers para armaduras', () => {
    it('should return an empty array for Normal rarity', () => {
        const baseItem = createMockBaseItemForModifiers({ itemType: 'BodyArmor' });
        const mods = generateModifiers(baseItem, 'Normal', 10);
        expect(mods).toBeInstanceOf(Array);
        expect(mods).toHaveLength(0);
    });
    it('should filter out Evasion/Barrier mods for an Armor base', () => {
        const baseItem = createMockBaseItemForModifiers({ itemType: 'BodyArmor', baseArmor: 100 });
        let foundInvalidMod = false;
        for (let i = 0; i < 50; i++) {
            const mods = generateModifiers(baseItem, 'Lendário', 50);
            for (const mod of mods) {
                if (
                    mod.type === ModifierType.FlatLocalEvasion || 
                    mod.type === ModifierType.IncreasedLocalEvasion ||
                    mod.type === ModifierType.FlatLocalBarrier ||
                    mod.type === ModifierType.IncreasedLocalBarrier
                ) {
                    foundInvalidMod = true;
                    break;
                }
            }
            if (foundInvalidMod) break;
        }
        expect(foundInvalidMod).toBe(false);
    });
    it('should filter out Armor/Barrier/Health mods for a Barrier base', () => {
        const baseItem = createMockBaseItemForModifiers({ itemType: 'Helm', baseBarrier: 100 });
        let foundInvalidMod = false;
        for (let i = 0; i < 50; i++) {
            const mods = generateModifiers(baseItem, 'Lendário', 50);
            for (const mod of mods) {
                if (
                    mod.type === ModifierType.FlatLocalArmor || 
                    mod.type === ModifierType.IncreasedLocalArmor ||
                    mod.type === ModifierType.FlatLocalEvasion ||
                    mod.type === ModifierType.IncreasedLocalEvasion ||
                    mod.type === ModifierType.MaxHealth ||
                    mod.type === ModifierType.FlatLifeRegen ||
                    mod.type === ModifierType.PercentLifeRegen
                ) {
                    foundInvalidMod = true;
                    break;
                }
            }
            if (foundInvalidMod) break;
        }
        expect(foundInvalidMod).toBe(false);
    });
}); 