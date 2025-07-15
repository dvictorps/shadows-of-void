import { describe, it, expect, vi } from 'vitest';
import {
  isTown,
  isAreaComplete,
  getBossPhase,
  getShakeKeyframes,
  getScreenShakeKeyframes,
  getSimplifiedHitType,
  getRandomFloatingPosition,
  getRandomId,
  playBossSpawnEffects
} from './areaUtils';
import { MapLocation, EnemyType } from '../types/gameData';
import { RefObject } from 'react';

describe('areaUtils', () => {
  it('isTown retorna true apenas para cidade_principal', () => {
    expect(isTown({ id: 'cidade_principal' } as MapLocation)).toBe(true);
    expect(isTown({ id: 'outra_area' } as MapLocation)).toBe(false);
    expect(isTown(null)).toBe(false);
  });

  it('isAreaComplete retorna correto para boss e áreas normais', () => {
    // Não é cidade, boss vivo, showBossAreaComplete true
    expect(isAreaComplete({ id: 'area1' } as MapLocation, { isBoss: true } as EnemyType, 10, 10, true)).toBe(true);
    // Não é cidade, boss vivo, showBossAreaComplete false
    expect(isAreaComplete({ id: 'area1' } as MapLocation, { isBoss: true } as EnemyType, 10, 10, false)).toBe(false);
    // Não é cidade, área normal, kills suficientes
    expect(isAreaComplete({ id: 'area1' } as MapLocation, null, 10, 10, false)).toBe(true);
    // Não é cidade, área normal, kills insuficientes
    expect(isAreaComplete({ id: 'area1' } as MapLocation, null, 5, 10, false)).toBe(false);
    // É cidade
    expect(isAreaComplete({ id: 'cidade_principal' } as MapLocation, null, 10, 10, false)).toBe(false);
  });

  it('getBossPhase retorna "sprite" se boss e phase none, senão retorna phase', () => {
    expect(getBossPhase({ isBoss: true } as EnemyType, 'none')).toBe('sprite');
    expect(getBossPhase({ isBoss: true } as EnemyType, 'phase1')).toBe('phase1');
    expect(getBossPhase(null, 'none')).toBe('none');
  });

  it('getShakeKeyframes retorna keyframes esperados', () => {
    const kf = getShakeKeyframes();
    expect(Array.isArray(kf.x)).toBe(true);
    expect(typeof kf.transition).toBe('object');
  });

  it('getScreenShakeKeyframes retorna keyframes esperados', () => {
    const kf = getScreenShakeKeyframes();
    expect(Array.isArray(kf.x)).toBe(true);
    expect(Array.isArray(kf.y)).toBe(true);
    expect(typeof kf.transition).toBe('object');
  });

  it('getSimplifiedHitType retorna physical ou elemental', () => {
    expect(getSimplifiedHitType({ type: 'slash' } as { type: string })).toBe('physical');
    expect(getSimplifiedHitType({ type: 'hit' } as { type: string })).toBe('physical');
    expect(getSimplifiedHitType({ type: 'pierce' } as { type: string })).toBe('physical');
    expect(getSimplifiedHitType({ type: 'fire' } as { type: string })).toBe('elemental');
    expect(getSimplifiedHitType({ type: 'ice' } as { type: string })).toBe('elemental');
  });

  it('getRandomFloatingPosition retorna valores dentro do range esperado', () => {
    for (let i = 0; i < 10; i++) {
      const pos = getRandomFloatingPosition();
      expect(pos.x).toBeGreaterThanOrEqual(10);
      expect(pos.x).toBeLessThanOrEqual(20);
      expect(pos.y).toBeGreaterThanOrEqual(70);
      expect(pos.y).toBeLessThanOrEqual(80);
    }
  });

  it('getRandomId retorna string não vazia', () => {
    const id = getRandomId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('playBossSpawnEffects chama triggerScreenShake e manipula classes', () => {
    const triggerScreenShake = vi.fn();
    const ref = { current: { classList: { remove: vi.fn(), add: vi.fn() } } } as unknown as RefObject<HTMLDivElement>;
    playBossSpawnEffects({ spawnSoundPath: '/sound.wav' }, triggerScreenShake, ref);
    expect(triggerScreenShake).toHaveBeenCalled();
    expect(ref.current.classList.remove).toHaveBeenCalledWith('enemy-spawn-initial');
    expect(ref.current.classList.add).toHaveBeenCalledWith('enemy-spawn-visible');
  });
}); 