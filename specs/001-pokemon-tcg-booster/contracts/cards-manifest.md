# Contract: Card Manifest (`assets/data/cards.json`)

**Producer**: `download_cards.py` (writes after all images are downloaded)
**Consumer**: `src/main.js` (reads once at app startup via `fetch('assets/data/cards.json')`)
**Stability**: Written once per developer setup; never modified at runtime.

---

## Schema

`cards.json` is a JSON array of Card objects.

```json
[
  {
    "id":        "sv3pt5-1",
    "name":      "Bulbasaur",
    "number":    "001/165",
    "rarity":    "Common",
    "folder":    "01_comum",
    "imagePath": "assets/01_comum/sv3pt5-1.jpg"
  },
  ...
]
```

### Field Definitions

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | string | Non-empty. Unique across array. Format: `sv3pt5-<N>`. |
| `name` | string | Non-empty. Display name from API. |
| `number` | string | Format: `NNN/165` (e.g., `"001/165"`). Used for grid sort order. |
| `rarity` | string | One of the canonical API rarity strings (see RarityFolder mapping). |
| `folder` | string | One of the 7 `RarityFolder` values (e.g., `"01_comum"`). |
| `imagePath` | string | Root-relative. MUST match `assets/<folder>/<id>.jpg`. |

### Ordering

Array is sorted ascending by `number` (lexicographic on the NNN prefix). This order is
used as the default display order in the collection grid.

### Integrity Rules

- No two entries share the same `id`.
- `folder` MUST be consistent with `rarity` per the RarityFolder mapping table.
- `imagePath` MUST reference a file that exists on disk after the setup script completes.
- The array MUST contain at least one entry for each of the 7 `RarityFolder` values.

---

## Versioning

This contract is not versioned independently. If the pokemontcg.io API changes rarity
string values, re-run `download_cards.py` to regenerate the file. The consumer
(`src/main.js`) reads the file as-is with no fallback for missing fields.

---

## Error Handling (consumer side)

| Failure | Consumer behaviour |
|---------|-------------------|
| File not found (404) | Show "Assets not ready — run `download_cards.py`" error overlay. App halts. |
| JSON parse error | Same error overlay. |
| Entry missing `imagePath` file on disk | Render silhouette placeholder; card still usable in pack generation. |
