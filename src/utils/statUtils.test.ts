// src/utils/statUtils.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Character, EquippableItem, Modifier, ModifierType, EquipmentSlotId } from '../types/gameData'; // Adjust path if needed
import { BaseItemTemplate } from '../data/items'; // <<< Correct import path for BaseItemTemplate
import {
    calculateTotalStrength,
    calculateTotalDexterity,
    calculateTotalIntelligence,
    calculateItemArmor,
    calculateFinalMaxHealth,
    calculateEffectiveStats
} from './statUtils'; // Adjust path if needed

// --- Mocking items.ts --- 
vi.mock('../data/items.ts', () => {
    // <<< DEFINE MOCK DATA INSIDE THE FACTORY >>>
    const mockItemBases: BaseItemTemplate[] = [
        // Mock 1H Sword
        {
            baseId: 'base_mock_1h_sword',
            name: 'Mock 1H Sword',
            itemType: 'OneHandedSword',
            icon: '',
            baseMinDamage: 10,
            baseMaxDamage: 20,
            baseAttackSpeed: 1.1,
            baseCriticalStrikeChance: 5,
            minLevel: 1,
            requirements: { level: 1 },
            allowedModifiers: [],
        },
        // Mock Ring (e.g., for global flat damage)
        {
            baseId: 'base_mock_ring',
            name: 'Mock Ring',
            itemType: 'Ring',
            icon: '',
            minLevel: 1,
            requirements: { level: 1 },
            allowedModifiers: [],
        },
         // Mock Belt (e.g., for health/attributes)
        {
            baseId: 'base_mock_belt',
            name: 'Mock Belt',
            itemType: 'Belt',
            icon: '',
            minLevel: 1,
            requirements: { level: 1 },
            allowedModifiers: [],
        },
         // Mock Armor (for defensive tests)
        {
            baseId: 'base_mock_armor',
            name: 'Mock Armor',
            itemType: 'BodyArmor',
            icon: '',
            baseArmor: 50,
            minLevel: 1,
            requirements: { level: 1 },
            allowedModifiers: [],
        }
    ];
    // Return the object mapping exports to their mock values
    return { 
        ALL_ITEM_BASES: mockItemBases 
    };
});

// --- Mock Data --- 

const mockCharacterBase: Omit<Character, 'id' | 'name' | 'class' | 'currentAreaId' | 'unlockedAreaIds' | 'inventory' | 'equipment' | 'currentXP' | 'currentAct' | 'currentHealth' | 'currentBarrier'> = {
    level: 10,
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    armor: 0,
    evasion: 0,
    barrier: 0,
    blockChance: 0,
    baseMaxHealth: 100,
    maxHealth: 100, // Will be updated by tests
    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    voidResistance: 0,
    minBaseDamage: 1,
    maxBaseDamage: 2,
    criticalStrikeChance: 5,
    criticalStrikeMultiplier: 150,
    projectileDamage: 0,
    spellDamage: 0,
    fireDamage: 0,
    coldDamage: 0,
    lightningDamage: 0,
    voidDamage: 0,
    movementSpeed: 0,
    attackSpeed: 1,
    castSpeed: 1,
    healthPotions: 3,
    teleportStones: 1,
};

const createMockCharacter = (equipment: Partial<Record<EquipmentSlotId, EquippableItem | null>> = {}): Character => ({
    id: 1,
    name: 'Test Hero',
    class: 'Guerreiro',
    currentAreaId: 'cidade_principal',
    unlockedAreaIds: ['cidade_principal'],
    inventory: [],
    equipment: equipment,
    currentXP: 0,
    currentAct: 1,
    currentHealth: 100,
    currentBarrier: 0,
    ...mockCharacterBase, // Spread base stats
});

// <<< Define a type for Mock Modifiers >>>
type MockModifierInput = Partial<Pick<Modifier, 'type' | 'value' | 'valueMin' | 'valueMax'> & { type: ModifierType }>;

