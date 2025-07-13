import { describe, it, expect } from 'vitest';
import {
  calculateTravelTime,
  getMarkerCenter,
  getMapConnectionLines,
  isAreaConnected,
  MIN_TRAVEL_TIME_MS
} from './mapUtils';

describe('mapUtils', () => {
  it('calculateTravelTime aplica o multiplicador de velocidade e respeita o mínimo', () => {
    expect(calculateTravelTime(1000, 0)).toBe(1000);
    expect(calculateTravelTime(1000, 50)).toBe(500);
    expect(calculateTravelTime(1000, 100)).toBe(MIN_TRAVEL_TIME_MS);
    expect(calculateTravelTime(400, 0)).toBe(MIN_TRAVEL_TIME_MS);
  });

  it('getMarkerCenter retorna centro ajustado', () => {
    const pos = { left: '10', top: '20' };
    const center = getMarkerCenter(pos);
    expect(center.x).toBe('11.5%');
    expect(center.y).toBe('21.5%');
    const center2 = getMarkerCenter(pos, 2);
    expect(center2.x).toBe('12%');
    expect(center2.y).toBe('22%');
  });

  it('getMapConnectionLines retorna linhas corretas entre áreas desbloqueadas', () => {
    const locations = [
      { id: 'a', position: { left: '0', top: '0' }, connections: ['b'] },
      { id: 'b', position: { left: '10', top: '10' }, connections: ['a', 'c'] },
      { id: 'c', position: { left: '20', top: '20' }, connections: ['b'] },
    ];
    const unlocked = new Set(['a', 'b', 'c']);
    const lines = getMapConnectionLines(locations as unknown, unlocked);
    expect(lines.length).toBe(2); // a-b, b-c
    expect(lines[0]).toHaveProperty('key');
    expect(lines[0]).toHaveProperty('x1');
    expect(lines[0]).toHaveProperty('y1');
    expect(lines[0]).toHaveProperty('x2');
    expect(lines[0]).toHaveProperty('y2');
  });

  it('isAreaConnected retorna true se áreas são conectadas', () => {
    const locations = [
      { id: 'a', connections: ['b'] },
      { id: 'b', connections: ['a', 'c'] },
      { id: 'c', connections: ['b'] },
    ];
    expect(isAreaConnected('a', 'b', locations as unknown)).toBe(true);
    expect(isAreaConnected('b', 'c', locations as unknown)).toBe(true);
    expect(isAreaConnected('a', 'c', locations as unknown)).toBe(false);
    expect(isAreaConnected(null, 'b', locations as unknown)).toBe(false);
  });
}); 