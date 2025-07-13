import { describe, it, expect, beforeEach } from 'vitest';
import { useCharacterStore } from '../../stores/characterStore';
import { useInventoryManager } from '../useInventoryManager';
import { EquippableItem, Character } from '../../types/gameData';
import { act, renderHook } from '@testing-library/react';
import { Dispatch, SetStateAction } from 'react';

const createTestCharacter = (): Character => ({
  id: 1,
  name: 'TestHero',
  class: 'Guerreiro',
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
  currentHealth: 100,
  currentBarrier: 0,
  baseMaxMana: 0,
  maxMana: 0,
  currentMana: 0,
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
  healthPotions: 3,
  teleportStones: 0,
  inventory: [],
  equipment: {},
});

const createTestItem = (id: string): EquippableItem => ({
  id,
  baseId: 'sword_base',
  name: `Sword${id}`,
  rarity: 'Normal',
  itemType: 'one_handed_sword',
  icon: '',
  modifiers: [],
  implicitModifier: null,
});

describe('useInventoryManager (integrado ao store)', () => {
  let setIsConfirmDiscardOpen: Dispatch<SetStateAction<boolean>>;
  let setItemToDiscard: Dispatch<SetStateAction<EquippableItem | null>>;
  let setIsRequirementFailModalOpen: Dispatch<SetStateAction<boolean>>;
  let setItemFailedRequirements: Dispatch<SetStateAction<EquippableItem | null>>;

  beforeEach(() => {
    useCharacterStore.getState().setActiveCharacter(createTestCharacter());
    setIsConfirmDiscardOpen = () => {};
    setItemToDiscard = () => {};
    setIsRequirementFailModalOpen = () => {};
    setItemFailedRequirements = () => {};
  });

  it('adiciona item ao inventário via updateCharacter', () => {
    const item = createTestItem('1');
    act(() => {
      useCharacterStore.getState().updateCharacter({ inventory: [item] });
    });
    const updated = useCharacterStore.getState().activeCharacter!;
    expect(updated.inventory).toContainEqual(item);
  });

  it('descarta item do inventário via handleConfirmDiscard', () => {
    const item = createTestItem('2');
    act(() => {
      useCharacterStore.getState().updateCharacter({ inventory: [item] });
    });
    const { result } = renderHook(() => useInventoryManager({
      setIsConfirmDiscardOpen,
      setItemToDiscard,
      setIsRequirementFailModalOpen,
      setItemFailedRequirements,
    }));
    act(() => {
      result.current.handleConfirmDiscard(item);
    });
    const updated = useCharacterStore.getState().activeCharacter!;
    expect(updated.inventory).not.toContainEqual(item);
  });
}); 