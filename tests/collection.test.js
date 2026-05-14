import { describe, it, expect, beforeEach } from 'vitest';
import { getAll, get, add } from '../src/modules/collection.js';

beforeEach(() => {
  localStorage.clear();
});

describe('collection', () => {
  it('returns empty object when no data exists', () => {
    expect(getAll()).toEqual({});
  });

  it('get returns 0 for an unowned card', () => {
    expect(get('sv3pt5-1')).toBe(0);
  });

  it('add increments copy count on each call', () => {
    add('sv3pt5-1');
    expect(get('sv3pt5-1')).toBe(1);
    add('sv3pt5-1');
    expect(get('sv3pt5-1')).toBe(2);
    add('sv3pt5-1');
    expect(get('sv3pt5-1')).toBe(3);
  });

  it('tracks multiple different cards independently', () => {
    add('sv3pt5-1');
    add('sv3pt5-2');
    add('sv3pt5-1');
    const all = getAll();
    expect(all['sv3pt5-1']).toBe(2);
    expect(all['sv3pt5-2']).toBe(1);
  });

  it('getAll returns only cards that have been added', () => {
    add('sv3pt5-5');
    const all = getAll();
    expect(Object.keys(all)).toHaveLength(1);
    expect(all['sv3pt5-5']).toBe(1);
  });

  it('persists across separate load() calls', () => {
    add('sv3pt5-10');
    // Simulates a separate module call by calling getAll again
    expect(getAll()['sv3pt5-10']).toBe(1);
  });

  it('recovers gracefully from corrupt JSON and resets to empty', () => {
    localStorage.setItem('ptcg_collection', 'not-valid-json{{{');
    expect(getAll()).toEqual({});
  });

  it('continues to work correctly after corrupt JSON recovery', () => {
    localStorage.setItem('ptcg_collection', 'bad');
    getAll(); // triggers recovery
    add('sv3pt5-3');
    expect(get('sv3pt5-3')).toBe(1);
  });
});
