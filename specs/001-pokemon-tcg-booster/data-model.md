# Data Model: Pokémon TCG 151 Booster Pack Opener

**Phase 1 output** | Branch: `001-pokemon-tcg-booster` | Date: 2026-05-13

---

## Entities

### Card

Represents one Pokémon TCG card in the sv3pt5 set. Immutable after the setup script runs.
Loaded from `assets/data/cards.json` at app startup.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | pokemontcg.io card ID (e.g., `"sv3pt5-1"`). Globally unique. |
| `name` | `string` | Display name (e.g., `"Bulbasaur"`). |
| `number` | `string` | Set number string (e.g., `"001/165"`). Used for sort order. |
| `rarity` | `string` | API rarity string (e.g., `"Common"`, `"Hyper Rare"`). Canonical. |
| `folder` | `RarityFolder` | Local folder identifier (e.g., `"01_comum"`). |
| `imagePath` | `string` | Root-relative path (e.g., `"assets/01_comum/sv3pt5-1.jpg"`). |

**Uniqueness**: `id` is the primary key. `number` is unique within the set but `id` is
used everywhere to avoid ambiguity.

**Validation**: `imagePath` MUST match the pattern `assets/<folder>/<id>.jpg`.

---

### RarityFolder

Enum of the 7 asset folder identifiers. Maps API rarity strings to local folders.

| Value | API Rarity Strings |
|-------|--------------------|
| `"01_comum"` | `"Common"` |
| `"02_incomum"` | `"Uncommon"` |
| `"03_raras"` | `"Rare"`, `"Rare Holo"` |
| `"04_duplo_raras"` | `"Double Rare"`, `"Rare Ultra"`, `"Rare Holo EX"`, `"Rare Holo GX"`, `"Rare Holo V"`, `"Rare Holo VMAX"` |
| `"05_arte_secreta"` | `"Illustration Rare"` |
| `"06_duplo_arte_secreta"` | `"Special Illustration Rare"`, `"Rare Rainbow"`, `"Rare Secret"` |
| `"07_legendária"` | `"Hyper Rare"` |

**Rule**: Any API rarity string not matching the above MUST be logged as a warning and the
card skipped (not downloaded) during setup script execution.

---

### RarityPool

Runtime structure (not persisted). Derived by grouping cards from `cards.json` by `folder`.
Used exclusively by `pack.js` for pack generation.

```
RarityPool = {
  "01_comum":              Card[],   // ~66 entries
  "02_incomum":            Card[],   // ~41 entries
  "03_raras":              Card[],   // ~16 entries
  "04_duplo_raras":        Card[],   // ~16 entries
  "05_arte_secreta":       Card[],   // ~17 entries
  "06_duplo_arte_secreta": Card[],   // ~26 entries
  "07_legendária":         Card[]    // ~7 entries
}
```

---

### Pack

Ephemeral — exists only during a pack-opening session. Never persisted.

| Field | Type | Description |
|-------|------|-------------|
| `cards` | `Card[6]` | Exactly 6 Card references. All unique (no duplicate `id`). |
| `revealIndex` | `number` | Index of the next card to reveal (0–5). `-1` = not started. |

**Slot distribution rules** (encoded in `pack.js`, not stored):

| Slot | Pool(s) | Probability |
|------|---------|-------------|
| 1 | `01_comum` | 100% |
| 2 | `01_comum` | 100% |
| 3 | `01_comum` | 100% |
| 4 | `01_comum` | 100% |
| 5 | `02_incomum` | 90% |
| 5 | `03_raras` | 10% |
| 6 | `03_raras` | 60% |
| 6 | `04_duplo_raras` | 25% |
| 6 | `05_arte_secreta` | 10% |
| 6 | `06_duplo_arte_secreta` | 4.5% |
| 6 | `07_legendária` | 0.5% |

**Uniqueness constraint**: Each slot draw MUST sample without replacement from a
working set of already-chosen card IDs for this pack. If the target pool has no
unchosen cards (pool exhaustion), fall back to the next-more-common folder.

**Stateless**: Each pack draw is independent. No pity counter or session-level state.

---

### Collection

Persisted in `localStorage` under key `"ptcg_collection"`. Represents the player's
cumulative obtained cards across all sessions.

```
Collection = { [cardId: string]: number }
// Example: { "sv3pt5-1": 2, "sv3pt5-45": 1, "sv3pt5-139": 3 }
```

**Rules**:
- Key: a valid `Card.id` from `cards.json`.
- Value: integer ≥ 1 (a key MUST NOT be stored with value 0; remove it instead).
- Missing key = 0 copies (player has never pulled this card).
- Maximum payload: ~165 entries × ~22 bytes ≈ 3.6 KB (well under localStorage 5 MB limit).

**State transitions**:
```
ADD CARD(id):
  collection[id] = (collection[id] ?? 0) + 1
  localStorage.setItem('ptcg_collection', JSON.stringify(collection))

READ(id):
  return collection[id] ?? 0

GET_ALL():
  return JSON.parse(localStorage.getItem('ptcg_collection') ?? '{}')
```

---

### AppState

Runtime-only. Not persisted. Tracks which view is active and the current pack session.

| Field | Type | Description |
|-------|------|-------------|
| `activeView` | `"pack" \| "collection"` | Which tab is currently rendered. |
| `currentPack` | `Pack \| null` | Active pack being revealed; `null` when idle. |
| `cards` | `Card[]` | All 165 cards loaded from `cards.json` at startup. |
| `rarityPools` | `RarityPool` | Cards grouped by folder; derived from `cards` on load. |

---

## Relationships

```
cards.json ──loads──▶ Card[] ──groups──▶ RarityPool
                                              │
                                         pack.js draws
                                              │
                                              ▼
                                           Pack (ephemeral)
                                              │
                                     on reveal complete
                                              │
                                              ▼
                                        Collection (localStorage)
                                              │
                                     collectionView.js renders
                                              │
                                              ▼
                                    Full 165-card grid (silhouettes + owned)
```

---

## localStorage Key Registry

| Key | Type | Written by | Read by | Purpose |
|-----|------|-----------|---------|---------|
| `ptcg_collection` | JSON string | `collection.js` | `collection.js`, `collectionView.js` | Player's card counts |
