// src/utils/combatUtils.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCharacterStore } from '../stores/characterStore';
import { applyPlayerTakeDamage, spawnEnemy, handleEnemyRemoval } from './combatUtils';
import { Character, EnemyType, EnemyInstance, MapLocation, EquippableItem, ItemRarity, ModifierType } from '../types/gameData';
import { calculateEffectiveStats, EffectiveStats } from './statUtils/weapon';
import { generateDrop } from './generateDrop';
vi.mock('./generateDrop');
import { CharacterState } from '../stores/characterStore';

// --- Mock Dependencies ---
vi.mock('./statUtils/weapon');

// --- Mock Factory for characterStore (Final Approach) ---
vi.mock('../stores/characterStore', () => {
  console.log("[MOCK FACTORY V4] Setting up mock characterStore");

  // Define a type for the mock store instance to include actions
  type MockStoreInstance = {
      getState: () => CharacterState;
      setState: vi.Mock<unknown[], void>;
      subscribe: vi.Mock<unknown[], () => void>;
      // Add mock actions if they exist on CharacterState
      // setActiveCharacter?: vi.Mock;
      // updateCharacter?: vi.Mock;
      // saveCharacter?: vi.Mock;
      // usePotion?: vi.Mock;
  };
  // Define a type for the mock hook that also has static methods
  type MockHook = (() => MockStoreInstance) & {
      getState: () => CharacterState;
      // setState?: vi.Mock<any[], void>; // Add if needed
  };

  let internalState: Partial<CharacterState> = {};

  const mockStoreInstance: MockStoreInstance = {
    // getState returns the current internal state
    getState: (): CharacterState => internalState as CharacterState,
    // setState updates the internal state
    setState: vi.fn((updater, replace = false) => {
        const currentState = internalState as CharacterState;
        const newState = typeof updater === 'function'
            ? (updater as (state: CharacterState) => Partial<CharacterState>)(currentState)
            : updater;
        internalState = replace ? newState : { ...currentState, ...newState };
    }),
    // Mock subscribe minimally
    subscribe: vi.fn(() => () => {}), 
    // Add dummy actions if CharacterState requires them, otherwise omit
    // setActiveCharacter: vi.fn(), updateCharacter: vi.fn(), saveCharacter: vi.fn(), usePotion: vi.fn(),
  };

  // Create the mock hook function, explicitly typed
  const mockHook: MockHook = (() => mockStoreInstance) as MockHook;

  // Attach getState directly to the mock hook function object
  // This mimics the static getState property on the real store hook
  mockHook.getState = mockStoreInstance.getState;
  // Also attach setState if needed directly (less common)
  // mockHook.setState = mockStoreInstance.setState;

  // Return the object mapping the export name to our mock hook
  return {
      useCharacterStore: mockHook
  };
});

// --- Standalone Mock Functions for Actions Passed as Props ---
const mockUpdateCharacter = vi.fn();
const mockSaveCharacter = vi.fn();

// Mock gameData enemy types
const mockEnemyTypes: EnemyType[] = [
  {
    id: 'goblin', name: 'Goblin', emoji: '👺', damageType: 'physical',
    baseHealthLvl1: 11, baseDamageLvl1: 3, healthIncreasePerLevel: 11, damageIncreasePerLevel: 3,
    attackSpeed: 1.5, baseXP: 5, baseAccuracyLvl1: 50, accuracyIncreasePerLevel: 4,
    // No guaranteed drop
  },
  {
    id: 'ice_dragon_boss', name: 'Dragão de Gelo (Boss)', emoji: '🐉', damageType: 'cold',
    baseHealthLvl1: 68, baseDamageLvl1: 6, healthIncreasePerLevel: 35, damageIncreasePerLevel: 4,
    attackSpeed: 1.25, baseXP: 120, baseAccuracyLvl1: 120, accuracyIncreasePerLevel: 10,
    guaranteedItemDropBaseId: 'special_dragon_scale',
    guaranteedItemDropRarity: 'Raro' // Correct rarity string
  }
];

