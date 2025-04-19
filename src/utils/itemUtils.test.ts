import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModifierType, EquippableItem, Modifier } from '../types/gameData';
import * as ItemsData from '../data/items';
import {
    determineRarity,
    generateModifiers,
    generateDrop,
    PREFIX_MODIFIERS,
    SUFFIX_MODIFIERS,
} from './itemUtils';

// Define the mock data array (can be outside mock now)
const mockItemBasesForTest: ItemsData.BaseItemTemplate[] = [
    // Basic T1 Armor (Armor base)
    { baseId: 'test_armor_t1', name: 'Test Armor T1', itemType: 'BodyArmor', icon: '', baseArmor: 50, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    // Basic T1 Weapon (Physical base)
    { baseId: 'test_weapon_t1', name: 'Test Weapon T1', itemType: 'OneHandedSword', icon: '', baseMinDamage: 10, baseMaxDamage: 20, baseAttackSpeed: 1.0, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    // Basic T1 Evasion Armor
    { baseId: 'test_evasion_t1', name: 'Test Evasion T1', itemType: 'BodyArmor', icon: '', baseEvasion: 75, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    // Basic T1 Barrier Armor
    { baseId: 'test_barrier_t1', name: 'Test Barrier T1', itemType: 'BodyArmor', icon: '', baseBarrier: 60, minLevel: 1, maxLevel: 19, requirements: { level: 1 }, allowedModifiers: [] },
    // Item with implicit pool
    { baseId: 'test_implicit_ring', name: 'Test Ring', itemType: 'Ring', icon: '', minLevel: 1, requirements: { level: 1 }, allowedModifiers: [], implicitModifierPool: [ { type: ModifierType.Strength, weight: 1 }, { type: ModifierType.Dexterity, weight: 1 }, ] },
    // Higher level base
    { baseId: 'test_armor_t3', name: 'Test Armor T3', itemType: 'BodyArmor', icon: '', baseArmor: 400, minLevel: 50, requirements: { level: 50 }, allowedModifiers: [] },
    // Starter weapon base
    { baseId: 'starter_2h_sword_base', name: 'Starter Sword', itemType: 'TwoHandedSword', icon: '', baseMinDamage: 3, baseMaxDamage: 6, baseAttackSpeed: 0.8, baseCriticalStrikeChance: 5, minLevel: 1, maxLevel: 1, requirements: { level: 1 }, allowedModifiers: [] }
];

// --- Mock Data Helpers (Simplified for itemUtils) ---

// Mock BaseItem for generateModifiers
interface MockBaseItemInput {
    baseId?: string;
    name?: string;
    itemType: string; // Required
    icon?: string;
    baseArmor?: number;
    baseEvasion?: number;
    baseBarrier?: number;
    // Add other base stats if needed by modifier filtering logic
}

const createMockBaseItemForModifiers = (input: MockBaseItemInput): 
    // Use a type that matches the structure expected by generateModifiers's BaseItem
    // This requires adding id and rarity placeholders
    Pick<EquippableItem, 'id' | 'rarity' | 'baseId' | 'name' | 'itemType' | 'icon' | 'baseArmor' | 'baseEvasion' | 'baseBarrier' | 'baseAttackSpeed' | 'baseCriticalStrikeChance' | 'baseBlockChance' | 'requirements' | 'classification'> => ({
    id: 'temp_id', // Placeholder ID required by generateModifiers internal type
    rarity: 'Normal', // Placeholder rarity
    baseId: input.baseId ?? 'default_base',
    name: input.name ?? 'Default Item',
    itemType: input.itemType,
    icon: input.icon ?? '',
    baseArmor: input.baseArmor,
    baseEvasion: input.baseEvasion,
    baseBarrier: input.baseBarrier,
    // Ensure all fields expected by internal BaseItem are present
    baseAttackSpeed: undefined,
    baseCriticalStrikeChance: undefined,
    baseBlockChance: undefined,
    requirements: undefined,
    classification: undefined,
});

// --- Setup Spy --- 
let allItemsBasesSpy: vi.SpyInstance;

beforeEach(() => {
    // Spy on the ALL_ITEM_BASES export and replace it with our mock data
    allItemsBasesSpy = vi.spyOn(ItemsData, 'ALL_ITEM_BASES', 'get').mockReturnValue(mockItemBasesForTest);
    // Clear other mocks if needed
    vi.clearAllMocks(); // Keep this if other mocks exist
});

afterEach(() => {
    // Restore the original implementation after each test
    allItemsBasesSpy.mockRestore();
    vi.restoreAllMocks(); // Keep this
});

// --- Tests --- 

describe('itemUtils', () => {

    describe('determineRarity', () => {

        // Test levels < 50 (Default legendary chance 1%)
        it('should return Lendário if random roll is very low (level < 50)', () => {
            vi.spyOn(Math, 'random').mockReturnValue(0.005); // 0.5% < 1%
            expect(determineRarity(10)).toBe('Lendário');
            vi.restoreAllMocks();
        });

        it('should return Raro based on chance (level < 25)', () => {
            // Legendary Chance = 0.01
            // Remaining Prob = 0.99
            // Rare Chance Base (<25) = 0.10 * Remaining = 0.099
            // Magic Chance Base = 0.50 * Remaining = 0.495
            // Thresholds: Leg(0.01), Rare(0.01+0.099=0.109), Magic(0.109+0.495=0.604)
            vi.spyOn(Math, 'random').mockReturnValue(0.05); // > 0.01, < 0.109
            expect(determineRarity(10)).toBe('Raro');
            vi.restoreAllMocks();
        });
        
        it('should return Raro based on higher chance (level >= 25)', () => {
            // Legendary Chance = 0.01
            // Remaining Prob = 0.99
            // Rare Chance Base (>=25) = 0.20 * Remaining = 0.198
            // Magic Chance Base = 0.50 * Remaining = 0.495
            // Thresholds: Leg(0.01), Rare(0.01+0.198=0.208), Magic(0.208+0.495=0.703)
            vi.spyOn(Math, 'random').mockReturnValue(0.15); // > 0.01, < 0.208
            expect(determineRarity(30)).toBe('Raro');
            vi.restoreAllMocks();
        });

        it('should return Mágico based on chance (level < 50)', () => {
             // Using level 30 thresholds: Leg(0.01), Rare(0.208), Magic(0.703)
            vi.spyOn(Math, 'random').mockReturnValue(0.5); // > 0.208, < 0.703
            expect(determineRarity(30)).toBe('Mágico');
            vi.restoreAllMocks();
        });

        it('should return Normal if random roll is high (level < 50)', () => {
             // Using level 30 thresholds: Leg(0.01), Rare(0.208), Magic(0.703)
            vi.spyOn(Math, 'random').mockReturnValue(0.9); // > 0.703
            expect(determineRarity(30)).toBe('Normal');
            vi.restoreAllMocks();
        });

        // Test levels 50-74 (Legendary chance 5%)
        it('should return Lendário based on increased chance (level 50-74)', () => {
            // Legendary Chance = 0.05
            vi.spyOn(Math, 'random').mockReturnValue(0.03); // < 0.05
            expect(determineRarity(60)).toBe('Lendário');
            vi.restoreAllMocks();
        });

        // Test levels >= 75 (Legendary chance 15%)
         it('should return Lendário based on highest chance (level >= 75)', () => {
            // Legendary Chance = 0.15
            vi.spyOn(Math, 'random').mockReturnValue(0.1); // < 0.15
            expect(determineRarity(80)).toBe('Lendário');
            vi.restoreAllMocks();
        });

    });

    describe('generateModifiers', () => {

        it('should return an empty array for Normal rarity', () => {
            const baseItem = createMockBaseItemForModifiers({ itemType: 'BodyArmor' });
            const mods = generateModifiers(baseItem, 'Normal', 10);
            expect(mods).toBeInstanceOf(Array);
            expect(mods).toHaveLength(0);
        });

        it('should generate 1 prefix or 1 suffix for Mágico rarity (case 1 mod)', () => {
            const baseItem = createMockBaseItemForModifiers({ itemType: 'OneHandedSword' });
            // Mock random to get 1 mod total, then force prefix
            vi.spyOn(Math, 'random')
              .mockReturnValueOnce(0.4) // 1st call: Force 1 mod total (0.4 < 0.5)
              .mockReturnValueOnce(0.4); // 2nd call: Force prefix (0.4 < 0.5 -> numPrefixes = 1)

            const mods = generateModifiers(baseItem, 'Mágico', 10);
            expect(mods).toHaveLength(1);
            // Optional: Could add check that the single mod is indeed a prefix
            // const prefixes = mods.filter(m => PREFIX_MODIFIERS.has(m.type));
            // expect(prefixes.length).toBe(1);

            vi.restoreAllMocks();
        });

        it('should generate 1 prefix and 1 suffix for Mágico rarity (case 2 mods)', () => {
            const baseItem = createMockBaseItemForModifiers({ itemType: 'OneHandedSword' });

            let mods: Modifier[] = [];
            // Run multiple times because the number of mods (1 or 2) is random now
            for (let i=0; i < 50 && mods.length !== 2; i++) { 
              mods = generateModifiers(baseItem, 'Mágico', 10);
            }

            // We expect exactly 2 mods eventually
            expect(mods).toHaveLength(2);

            // Check if we actually got one prefix and one suffix
            const prefixes = mods.filter(m => PREFIX_MODIFIERS.has(m.type));
            const suffixes = mods.filter(m => SUFFIX_MODIFIERS.has(m.type));
            expect(prefixes.length).toBe(1);
            expect(suffixes.length).toBe(1);

            // vi.restoreAllMocks(); // Restore happens in afterEach
        });
        
        it('should generate 3 to 6 mods for Raro rarity', () => {
             const baseItem = createMockBaseItemForModifiers({ itemType: 'Helm' });
             // We don't need to mock random perfectly here, just run it and check count
             const mods = generateModifiers(baseItem, 'Raro', 30);
             expect(mods.length).toBeGreaterThanOrEqual(3);
             expect(mods.length).toBeLessThanOrEqual(6);
        });

        it('should generate 5 or 6 mods for Lendário rarity', () => {
             const baseItem = createMockBaseItemForModifiers({ itemType: 'Belt' });
             const mods = generateModifiers(baseItem, 'Lendário', 60);
             expect(mods.length).toBeGreaterThanOrEqual(5);
             expect(mods.length).toBeLessThanOrEqual(6);
        });

        it('should filter out Evasion/Barrier mods for an Armor base', () => {
            // Create an armor base item
            const baseItem = createMockBaseItemForModifiers({ itemType: 'BodyArmor', baseArmor: 100 });
            // Run generate multiple times to increase chance of hitting relevant mods
            let foundInvalidMod = false;
            for (let i = 0; i < 50; i++) { // Run 50 times
                 const mods = generateModifiers(baseItem, 'Lendário', 50); // Generate max mods
                 for (const mod of mods) {
                    if (
                        mod.type === ModifierType.FlatLocalEvasion || 
                        mod.type === ModifierType.IncreasedLocalEvasion ||
                        mod.type === ModifierType.FlatLocalBarrier ||
                        mod.type === ModifierType.IncreasedLocalBarrier
                    ) {
                        foundInvalidMod = true;
                        console.warn('Invalid mod found on Armor base:', mod.type);
                        break;
                    }
                 }
                 if (foundInvalidMod) break;
            }
            expect(foundInvalidMod).toBe(false);
        });

        it('should filter out Armor/Barrier/Health mods for a Barrier base', () => {
            // Create a barrier base item
            const baseItem = createMockBaseItemForModifiers({ itemType: 'Helm', baseBarrier: 100 });
            let foundInvalidMod = false;
             for (let i = 0; i < 50; i++) {
                 const mods = generateModifiers(baseItem, 'Lendário', 50); 
                 for (const mod of mods) {
                    if (
                        mod.type === ModifierType.FlatLocalArmor || 
                        mod.type === ModifierType.IncreasedLocalArmor ||
                        mod.type === ModifierType.FlatLocalEvasion || // Should be allowed on Barrier?
                        mod.type === ModifierType.IncreasedLocalEvasion || // Should be allowed on Barrier?
                        mod.type === ModifierType.MaxHealth ||
                        mod.type === ModifierType.FlatLifeRegen ||
                        mod.type === ModifierType.PercentLifeRegen
                    ) {
                        foundInvalidMod = true;
                        console.warn('Invalid mod found on Barrier base:', mod.type);
                        break;
                    }
                 }
                  if (foundInvalidMod) break;
            }
            expect(foundInvalidMod).toBe(false);
        });

        // --- TODO: Add tests for specific mod ranges and bias --- 

    });

    describe('generateDrop', () => {

        it('should select an appropriate base item for the monster level', () => {
            const monsterLevel = 10;
            const drop = generateDrop(monsterLevel);
            expect(drop).not.toBeNull();
            // Check if the selected base item's level range includes the monster level
            // Use the MOCKED data directly for assertion check
            const baseItem = mockItemBasesForTest.find(b => b.baseId === drop?.baseId);
            expect(baseItem).toBeDefined();
            expect(monsterLevel).toBeGreaterThanOrEqual(baseItem!.minLevel);
            if (baseItem!.maxLevel !== undefined) {
                expect(monsterLevel).toBeLessThanOrEqual(baseItem!.maxLevel);
            }
        });

        it('should generate an item with forced rarity', () => {
            const monsterLevel = 5;
            const drop = generateDrop(monsterLevel, undefined, 'Lendário'); // Pass undefined for forceItemType
            expect(drop).not.toBeNull();
            expect(drop!.rarity).toBe('Lendário');
        });

        it('should generate a legendary item with 5 or 6 modifiers', () => {
            const monsterLevel = 70;
            // Ensure spy is active before calling generateDrop
            const drop = generateDrop(monsterLevel, undefined, 'Lendário');
            expect(drop).not.toBeNull(); // <<< This assertion should now pass
            expect(drop!.rarity).toBe('Lendário');
            expect(drop!.modifiers.length).toBeGreaterThanOrEqual(5);
            expect(drop!.modifiers.length).toBeLessThanOrEqual(6);
        });

        it('should generate an implicit modifier if the base item has a pool', () => {
            let dropWithImplicit: EquippableItem | null = null;
            // Increase retries, as selection relies on mocked data
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
            for (let i = 0; i < 50; i++) { // Generate many drops
                const drop = generateDrop(monsterLevel);
                if (drop?.baseId === 'starter_2h_sword_base') {
                    foundStarterWeapon = true;
                    break;
                }
            }
            expect(foundStarterWeapon).toBe(false);
        });

        // --- TODO: Add tests for generateDrop with specific item types forced ---

    });

}); 