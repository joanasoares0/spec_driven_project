import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/modules/rng.js';

describe('mulberry32', () => {
  it('produces identical sequences for the same seed', () => {
    const g1 = mulberry32(42);
    const g2 = mulberry32(42);
    for (let i = 0; i < 20; i++) {
      expect(g1()).toBe(g2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const g1 = mulberry32(1);
    const g2 = mulberry32(2);
    let different = false;
    for (let i = 0; i < 20; i++) {
      if (g1() !== g2()) { different = true; break; }
    }
    expect(different).toBe(true);
  });

  it('all 10,000 values are in [0, 1)', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 10000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('passes chi-squared uniformity test over 100,000 draws', () => {
    const rng = mulberry32(1337);
    const buckets = new Array(10).fill(0);
    const N = 100000;
    for (let i = 0; i < N; i++) {
      buckets[Math.floor(rng() * 10)]++;
    }
    const expected = N / 10;
    const chi2 = buckets.reduce((sum, obs) => sum + ((obs - expected) ** 2) / expected, 0);
    // Critical value for 9 degrees of freedom at p=0.001 is 27.88
    expect(chi2).toBeLessThan(27.88);
  });
});