const findMockEnemyType = (id: string): EnemyType | undefined => mockEnemyTypes.find(et => et.id === id);

// Mock character creator
const createMockCharacter = (overrides: Partial<Character> = {}): Character => ({
  id: 1, name: 'Test Hero', class: 'Guerreiro', level: 10,
  currentXP: 0, currentAct: 1, currentAreaId: 'start_area', unlockedAreaIds: ['start_area'],
  strength: 10, dexterity: 10, intelligence: 10,
  armor: 50, evasion: 30, barrier: 0, blockChance: 0,
  baseMaxHealth: 100, maxHealth: 100, currentHealth: 100, currentBarrier: 0,
  fireResistance: 0, coldResistance: 0, lightningResistance: 0, voidResistance: 0,
  minBaseDamage: 5, maxBaseDamage: 10, criticalStrikeChance: 5, criticalStrikeMultiplier: 150,
  projectileDamage: 0, spellDamage: 0, fireDamage: 0, coldDamage: 0, lightningDamage: 0, voidDamage: 0,
  movementSpeed: 0, attackSpeed: 1, castSpeed: 1, healthPotions: 3, teleportStones: 1,
  inventory: [], equipment: {},
  isHardcore: false, // Garantir booleano
  maxMana: 100, // Garantir que nunca seja undefined
  currentMana: 100,
  ...overrides,
});

// Mock a simple location needed for tests
const mockStartArea: MapLocation = {
    id: 'start_area', name: 'Starting Zone', description: 'Where it begins', act: 1, position: { top: '50%', left: '50%' }, level: 1, possibleEnemies: ['goblin'], connections: ['next_area'], killsToComplete: 5, currentKills: 0
};
const mockBossArea: MapLocation = {
     id: 'boss_area', name: 'Boss Lair', description: 'Scary place', act: 1, position: { top: '70%', left: '70%' }, level: 15, possibleEnemies: ['ice_dragon_boss'], connections: [], currentKills: 0
};

// Mock calculateEffectiveStats (full implementation)
const mockCalculateEffectiveStats = calculateEffectiveStats as unknown as vi.Mock;
mockCalculateEffectiveStats.mockImplementation(
  (character: Character): EffectiveStats => ({
    maxHealth: character.maxHealth,
    totalArmor: character.armor,
    totalEvasion: character.evasion,
    totalBarrier: character.barrier,
    totalBlockChance: character.blockChance,
    finalFireResistance: character.fireResistance,
    finalColdResistance: character.coldResistance,
    finalLightningResistance: character.lightningResistance,
    finalVoidResistance: character.voidResistance,
    attackSpeed: character.attackSpeed,
    critChance: character.criticalStrikeChance,
    critMultiplier: character.criticalStrikeMultiplier,
    totalMovementSpeed: character.movementSpeed,
    minDamage: 10, // Defaulted
    maxDamage: 20, // Defaulted
    minPhysDamage: 10, // Defaulted
    maxPhysDamage: 20, // Defaulted
    minEleDamage: 0, // Defaulted
    maxEleDamage: 0, // Defaulted
    dps: 15, // Defaulted
    physDps: 15, // Defaulted
    eleDps: 0, // Defaulted
    lifeLeechPercent: 0, // Defaulted
    finalLifeRegenPerSecond: 0, // Defaulted
    thornsDamage: 0, // Defaulted
    estimatedPhysReductionPercent: 0, // Defaulted
    totalPhysTakenAsElementPercent: 0, // Defaulted
    totalReducedPhysDamageTakenPercent: 0, // Defaulted
    weaponBaseMinPhys: 0, // Defaulted
    weaponBaseMaxPhys: 0, // Defaulted
    weaponBaseMinEle: 0, // Defaulted
    weaponBaseMaxEle: 0, // Defaulted
    weaponBaseAttackSpeed: 0, // Defaulted
    weaponBaseCritChance: 0, // Defaulted
    globalFlatMinPhys: 0, // Defaulted
    globalFlatMaxPhys: 0, // Defaulted
    globalFlatMinFire: 0, // Defaulted
    globalFlatMaxFire: 0, // Defaulted
    globalFlatMinCold: 0, // Defaulted
    globalFlatMaxCold: 0, // Defaulted
    globalFlatMinLightning: 0, // Defaulted
    globalFlatMaxLightning: 0, // Defaulted
    globalFlatMinVoid: 0, // Defaulted
    globalFlatMaxVoid: 0, // Defaulted
    increasePhysDamagePercent: 0, // Defaulted
    increaseAttackSpeedPercent: 0, // Defaulted
    increaseEleDamagePercent: 0, // Defaulted
    increaseFireDamagePercent: 0, // Defaulted
    increaseColdDamagePercent: 0, // Defaulted
    increaseLightningDamagePercent: 0, // Defaulted
    increaseVoidDamagePercent: 0, // Defaulted
    increaseGlobalCritChancePercent: 0, // Defaulted
    finalManaRegenPerSecond: 0, // campo correto
    flatManaRegen: 0,
    percentManaRegen: 0,
    weapon2CalcMinPhys: undefined, // Defaulted
    weapon2CalcMaxPhys: undefined, // Defaulted
    weapon2CalcMinEle: undefined, // Defaulted
    weapon2CalcMaxEle: undefined, // Defaulted
    weapon2CalcAttackSpeed: undefined, // Defaulted
    weapon2CalcCritChance: undefined, // Defaulted
    finalManaRegenPerSecond: 0, // Adicionado para compatibilidade
    flatManaRegen: 0, // Adicionado para compatibilidade
    percentManaRegen: 0, // Adicionado para compatibilidade
  })
);

