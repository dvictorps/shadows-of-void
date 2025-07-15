import { loadCharacters, saveCharacters, loadOverallData, saveOverallData } from './localStorage';
import { defaultCharacters, defaultOverallData, Character, OverallGameData } from '../types/gameData';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('localStorage utils', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('salva e carrega personagens normalmente', () => {
    const chars: Character[] = [
      { ...defaultCharacters[0], id: 1, name: 'Hero', isHardcore: false },
    ];
    saveCharacters(chars, false);
    const loaded = loadCharacters(false);
    expect(loaded[0].name).toBe('Hero');
  });

  it('salva e carrega personagens hardcore', () => {
    const chars: Character[] = [
      { ...defaultCharacters[0], id: 2, name: 'Hardcore', isHardcore: true },
    ];
    saveCharacters(chars, true);
    const loaded = loadCharacters(true);
    expect(loaded[0].name).toBe('Hardcore');
  });

  it('retorna defaultCharacters se não houver nada salvo', () => {
    expect(loadCharacters(false)).toEqual(defaultCharacters);
    expect(loadCharacters(true)).toEqual(defaultCharacters);
  });

  it('salva e carrega overallData normalmente', () => {
    const data: OverallGameData = { ...defaultOverallData, gold: 1234 };
    saveOverallData(data, false);
    const loaded = loadOverallData(false);
    expect(loaded.gold).toBe(1234);
  });

  it('retorna defaultOverallData se não houver nada salvo', () => {
    expect(loadOverallData(false)).toEqual(defaultOverallData);
    expect(loadOverallData(true)).toEqual(defaultOverallData);
  });

  it('lida com erro de JSON inválido', () => {
    localStorage.setItem('shadowsOfVoid_characters', 'invalid_json');
    expect(loadCharacters(false)).toEqual(defaultCharacters);
  });
}); 