import { describe, it, expect } from 'vitest';
import { drawPack } from '../src/modules/pack.js';
import { mulberry32 } from '../src/modules/rng.js';

function makePools(overrides = {}) {
  const defaults = {
    '01_comum':              60,
    '02_incomum':            40,
    '03_raras':              16,
    '04_duplo_raras':        16,
    '05_arte_secreta':       16,
    '06_duplo_arte_secreta': 26,
    '07_legendária':         7,
  };
  const pools = {};
  for (const [folder, n] of Object.entries({ ...defaults, ...overrides })) {
    pools[folder] = Array.from({ length: n }, (_, i) => ({
      id: `${folder}-${i}`,
      name: `Card ${folder} ${i}`,
      number: `${String(i + 1).padStart(3, '0')}/165`,
      rarity: folder,
      folder,
      imagePath: `assets/${folder}/${folder}-${i}.jpg`,
    }));
  }
  return pools;
}

const pools = makePools();

describe('drawPack — structure', () => {
  it('returns exactly 6 cards', () => {
    const pack = drawPack(pools, mulberry32(42));
    expect(pack.cards).toHaveLength(6);
  });

  it('initialises revealIndex to -1', () => {
    const pack = drawPack(pools, mulberry32(42));
    expect(pack.revealIndex).toBe(-1);
  });

  it('cards 1–4 are always from 01_comum', () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      const pack = drawPack(pools, rng);
      for (let s = 0; s < 4; s++) {
        expect(pack.cards[s].folder).toBe('01_comum');
      }
    }
  });

  it('no duplicate card IDs in a single pack (100 packs)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const pack = drawPack(pools, rng);
      const ids = pack.cards.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('drawPack — slot 5 distribution (10,000 packs, seed 42, ±2 pp tolerance)', () => {
  const N = 10000;
  let uncommon = 0;
  let rare = 0;

  const rng = mulberry32(42);
  for (let i = 0; i < N; i++) {
    const pack = drawPack(pools, rng);
    const f = pack.cards[4].folder;
    if (f === '02_incomum') uncommon++;
    else if (f === '03_raras') rare++;
  }

  it('Uncommon frequency is 90% ±2 pp', () => {
    expect(uncommon / N).toBeGreaterThanOrEqual(0.88);
    expect(uncommon / N).toBeLessThanOrEqual(0.92);
  });

  it('Rare frequency is 10% ±2 pp', () => {
    expect(rare / N).toBeGreaterThanOrEqual(0.08);
    expect(rare / N).toBeLessThanOrEqual(0.12);
  });
});

describe('drawPack — slot 6 distribution (10,000 packs, seed 42, ±2 pp tolerance)', () => {
  const N = 10000;
  const counts = {
    '03_raras': 0,
    '04_duplo_raras': 0,
    '05_arte_secreta': 0,
    '06_duplo_arte_secreta': 0,
    '07_legendária': 0,
  };

  const rng = mulberry32(42);
  for (let i = 0; i < N; i++) {
    const pack = drawPack(pools, rng);
    const f = pack.cards[5].folder;
    if (f in counts) counts[f]++;
  }

  it('Rare (03) frequency is 60% ±2 pp', () => {
    expect(counts['03_raras'] / N).toBeGreaterThanOrEqual(0.58);
    expect(counts['03_raras'] / N).toBeLessThanOrEqual(0.62);
  });

  it('Double Rare (04) frequency is 25% ±2 pp', () => {
    expect(counts['04_duplo_raras'] / N).toBeGreaterThanOrEqual(0.23);
    expect(counts['04_duplo_raras'] / N).toBeLessThanOrEqual(0.27);
  });

  it('Art Rare (05) frequency is 10% ±2 pp', () => {
    expect(counts['05_arte_secreta'] / N).toBeGreaterThanOrEqual(0.08);
    expect(counts['05_arte_secreta'] / N).toBeLessThanOrEqual(0.12);
  });

  it('Double Art (06) frequency is 4.5% ±2 pp', () => {
    expect(counts['06_duplo_arte_secreta'] / N).toBeGreaterThanOrEqual(0.025);
    expect(counts['06_duplo_arte_secreta'] / N).toBeLessThanOrEqual(0.065);
  });

  it('Legendary (07) frequency is 0.5% ±2 pp', () => {
    expect(counts['07_legendária'] / N).toBeGreaterThanOrEqual(0);
    expect(counts['07_legendária'] / N).toBeLessThanOrEqual(0.025);
  });
});

describe('drawPack — edge cases', () => {
  it('falls back gracefully when common pool is tiny (1 card)', () => {
    const tinyPools = makePools({ '01_comum': 1 });
    const pack = drawPack(tinyPools, mulberry32(42));
    expect(pack.cards).toHaveLength(6);
    // No duplicate IDs even with pool exhaustion
    const ids = pack.cards.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