// Mock generateDrop (keep)
const mockGenerateDrop = generateDrop as vi.Mock;
mockGenerateDrop.mockImplementation((lvl: number, rarity?: ItemRarity) => {
    const mockItem: EquippableItem = {
        id: `mock_item_${Date.now()}_${Math.random()}`,
        baseId: 'mock_base',
        name: `Mock ${rarity ?? 'Normal'} Item L${lvl}`,
        rarity: rarity ?? 'Normal', // Corrected default
        itemType: 'Helm',
        icon: 'icon_helm',
        baseArmor: 10,
        requirements: { level: lvl },
        modifiers: [],
        implicitModifier: null,
    };
    if (rarity === 'Raro') { // Corrected check
        mockItem.modifiers = [ { type: ModifierType.Strength, value: 5 } ];
    } else if (rarity === 'Mágico') { // Corrected check
        mockItem.modifiers = [ { type: ModifierType.Dexterity, value: 3 }];
    }
    return mockItem;
});

// Mocks for Refs and other functions (keep)
const mockEnemyDeathAnimEndTimeRef = { current: 0 };
const mockEnemySpawnCooldownRef = { current: 0 };
const mockHandleItemDropped = vi.fn() as vi.Mock;
const mockDisplayTemporaryMessage = vi.fn() as vi.Mock;
const mockNextEnemyAttackTimeRef = { current: 0 };
const mockNextPlayerAttackTimeRef = { current: 0 };
const mockSetCurrentEnemy = vi.fn() as vi.Mock;
const mockSetEnemiesKilledCount = vi.fn() as vi.Mock;

// --- Controlled State Object for Spying ---
let spyState: Partial<CharacterState> = {};

// --- Spy Setup Variables ---
let getStateSpy: vi.SpyInstance;

beforeEach(() => {
  vi.clearAllMocks();

  // Reset standalone action mocks
  mockUpdateCharacter.mockClear();
  mockSaveCharacter.mockClear();

  // Create fresh character 
  const mockChar = createMockCharacter();
  
  // Reset the controlled state
  spyState = { activeCharacter: mockChar };

  // --- Setup Spies --- 
  getStateSpy = vi.spyOn(useCharacterStore, 'getState').mockReturnValue(spyState as CharacterState);

  // Reset external util mocks
  (calculateEffectiveStats as vi.Mock).mockClear();
  (generateDrop as vi.Mock).mockClear();
  mockHandleItemDropped.mockClear();
  mockDisplayTemporaryMessage.mockClear();
  mockSetCurrentEnemy.mockClear();
  mockSetEnemiesKilledCount.mockClear();
});

