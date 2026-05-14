/**
 * Slot 5 cumulative-weight distribution: Uncommon 90% | Rare 10%
 */
const SLOT5_DIST = [
  { folder: '02_incomum', weight: 0.90 },
  { folder: '03_raras',   weight: 1.00 },
];

/**
 * Slot 6 cumulative-weight distribution:
 * Rare 60% | Double Rare 25% | Art Rare 10% | Double Art 4.5% | Legendary 0.5%
 */
const SLOT6_DIST = [
  { folder: '03_raras',              weight: 0.600 },
  { folder: '04_duplo_raras',        weight: 0.850 },
  { folder: '05_arte_secreta',       weight: 0.950 },
  { folder: '06_duplo_arte_secreta', weight: 0.995 },
  { folder: '07_legendária',        weight: 1.000 },
];

/**
 * Fallback order when a pool is exhausted (most-rare to most-common).
 */
const FALLBACK_ORDER = [
  '07_legendária',
  '06_duplo_arte_secreta',
  '05_arte_secreta',
  '04_duplo_raras',
  '03_raras',
  '02_incomum',
  '01_comum',
];

function pickFromDist(dist, rng) {
  const r = rng();
  for (const { folder, weight } of dist) {
    if (r < weight) return folder;
  }
  return dist[dist.length - 1].folder;
}

function pickUnique(pool, used, rng) {
  const available = (pool || []).filter(c => !used.has(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(rng() * available.length)];
}

function drawSlot(folder, rarityPools, used, rng) {
  let card = pickUnique(rarityPools[folder], used, rng);
  if (!card) {
    for (const fb of FALLBACK_ORDER) {
      if (fb === folder) continue;
      card = pickUnique(rarityPools[fb], used, rng);
      if (card) break;
    }
  }
  if (card) used.add(card.id);
  return card;
}

/**
 * Draw a pack of 6 unique cards following the slot distribution rules.
 *
 * @param {Record<string, object[]>} rarityPools  Cards grouped by folder
 * @param {() => number} rng  Seeded RNG function from mulberry32()
 * @returns {{ cards: object[], revealIndex: number }}
 */
export function drawPack(rarityPools, rng) {
  const used = new Set();
  const cards = [];

  // Slots 1–4: always Common
  for (let i = 0; i < 4; i++) {
    const card = drawSlot('01_comum', rarityPools, used, rng);
    if (card) cards.push(card);
  }

  // Slot 5: 90% Uncommon / 10% Rare
  const slot5Folder = pickFromDist(SLOT5_DIST, rng);
  const slot5Card = drawSlot(slot5Folder, rarityPools, used, rng);
  if (slot5Card) cards.push(slot5Card);

  // Slot 6: 60/25/10/4.5/0.5 distribution
  const slot6Folder = pickFromDist(SLOT6_DIST, rng);
  const slot6Card = drawSlot(slot6Folder, rarityPools, used, rng);
  if (slot6Card) cards.push(slot6Card);

  return { cards, revealIndex: -1 };
}
