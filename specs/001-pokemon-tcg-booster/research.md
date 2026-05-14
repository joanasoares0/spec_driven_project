# Research: Pokémon TCG 151 Booster Pack Opener

**Phase 0 output** | Branch: `001-pokemon-tcg-booster` | Date: 2026-05-13

---

## Decision 1: JavaScript Approach — Vanilla JS + Vite

**Decision**: Vanilla JavaScript ES2022 with Vite 5 as the build/dev tool. No UI framework.

**Rationale**: The app has exactly two views (pack opening, collection grid), ~165 static
DOM card elements, and state simple enough to manage with a plain JS module pattern.
Vanilla JS demonstrates core front-end skills for a portfolio piece, keeps the production
bundle under ~20 KB (excluding card images), and avoids reactive framework overhead
(~30–100 KB runtime) for a problem that doesn't need it. Vite provides instant HMR during
development and produces an optimised, tree-shaken static bundle.

**Alternatives considered**:
- Vue 3 Composition API: Good reactivity model for the collection grid, but adds ~34 KB
  runtime and a compilation step that adds no correctness guarantees at this scale.
- Svelte: Minimal runtime, good fit, but obscures JavaScript fundamentals for a portfolio
  project and is less recognisable to reviewers than vanilla JS.
- React: Higher boilerplate, larger bundle, unnecessary abstraction for two-view app.

---

## Decision 2: Seeded RNG — mulberry32

**Decision**: Implement mulberry32 as a pure JS function in `src/modules/rng.js`.

**Rationale**: mulberry32 is a single 32-bit state PRNG that:
- Takes a numeric seed and returns a generator function producing uniform [0, 1) floats.
- Is deterministic: same seed always produces same sequence — mandatory for
  Constitution Principle III distribution tests.
- Passes the SmallCrush statistical battery.
- Requires zero dependencies and ~6 lines of code.
- Its simplicity makes it auditable, matching the "testable distribution" principle.

```js
// Reference implementation (6 lines, zero deps)
export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

**Alternatives considered**:
- `Math.random()`: Not seedable — ruled out by Principle III.
- xoshiro128**: Higher quality but same testability requirements; complexity not justified.
- `seedrandom` npm package: External dependency not needed when mulberry32 is 6 lines.

**Test strategy**: `tests/rng.test.js` verifies:
1. Same seed → identical sequence across multiple calls (determinism).
2. Output range is [0, 1) (no boundary violations).
3. Chi-squared uniformity test over 100,000 draws (distribution quality).

---

## Decision 3: Card Flip Animation — Pure CSS 3D Transforms

**Decision**: CSS `rotateY` transition using `transform-style: preserve-3d` and
`backface-visibility: hidden` on `.card-front` and `.card-back` elements.

**Rationale**:
- GPU-accelerated via compositor layer (no layout/paint on each frame).
- Works in Chrome, Firefox, Safari (all target browsers) without polyfills.
- Triggered by a single JS class toggle (`.card--revealed`), keeping animation
  logic entirely in CSS and JS business logic in `pack.js`.
- Respects `prefers-reduced-motion`: wrap the transition in a media query and
  fall back to an instant swap for accessibility.
- Zero JS animation library dependency.

**Key CSS pattern**:
```css
.card { perspective: 800px; }
.card__inner { transform-style: preserve-3d; transition: transform 0.6s ease; }
.card--revealed .card__inner { transform: rotateY(180deg); }
.card__front, .card__back { backface-visibility: hidden; }
.card__back { transform: rotateY(180deg); }

