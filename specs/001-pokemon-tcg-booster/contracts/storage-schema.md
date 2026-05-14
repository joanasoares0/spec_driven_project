# Contract: localStorage Schema

**Writer**: `src/modules/collection.js`
**Readers**: `src/modules/collection.js`, `src/modules/ui/collectionView.js`
**Persistence**: Survives browser close/reopen (localStorage).

---

## Keys

### `ptcg_collection`

Stores the player's full card collection as a JSON-encoded object.

**Type**: `string` (JSON-encoded `CollectionMap`)

**Format**:
```json
{
  "sv3pt5-1":   2,
  "sv3pt5-45":  1,
  "sv3pt5-139": 3
}
```

**Rules**:
- Keys are `Card.id` strings matching entries in `assets/data/cards.json`.
- Values are positive integers (≥ 1). A key with value `0` MUST NOT be stored.
- Absence of a key means the player owns 0 copies of that card.
- Maximum expected size: ~3.6 KB (165 entries). No compression needed.

**State transitions**:

| Operation | Effect |
|-----------|--------|
| Pull card `id` | `map[id] = (map[id] ?? 0) + 1` then re-serialise |
| Read copies of `id` | `map[id] ?? 0` |
| Read all owned cards | `Object.keys(map)` |
| Check if card owned | `id in map` |

**Initialisation**: If `ptcg_collection` key is absent (fresh browser), treat as `{}`.

**Corruption recovery**: If `JSON.parse` throws, reset key to `"{}"` and log a warning.
Do not crash the app.

---

## No Other Keys

The application MUST NOT write any other keys to `localStorage`. All runtime state
(active view, current pack) is held in memory only and discarded on page close.