const createMockItem = (id: string, mods: MockModifierInput[], implicit?: MockModifierInput): EquippableItem => ({
    id: id,
    baseId: `base_${id}`,
    name: `Test Item ${id}`,
    rarity: 'Mágico',
    itemType: 'Unknown', // Set specific type in tests if needed
    icon: '',
    modifiers: mods.map(mod => ({ ...mod })) as Modifier[], // Use the correct Modifier type
    implicitModifier: implicit ? { ...implicit } as Modifier : null, // Use the correct Modifier type
});

// --- Tests --- 

describe('statUtils', () => {

    describe('calculateTotalStrength', () => {
        it('should calculate strength correctly with explicit and implicit mods', () => {
            const char = createMockCharacter({
                helm: createMockItem('helm1', [{ type: ModifierType.Strength, value: 5 }]),
                belt: createMockItem('belt1', [], { type: ModifierType.Strength, value: 3 }),
                boots: createMockItem('boots1', [{ type: ModifierType.Dexterity, value: 4 }])
            });
            // Base(10) + Helm Explicit(5) + Belt Implicit(3) = 18
            expect(calculateTotalStrength(char)).toBe(18);
        });

        it('should return base strength if no relevant mods', () => {
            const char = createMockCharacter({
                helm: createMockItem('helm2', [{ type: ModifierType.Intelligence, value: 5 }])
            });
            expect(calculateTotalStrength(char)).toBe(10); // Only base strength
        });
    });

    describe('calculateTotalDexterity', () => {
        it('should calculate dexterity correctly with explicit and implicit mods', () => {
            const char = createMockCharacter({
                gloves: createMockItem('gloves1', [{ type: ModifierType.Dexterity, value: 6 }]),
                amulet: createMockItem('amulet1', [], { type: ModifierType.Dexterity, value: 4 }),
                ring1: createMockItem('ring1', [{ type: ModifierType.Strength, value: 5 }])
            });
            // Base(10) + Gloves Explicit(6) + Amulet Implicit(4) = 20
            expect(calculateTotalDexterity(char)).toBe(20);
        });

         it('should return base dexterity if no relevant mods', () => {
            const char = createMockCharacter({
                helm: createMockItem('helm3', [{ type: ModifierType.Strength, value: 5 }])
            });
            expect(calculateTotalDexterity(char)).toBe(10); // Only base dexterity
        });
    });

    describe('calculateTotalIntelligence', () => {
        it('should calculate intelligence correctly with explicit and implicit mods', () => {
            const char = createMockCharacter({
                bodyArmor: createMockItem('armor1', [{ type: ModifierType.Intelligence, value: 7 }]),
                ring2: createMockItem('ring2', [], { type: ModifierType.Intelligence, value: 2 }),
            });
            // Base(10) + Armor Explicit(7) + Ring Implicit(2) = 19
            expect(calculateTotalIntelligence(char)).toBe(19);
        });

        it('should return base intelligence if no relevant mods', () => {
            const char = createMockCharacter();
            expect(calculateTotalIntelligence(char)).toBe(10);
        });
    });

    describe('calculateItemArmor', () => {
        it('should calculate armor correctly with base, flat, and increased mods', () => {
            const item = createMockItem('armor_test', [
                { type: ModifierType.FlatLocalArmor, value: 20 },
                { type: ModifierType.IncreasedLocalArmor, value: 50 } // 50% increase
            ]);
            item.baseArmor = 100; // Set base armor for the test item
            item.itemType = 'BodyArmor'; // Set type
            // (Base(100) + Flat(20)) * (1 + Increased(50)/100) = 120 * 1.5 = 180
            expect(calculateItemArmor(item)).toBe(180);
        });

        it('should return base armor if no mods', () => {
            const item = createMockItem('armor_test_2', []);
            item.baseArmor = 50;
            item.itemType = 'BodyArmor';
            expect(calculateItemArmor(item)).toBe(50);
        });

        it('should handle only flat mod', () => {
            const item = createMockItem('armor_test_3', [
                { type: ModifierType.FlatLocalArmor, value: 30 }
            ]);
            item.baseArmor = 0;
            item.itemType = 'Helm';
            expect(calculateItemArmor(item)).toBe(30);
        });

        it('should handle only increased mod', () => {
            const item = createMockItem('armor_test_4', [
                { type: ModifierType.IncreasedLocalArmor, value: 100 } // 100% increase
            ]);
            item.baseArmor = 75;
            item.itemType = 'Gloves';
            // 75 * (1 + 100/100) = 75 * 2 = 150
            expect(calculateItemArmor(item)).toBe(150);
        });
    });

     describe('calculateFinalMaxHealth', () => {
        it('should add flat health mods to base health', () => {
            // Base health = 100 from mockCharacterBase
            const flatHealthFromMods = 50;
            expect(calculateFinalMaxHealth(mockCharacterBase.baseMaxHealth, flatHealthFromMods)).toBe(150);
        });

        it('should return base health if no flat mods', () => {
            const flatHealthFromMods = 0;
            expect(calculateFinalMaxHealth(mockCharacterBase.baseMaxHealth, flatHealthFromMods)).toBe(100);
        });

        it('should handle negative flat health (though unlikely)', () => {
            const flatHealthFromMods = -20;
            expect(calculateFinalMaxHealth(mockCharacterBase.baseMaxHealth, flatHealthFromMods)).toBe(80);
        });

        it('should return at least 1 health', () => {
            const flatHealthFromMods = -150; // More negative than base
            expect(calculateFinalMaxHealth(mockCharacterBase.baseMaxHealth, flatHealthFromMods)).toBe(1);
        });
    });

    // --- TODO: Add tests for calculateEffectiveStats (complex, requires more mocking) ---
    describe('calculateEffectiveStats', () => {

        it('should calculate stats correctly for an unarmed character', () => {
            const char = createMockCharacter(); // No equipment
            const stats = calculateEffectiveStats(char);

            // Check some key offensive stats for unarmed
            expect(stats.minDamage).toBe(0); // No weapon damage
            expect(stats.maxDamage).toBe(0);
            expect(stats.attackSpeed).toBe(1.0); // Default unarmed speed
            expect(stats.critChance).toBeCloseTo(5.1); // Default crit chance (5) + 2% from 10 Dex
            expect(stats.dps).toBe(0);

            // Check basic defensive stats (should match base character + any attribute bonuses if applicable)
            expect(stats.maxHealth).toBe(100); // Base health
            expect(stats.totalArmor).toBe(0); // Base armor
            // Intelligence base = 10 -> +10 Flat Barrier
            expect(stats.totalBarrier).toBe(10); 
        });

        it('should calculate stats correctly with one basic 1H weapon', () => {
            const mockSword = createMockItem('mock_1h_sword', []);
            mockSword.itemType = 'OneHandedSword';
            const char = createMockCharacter({ weapon1: mockSword });
            const stats = calculateEffectiveStats(char);

            // Check weapon-related stats (based on mockItemBases[0])
            expect(stats.minDamage).toBe(10); // 10 * 1.04 = 10.4 -> 10
            expect(stats.maxDamage).toBe(21); // 20 * 1.04 = 20.8 -> 21
            expect(stats.attackSpeed).toBe(1.1);
            expect(stats.critChance).toBeCloseTo(5.1); // Base 5 * 1.02 (from Dex)
            // DPS: AvgDmg(15.5) * AS(1.1) * (1 + CritC(0.051)*(CritM(1.5)-1)) = 17.05 * (1 + 0.051*0.5) = 17.05 * 1.0255 = 17.484275
            expect(stats.dps).toBeCloseTo(17.48); // Use toBeCloseTo for float comparison
            
            // Check other stats remain default (or affected by attributes)
             expect(stats.maxHealth).toBe(100);
             expect(stats.totalBarrier).toBe(10); 
        });

        it('should apply global flat physical damage from other gear', () => {
            const mockSword = createMockItem('mock_1h_sword', []);
            mockSword.itemType = 'OneHandedSword';
            const mockRing = createMockItem('mock_ring', [
                { type: ModifierType.AddsFlatPhysicalDamage, valueMin: 5, valueMax: 10 }
            ]);
            mockRing.itemType = 'Ring';
            const char = createMockCharacter({ weapon1: mockSword, ring1: mockRing });
            const stats = calculateEffectiveStats(char);

            // Weapon base: 10-20 Phys
            // Ring global flat: 5-10 Phys
            // Expected final phys: (10+5) - (20+10) = 15-30
            // Apply +4% global phys from Str: 15*1.04=15.6->16, 30*1.04=31.2->31 => 16-31
            expect(stats.minDamage).toBe(16);
            expect(stats.maxDamage).toBe(31);
            expect(stats.attackSpeed).toBe(1.1); // Unchanged
            expect(stats.critChance).toBeCloseTo(5.1); // Base 5 * 1.02 (from Dex)
            // DPS: AvgDmg(23.5) * AS(1.1) * (1 + 0.051*0.5) = 25.85 * 1.0255 = 26.509675
            expect(stats.dps).toBeCloseTo(26.51);
        });

        it('should apply local weapon mods correctly', () => {
            const mockSword = createMockItem('mock_1h_sword', [
                { type: ModifierType.IncreasedLocalPhysicalDamage, value: 50 }, // 50% increased phys
                { type: ModifierType.IncreasedLocalAttackSpeed, value: 10 }    // 10% increased AS
            ]);
            mockSword.itemType = 'OneHandedSword';
            const char = createMockCharacter({ weapon1: mockSword });
            const stats = calculateEffectiveStats(char);

            // Base Weapon: 10-20 Phys, 1.1 AS, 5 Crit
            // Local Mods: +50% Phys Dmg, +10% AS
            // Expected Phys after local: (10*(1+0.5)) - (20*(1+0.5)) = 15-30
            // Expected AS after local: 1.1 * (1+0.1) = 1.1 * 1.1 = 1.21
            // Apply +4% global phys from Str: 15*1.04=15.6->16, 30*1.04=31.2->31 => 16-31
            // Apply +2% global crit from Dex: 5 * 1.02 = 5.1
            expect(stats.minDamage).toBe(16);
            expect(stats.maxDamage).toBe(31);
            expect(stats.attackSpeed).toBeCloseTo(1.21);
            expect(stats.critChance).toBeCloseTo(5.1); // Updated for Dex bonus
            // DPS: AvgDmg(23.5) * AS(1.21) * (1 + 0.051*0.5) = 28.435 * 1.0255 = 29.159...
            expect(stats.dps).toBeCloseTo(29.16);
        });

        it('should calculate stats correctly for basic dual wielding', () => {
            const mockSword1 = createMockItem('mock_1h_sword', []);
            mockSword1.itemType = 'OneHandedSword';
            // Use the same base type for simplicity, but different instance ID
            const mockSword2 = createMockItem('mock_1h_sword', []); 
            mockSword2.id = 'mock_1h_sword_2'; // Ensure different ID
            mockSword2.baseId = 'base_mock_1h_sword'; // Use same baseId
            mockSword2.itemType = 'OneHandedSword';
            
            const char = createMockCharacter({ weapon1: mockSword1, weapon2: mockSword2 });
            const stats = calculateEffectiveStats(char);

            // Base Weapon (each): 10-20 Phys, 1.1 AS, 5 Crit
            // DW Buffs: 10% More Attack Speed
            // Attr Bonuses: +4% Phys Dmg (Str), +2% Global Crit (Dex)
            // Final Phys/Weapon: 10*(1.04)=10.4->10, 20*(1.04)=20.8->21. => 10-21
            // Final Avg Damage (Displayed): 10-21 Phys (Avg 15.5)
            // Final AS: Avg(1.1, 1.1) * (1+0/100) * 1.10 (DW More) = 1.1 * 1.1 = 1.21
            // Final Crit: Avg(5, 5) * (1+2/100) = 5 * 1.02 = 5.1
            // DPS/Hand: 15.5 * (1.21/2) * (1 + (5.1/100)*(1.5-1)) = 15.5 * 0.605 * 1.0255 = 9.6166...
            // Total DPS = 2 * 9.6166 = 19.233...

            // Check average displayed damage
            expect(stats.minDamage).toBe(10);
            expect(stats.maxDamage).toBe(21); // Already correct

            expect(stats.attackSpeed).toBeCloseTo(1.21);
            expect(stats.critChance).toBeCloseTo(5.1); // Already correct

            // Check DPS
            expect(stats.dps).toBeCloseTo(19.23); // Already correct
        });

        // --- More test cases will be added here --- 

    });

}); 