afterEach(() => {
  // Restore original store methods
  getStateSpy.mockRestore();
  vi.restoreAllMocks(); // General cleanup
});

// Test Suites
describe('applyPlayerTakeDamage', () => {
  it('should reduce health correctly for physical damage considering armor', () => {
    // Call the original getState, which is spied on
    const character = useCharacterStore.getState().activeCharacter!;
    character.currentHealth = 100; // Set specific test values
    character.armor = 50;

    const stats = calculateEffectiveStats(character);
    // Override specific stats if needed for test scenario
    (stats as {totalArmor: number}).totalArmor = 50; 

    const result = applyPlayerTakeDamage(20, 'physical', character, stats);

    expect(result.finalDamage).toBe(16);
    expect(result.updates.currentHealth).toBe(100 - 16);
    expect(result.isDead).toBe(false);
  });

  // ... other applyPlayerTakeDamage tests ...
});

describe('spawnEnemy', () => {
    it('should spawn an enemy from the current location list', () => {
        const currentArea = mockStartArea;
        const enemiesKilledCount = 0;
        // No need to get character explicitly, function uses mocked store internally

        spawnEnemy(
            currentArea,
            null,
            enemiesKilledCount,
            mockSetCurrentEnemy,
            mockNextEnemyAttackTimeRef,
            mockNextPlayerAttackTimeRef
        );

        expect(mockSetCurrentEnemy).toHaveBeenCalledTimes(1);
        const spawnedEnemy: EnemyInstance = mockSetCurrentEnemy.mock.calls[0][0];
        expect(spawnedEnemy.typeId).toBe('goblin');
        expect(spawnedEnemy.level).toBeGreaterThanOrEqual(currentArea.level);
    });

    it('should not spawn an enemy if one already exists', () => {
        const currentArea = mockStartArea;
        const existingEnemy: EnemyInstance = { instanceId: 'goblin-existing', typeId: 'goblin', name:'G', emoji:'', level: 1, maxHealth: 10, currentHealth: 10, damage: 1, attackSpeed: 1, damageType:'physical', accuracy: 50 };
        const enemiesKilledCount = 0;
        // No need to get character explicitly

         spawnEnemy(
            currentArea,
            existingEnemy,
            enemiesKilledCount,
            mockSetCurrentEnemy,
            mockNextEnemyAttackTimeRef,
            mockNextPlayerAttackTimeRef
        );
        expect(mockSetCurrentEnemy).not.toHaveBeenCalled();
    });

    // ... other spawnEnemy tests ...
});

