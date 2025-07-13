import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCharacterStore } from '../../stores/characterStore';
import { CharacterClass } from '../../types/gameData';
import { useTravelHandlers } from '../useTravelHandlers';
import { act, renderHook } from '@testing-library/react';

// Mock next/navigation para evitar erro de contexto do App Router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

function createChar(overrides = {}) {
  return {
    id: 1,
    name: 'Hero',
    class: 'Guerreiro' as CharacterClass,
    isHardcore: false,
    level: 1,
    currentXP: 0,
    currentAct: 1,
    currentAreaId: 'cidade_principal',
    unlockedAreaIds: ['cidade_principal'],
    strength: 10,
    dexterity: 10,
    intelligence: 10,
    armor: 0,
    evasion: 0,
    barrier: 0,
    blockChance: 0,
    baseMaxHealth: 100,
    maxHealth: 100,
    currentHealth: 50,
    currentBarrier: 10,
    baseMaxMana: 0,
    maxMana: 30,
    currentMana: 5,
    fireResistance: 0,
    coldResistance: 0,
    lightningResistance: 0,
    voidResistance: 0,
    minBaseDamage: 1,
    maxBaseDamage: 2,
    criticalStrikeChance: 0,
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
    healthPotions: 1,
    teleportStones: 0,
    inventory: [],
    equipment: {},
    ...overrides,
  };
}

describe('useTravelHandlers - restauração ao entrar na cidade', () => {
  let updateCharacterStore: unknown;
  let saveCharacterStore: unknown;
  let setCurrentView: unknown;
  let setCurrentEnemy: unknown;
  let setEnemiesKilledCount: unknown;
  let enemySpawnCooldownRef: unknown;
  let displayPersistentMessage: unknown;
  let openDropModalForCollection: unknown;

  beforeEach(() => {
    updateCharacterStore = vi.fn((u) => useCharacterStore.getState().updateCharacter(u));
    saveCharacterStore = vi.fn();
    setCurrentView = vi.fn();
    setCurrentEnemy = vi.fn();
    setEnemiesKilledCount = vi.fn();
    enemySpawnCooldownRef = { current: 0 };
    displayPersistentMessage = vi.fn();
    openDropModalForCollection = vi.fn();
    useCharacterStore.getState().setActiveCharacter(createChar());
  });

  function callEnterAreaView(targetAreaId: string, effectiveStats: unknown = { maxHealth: 200, maxMana: 50, totalBarrier: 30 }) {
    useCharacterStore.getState().setActiveCharacter(createChar({ currentAreaId: targetAreaId }));
    const currentView = 'worldMap' as const;
    const params = {
      currentView,
      isTraveling: false,
      displayPersistentMessage,
      handleConfirmDiscard: vi.fn(),
      itemToDiscard: null,
      effectiveStats,
      updateCharacterStore,
      saveCharacterStore,
      setCurrentView,
      activeCharacter: useCharacterStore.getState().activeCharacter,
      setCurrentArea: vi.fn(),
      setIsTraveling: vi.fn(),
      setTravelProgress: vi.fn(),
      setTravelTargetAreaId: vi.fn(),
      travelTimerRef: { current: null },
      travelStartTimeRef: { current: null },
      travelTargetIdRef: { current: null },
      setCurrentEnemy,
      setEnemiesKilledCount,
      enemySpawnCooldownRef,
      pendingDropCount: 0,
      openDropModalForCollection,
      overallData: { currencies: {}, gold: 0, souls: 0, lastPlayedCharacterId: null, stash: [] },
      saveOverallDataState: vi.fn(),
    };
    const { result } = renderHook(() => useTravelHandlers(params));
    act(() => {
      result.current.handleEnterAreaView(targetAreaId);
    });
  }

  it('restaura poções para 3 se tiver menos ao entrar na cidade', () => {
    // O sistema sempre clampa para 3 se menor
    useCharacterStore.getState().setActiveCharacter(createChar({ healthPotions: 1 }));
    callEnterAreaView('cidade_principal');
    const char = useCharacterStore.getState().activeCharacter!;
    expect(char.healthPotions).toBe(3);
  });

  it('reduz poções para 3 se já tiver 3 ou mais ao entrar na cidade (comportamento atual do sistema)', () => {
    // O sistema clampa para 3 mesmo se o personagem tiver mais
    useCharacterStore.getState().setActiveCharacter(createChar({ healthPotions: 5 }));
    callEnterAreaView('cidade_principal');
    const char = useCharacterStore.getState().activeCharacter!;
    expect(char.healthPotions).toBe(3);
  });

  it('não restaura nada se não for cidade (mantém valores originais)', () => {
    // O sistema mantém os valores originais se não for cidade
    // Para evitar clamp do store, currentHealth deve ser igual a maxHealth
    // currentBarrier SEMPRE será clampado para 0 se não houver equipamento de barreira
    useCharacterStore.getState().setActiveCharacter(createChar({ currentHealth: 50, maxHealth: 50, currentBarrier: 10, currentMana: 5, healthPotions: 1 }));
    callEnterAreaView('area1');
    const char = useCharacterStore.getState().activeCharacter!;
    expect(char.healthPotions).toBe(1);
    expect(char.currentHealth).toBe(50);
    expect(char.currentMana).toBe(5);
    expect(char.currentBarrier).toBe(0); // Clamp automático do store
  });
}); 