@media (prefers-reduced-motion: reduce) {
  .card__inner { transition: none; }
}
```

**Alternatives considered**:
- Web Animations API: More JS control but identical visual result; adds code without benefit.
- GSAP / Anime.js: External deps (~30–60 KB) for an effect achievable in 10 lines of CSS.

---

## Decision 4: Collection Persistence — localStorage JSON

**Decision**: Persist collection as `localStorage.setItem('ptcg_collection', JSON.stringify(map))`
where `map` is `{ [cardId: string]: number }`.

**Rationale**:
- Synchronous API — no async complexity for read/write.
- Capacity: ~165 entries × ~20 bytes each ≈ 3.3 KB, well under the 5 MB localStorage limit.
- JSON parse/stringify is fast and reliable for this payload size.
- A single key keeps the data model trivial to inspect and debug via DevTools.

**Alternatives considered**:
- IndexedDB: Async, more complex API — justified only for large datasets or binary data.
  Not needed here.
- sessionStorage: Does not persist across browser close — ruled out by FR-010.
- Cookie: 4 KB limit, sent with every request — not applicable (no requests).

**Failure mode**: If `localStorage` is unavailable (private browsing quota exceeded), the
collection module logs a warning and the game continues without persistence. (Covered by
Edge Case in spec.)

---

## Decision 5: Card Manifest — `assets/data/cards.json`

**Decision**: `download_cards.py` generates `assets/data/cards.json` after downloading
images. The browser loads this file at startup to build the rarity pools and the full
collection grid.

**Rationale**:
- The frontend needs complete card metadata (165 entries) before pack generation can begin.
- Loading a single JSON file at startup is faster and simpler than querying the pokemontcg.io
  API at runtime (which would add CORS handling, rate limits, and require network access
  during play).
- Keeps the app offline-capable after the developer runs the setup script once.
- Eliminates runtime API keys or CORS concerns.

**Manifest format**: See `contracts/cards-manifest.md`.

---

## Decision 6: Python Setup Script — `requests` + Standard Library

**Decision**: `download_cards.py` uses `requests` for HTTP and `pathlib`/`json`/`os` from
the standard library. No other third-party dependencies.

**Rationale**:
- `requests` is the de-facto standard for Python HTTP; available via `pip install requests`.
- The pokemontcg.io v2 API returns paginated JSON; one request with `pageSize=250` retrieves
  all ~165 sv3pt5 cards in a single call (well under the 250-card page limit).
- Image downloads: one GET per card image URL (from `images.large` field in API response).
- Rate limit: pokemontcg.io allows 1,000 requests/day without an API key. The script makes
  1 (card list) + ~165 (images) = ~166 requests — within limit.
- Optional: `POKEMONTCG_API_KEY` environment variable elevates to 20,000 req/day.

**Idempotency**: Script checks if `assets/<folder>/<id>.jpg` already exists before
downloading; skips existing files. Safe to re-run.

**cards.json generation**: After all images are downloaded, the script writes
`assets/data/cards.json` with the full card metadata array.

---

## sv3pt5 Card Pool Sizes (Approximate — verify by running `download_cards.py`)

| Folder | Rarity API strings | Approx. count |
|--------|--------------------|--------------|
| 01_comum | Common | ~66 |
| 02_incomum | Uncommon | ~41 |
| 03_raras | Rare, Rare Holo | ~16 |
| 04_duplo_raras | Double Rare, Rare Ultra, Rare Holo EX/GX/V/VMAX | ~16 |
| 05_arte_secreta | Illustration Rare | ~17 |
| 06_duplo_arte_secreta | Special Illustration Rare, Rare Rainbow, Rare Secret | ~26 |
| 07_legendária | Hyper Rare | ~7 |

**Pack feasibility**: All pools are sufficiently sized. Even the smallest (Legendary, ~7)
is enough for slot 6 draws without pool exhaustion within a single pack of 6.

**Note**: The spec's pool-exhaustion edge case (FR fallback to next common tier) should
still be implemented, but is unlikely to trigger for this set given pool sizes above.

---

## All NEEDS CLARIFICATION Items: Resolved

| Item | Resolution |
|------|-----------|
| JS framework | Vanilla JS + Vite — no framework |
| RNG algorithm | mulberry32 — seedable, 6-line implementation |
| Animation approach | Pure CSS 3D flip — no library |
| Persistence mechanism | localStorage JSON — synchronous, sufficient capacity |
| Card data at runtime | Loaded from `assets/data/cards.json` manifest |
| Python HTTP library | `requests` — one dep, standard for Python HTTP |