describe('handleEnemyRemoval', () => {
  it('should call necessary functions with correct arguments', () => {
    const enemyToRemove: EnemyInstance = {
      instanceId: 'goblin-1', typeId: 'goblin', name: 'Goblin', emoji: '👺',
      level: 5, maxHealth: 50, currentHealth: 0, damage: 10, attackSpeed: 1, damageType: 'physical', accuracy: 60,
    };
    const currentArea = mockStartArea;
    const enemiesKilledCount = 0;

    // Call the original getState
    const initialXP = useCharacterStore.getState().activeCharacter!.currentXP;
    const enemyType = findMockEnemyType(enemyToRemove.typeId)!;
    const expectedXP = initialXP + enemyType.baseXP;

    handleEnemyRemoval(
        enemyToRemove,
        currentArea,
        enemiesKilledCount,
        mockSetEnemiesKilledCount,
        mockSetCurrentEnemy,
        mockEnemyDeathAnimEndTimeRef,
        mockEnemySpawnCooldownRef,
        mockHandleItemDropped,
        mockUpdateCharacter,
        mockSaveCharacter,
        mockDisplayTemporaryMessage
    );

    // Check that the standalone mock functions were called
    expect(mockUpdateCharacter).toHaveBeenCalledWith(
        expect.objectContaining({ currentXP: expectedXP })
    );

    // Other assertions
    expect(mockSetCurrentEnemy).toHaveBeenCalledWith(null);
    expect(mockSetEnemiesKilledCount).toHaveBeenCalledWith(1);
  });

  it('should generate and handle guaranteed drops', () => {
      const enemyToRemove: EnemyInstance = {
          instanceId: 'boss-1', typeId: 'ice_dragon_boss', name: 'Boss', emoji: '🐉',
          level: 15, maxHealth: 300, currentHealth: 0, damage: 20, attackSpeed: 1, damageType: 'cold', accuracy: 100,
      };
      const currentArea = mockBossArea;
      const enemiesKilledCount = 0;

      // const enemyType = findMockEnemyType(enemyToRemove.typeId)!; // <<< REMOVE unused variable
      const guaranteedItem: EquippableItem = { id: 'guaranteed_scale', baseId: 'special_dragon_scale', name: 'Escama de Dragão Rara', rarity: 'Raro', itemType: 'Misc', icon: '', modifiers: [], implicitModifier: null };
      
      // Use Raro directly as the guaranteed rarity for this boss type
      const guaranteedRarity : ItemRarity = 'Raro'; 
      mockGenerateDrop.mockImplementation((lvl: number, type?: string, rarity?: ItemRarity) => rarity === guaranteedRarity ? guaranteedItem : null);

      // Mock Math.random to force 'Raro' rarity from boss drop logic
      const originalMathRandom = Math.random;
      Math.random = vi.fn(() => 0.5); // Ensure the 30% legendary chance (0.3) fails

      handleEnemyRemoval(
          enemyToRemove, 
          currentArea, 
          enemiesKilledCount, 
          mockSetEnemiesKilledCount, 
          mockSetCurrentEnemy, 
          mockEnemyDeathAnimEndTimeRef, 
          mockEnemySpawnCooldownRef, 
          mockHandleItemDropped, 
          mockUpdateCharacter, 
          mockSaveCharacter, 
          mockDisplayTemporaryMessage
      );

      // Expect forced 'Raro' 
      expect(mockGenerateDrop).toHaveBeenCalledWith(enemyToRemove.level, undefined, guaranteedRarity);
      expect(mockHandleItemDropped).toHaveBeenCalledWith(guaranteedItem);

      Math.random = originalMathRandom; // Restore original Math.random
  });

  it('should attempt to generate and handle random drops', () => {
      const enemyToRemove: EnemyInstance = {
          instanceId: 'goblin-noguarantee', typeId: 'goblin', name: 'Goblin', emoji: '👺',
          level: 5, maxHealth: 50, currentHealth: 0, damage: 10, attackSpeed: 1, damageType: 'physical', accuracy: 60,
      };
      const currentArea = mockStartArea;
      const enemiesKilledCount = 0;

      const randomDropItem: EquippableItem = { id: 'random_helm', baseId: 'helm_t1', name: 'Capacete Mágico Aleatório', rarity: 'Mágico', itemType: 'Helm', icon: '', modifiers: [], implicitModifier: null };
      
      // <<< Setup mocks specifically for this test case >>>
      // Mock generateDrop to return the random item when called with just level
      mockGenerateDrop.mockImplementation(() => randomDropItem); // Removed unused _lvl parameter
      // Mock Math.random to ensure the drop chance check passes
      const originalMathRandom = Math.random;
      Math.random = vi.fn(() => 0); // Force drop chance success

      handleEnemyRemoval(
          enemyToRemove, 
          currentArea, 
          enemiesKilledCount, 
          mockSetEnemiesKilledCount, 
          mockSetCurrentEnemy, 
          mockEnemyDeathAnimEndTimeRef, 
          mockEnemySpawnCooldownRef, 
          mockHandleItemDropped, 
          mockUpdateCharacter, 
          mockSaveCharacter, 
          mockDisplayTemporaryMessage
      );

      // Assertions
      expect(mockGenerateDrop).toHaveBeenCalledWith(enemyToRemove.level);
      expect(mockHandleItemDropped).toHaveBeenCalledWith(randomDropItem);

      Math.random = originalMathRandom; // Restore original Math.random
      // No need to restore generateDrop mock, beforeEach handles it
  });
}); 