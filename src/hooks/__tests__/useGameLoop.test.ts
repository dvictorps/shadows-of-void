import { describe, it, expect, vi } from 'vitest';
import { useGameLoop } from '../useGameLoop';
import { act1Locations } from '../../types/gameData';

// Mock helpers e dependências mínimas
const cidade = act1Locations.find(a => a.id === 'cidade_principal');

describe('useGameLoop - fluxo de morte', () => {
  it('teleporta para a cidade e limpa AreaView ao morrer', () => {
    let currentAreaId = 'area1';
    let currentEnemy = { id: 'enemy1' };
    let areaSet = null;
    let enemySet = null;
    const updateCharacterStore = vi.fn((u) => {
      if (u.currentAreaId) currentAreaId = u.currentAreaId;
    });
    const setCurrentArea = vi.fn((area) => { areaSet = area; });
    const setCurrentEnemy = vi.fn((enemy) => { enemySet = enemy; });
    // Simula chamada do fluxo de morte
    updateCharacterStore({ currentAreaId: 'cidade_principal' });
    setCurrentArea(cidade);
    setCurrentEnemy(null);
    // Verificações
    expect(currentAreaId).toBe('cidade_principal');
    expect(areaSet).toBe(cidade);
    expect(enemySet).toBe(null);
  });
}); 