import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModifierType, EquippableItem } from '../types/gameData';
import * as ItemsData from '../data/items';
import { generateDrop } from './itemUtils';

const mockItemBasesForTest: ItemsData.BaseItemTemplate[] = [
    { baseId: 'test_armor_t1', name: 'Test Armor T1', itemType: 'BodyArmor', icon: '', baseArmor: 50, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'test_weapon_t1', name: 'Test Weapon T1', itemType: 'OneHandedSword', icon: '', baseMinDamage: 10, baseMaxDamage: 20, baseAttackSpeed: 1.0, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    { baseId: 'test_implicit_ring', name: 'Test Ring', itemType: 'Ring', icon: '', minLevel: 1, requirements: { level: 1 }, allowedModifiers: [], implicitModifierPool: [ { type: ModifierType.Strength, weight: 1 }, { type: ModifierType.Dexterity, weight: 1 }, ] },
    { baseId: 'starter_2h_sword_base', name: 'Starter Sword', itemType: 'TwoHandedSword', icon: '', baseMinDamage: 3, baseMaxDamage: 6, baseAttackSpeed: 0.8, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 1, requirements: { level: 1 }, allowedModifiers: [] }
];

let allItemsBasesSpy: vi.SpyInstance;
beforeEach(() => {
    allItemsBasesSpy = vi.spyOn(ItemsData, 'ALL_ITEM_BASES', 'get').mockReturnValue(mockItemBasesForTest);
    vi.clearAllMocks();
});
afterEach(() => {
    allItemsBasesSpy.mockRestore();
    vi.restoreAllMocks();
});

describe('generateDrop', () => {
    it('should select an appropriate base item for the monster level', () => {
        const monsterLevel = 10;
        const drop = generateDrop(monsterLevel);
        expect(drop).not.toBeNull();
        const baseItem = mockItemBasesForTest.find(b => b.baseId === drop?.baseId);
        expect(baseItem).toBeDefined();
        expect(monsterLevel).toBeGreaterThanOrEqual(baseItem!.minLevel);
        if (baseItem!.maxLevel !== undefined) {
            expect(monsterLevel).toBeLessThanOrEqual(baseItem!.maxLevel);
        }
    });
    it('should generate an item with forced rarity', () => {
        const monsterLevel = 5;
        const drop = generateDrop(monsterLevel, undefined, 'Lendário');
        expect(drop).not.toBeNull();
        expect(drop!.rarity).toBe('Lendário');
    });
    it('should generate a legendary item with 5 or 6 modifiers', () => {
        const monsterLevel = 70;
        const drop = generateDrop(monsterLevel, undefined, 'Lendário');
        expect(drop).not.toBeNull();
        expect(drop!.rarity).toBe('Lendário');
        expect(drop!.modifiers.length).toBeGreaterThanOrEqual(5);
        expect(drop!.modifiers.length).toBeLessThanOrEqual(6);
    });
    it('should generate an implicit modifier if the base item has a pool', () => {
        let dropWithImplicit: EquippableItem | null = null;
        for (let i=0; i < 50; i++) { 
            const drop = generateDrop(10);
            if (drop?.baseId === 'test_implicit_ring') {
                dropWithImplicit = drop;
                break;
            }
        }
        expect(dropWithImplicit).not.toBeNull(); 
        expect(dropWithImplicit!.implicitModifier).not.toBeNull();
        expect([
            ModifierType.Strength,
            ModifierType.Dexterity
        ]).toContain(dropWithImplicit!.implicitModifier!.type);
    });
    it('should NOT drop the starter weapon base', () => {
        const monsterLevel = 1;
        let foundStarterWeapon = false;
        for (let i = 0; i < 50; i++) {
            const drop = generateDrop(monsterLevel);
            if (drop?.baseId === 'starter_2h_sword_base') {
                foundStarterWeapon = true;
                break;
            }
        }
        expect(foundStarterWeapon).toBe(false);
    });
}); 