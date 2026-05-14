---
description: "Task list for Pokémon TCG 151 Booster Pack Opener"
---

# Tasks: Pokémon TCG 151 Booster Pack Opener

**Input**: Design documents from `specs/001-pokemon-tcg-booster/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅

**Tests**: RNG and pack-distribution tests are REQUIRED (Constitution Principle III + SC-002).
Collection and view tests are included for correctness validation of persistence logic.

**Organization**: Tasks grouped by user story to enable independent delivery of each increment.

## Format: `[ID] [P?] [Story?] [Category?] Description — file path`

- **[P]**: Can run in parallel (no dependency on incomplete peer tasks, different files)
- **[Story]**: US1 / US2 / US3 — maps to spec.md user stories
- **[Category]**: Constitution-driven: [PROB] probabilistic · [PERSIST] persistence ·
  [RESP] responsive · [ASSET] asset organisation · [STATIC] static-build

---

## Phase 1: Setup

**Purpose**: Initialise the project and create the full file scaffold before any feature work.

- [x] T001 Create `index.html` (app shell with single `<script type="module" src="src/main.js">`), `package.json` (Vite 5 + Vitest deps, scripts: `dev`, `build`, `test`, `preview`), and `vite.config.js` (Vitest jsdom environment, src alias) in repo root
- [x] T002 [P] Create `src/` file stubs — empty exports for `src/main.js`, `src/modules/rng.js`, `src/modules/pack.js`, `src/modules/collection.js`, `src/modules/ui/packView.js`, `src/modules/ui/collectionView.js`
- [x] T003 [P] Create `src/styles/main.css` — CSS custom properties for colours, spacing, z-index, and the three breakpoint variables (320 px · 768 px · 1024 px)
- [x] T004 [P] Create test stubs — `tests/rng.test.js`, `tests/pack.test.js`, `tests/collection.test.js` (import stubs, no assertions yet)
- [x] T005 [P] [ASSET] Create `assets/` folder tree — `assets/data/`, `assets/01_comum/`, `assets/02_incomum/`, `assets/03_raras/`, `assets/04_duplo_raras/`, `assets/05_arte_secreta/`, `assets/06_duplo_arte_secreta/`, `assets/07_legendária/`; add `.gitkeep` to each; add `assets/**/*.jpg` and `assets/data/cards.json` to `.gitignore`

**Checkpoint**: `npm install` succeeds; `npm test` runs (zero assertions, zero failures); `npm run dev` serves `index.html`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules that every user story depends on — MUST complete before Phase 3+.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T006 [PROB] Implement `src/modules/rng.js` — export `mulberry32(seed)`: takes a 32-bit integer seed, returns a generator function that produces deterministic uniform [0, 1) floats (implementation from `research.md` Decision 2)
- [x] T007 [P] [PROB] Implement `tests/rng.test.js` — (a) determinism: same seed produces identical sequence across two calls; (b) range: 10,000 draws all in [0, 1); (c) chi-squared uniformity across 100,000 draws, buckets of 0.1 width
- [x] T008 [PERSIST] Implement `src/modules/collection.js` — `getAll()` returns parsed localStorage `ptcg_collection` (default `{}`), `get(cardId)` returns copy count (default 0), `add(cardId)` increments count and persists, corrupt-JSON recovery resets to `{}` with console.warn (`contracts/storage-schema.md`)
- [x] T009 [P] [PERSIST] Implement `tests/collection.test.js` — add/get round-trip, multiple adds increment correctly, `getAll()` returns only owned cards, corrupt JSON resets gracefully (use jsdom `localStorage` mock)
- [x] T010 [STATIC] Implement `src/main.js` startup — `fetch('assets/data/cards.json')`, group cards into `RarityPool` by `folder` field, store in module-level `AppState`, render error overlay (message + setup instruction) if fetch fails or JSON is invalid (`contracts/cards-manifest.md`, `data-model.md` AppState)

**Checkpoint**: `npm test` passes T007 + T009. `npm run dev` shows either the error overlay (no cards.json yet) or a blank app shell (cards.json present).

---

## Phase 3: User Story 1 — Open a Booster Pack (Priority: P1) 🎯 MVP

**Goal**: Player clicks "Open Pack", reveals 6 cards one at a time via Space/click with flip animations, collection saves to localStorage, page auto-resets after ≤ 3 s.

**Independent Test**: Open a pack on a fresh page (no collection), reveal all 6 cards, reload the page, open the collection view — all 6 cards should appear with copy count ≥ 1.

### Implementation for User Story 1

- [x] T011 [P] [US1] [PROB] Implement `src/modules/pack.js` — `drawPack(rarityPools, rng)`: draws 4 Common cards (slots 1–4), slot 5 (90 % Uncommon / 10 % Rare), slot 6 (60 / 25 / 10 / 4.5 / 0.5 % distribution), enforces uniqueness across all 6 slots, falls back to next-more-common folder if pool is exhausted (`data-model.md` slot distribution table)
- [x] T012 [P] [US1] [PROB] Implement `tests/pack.test.js` — (a) 10,000 packs with seed 42: assert slot 5 Uncommon/Rare frequencies within ±2 pp of 90/10; (b) slot 6 frequencies within ±2 pp of 60/25/10/4.5/0.5; (c) no duplicate card IDs within any single pack; (d) cards 1–4 always Common (SC-002)
- [x] T013 [US1] Add pack-opening HTML structure to `index.html` — tab nav (Pack / Collection), pack view section: 6 card slot `<div>`s with `.card__inner / .card__front / .card__back` structure, "Open Pack" button and "Reveal" advance button (FR-005, FR-016)
- [x] T014 [US1] Implement CSS card flip in `src/styles/main.css` — `.card--revealed .card__inner { transform: rotateY(180deg) }`, `transform-style: preserve-3d`, `backface-visibility: hidden`, 0.6 s ease transition, `@media (prefers-reduced-motion: reduce)` instant fallback (`research.md` Decision 3)
- [x] T015 [US1] Implement `src/modules/ui/packView.js` — `openPack()` draws a new Pack from AppState pools using a time-seeded mulberry32 RNG, `revealNext()` advances `revealIndex` adding `.card--revealed` class and loading `card.imagePath`, calls `collection.add()` for each revealed card, after 6th reveal waits ≤ 3 s then calls `resetPack()` (FR-005, FR-006, FR-018)
- [x] T016 [US1] [RESP] Add responsive pack-opening layout to `src/styles/main.css` — single-column card strip at 320 px, 2-column at 768 px, 6-column row at 1024 px+ (FR-011)

**Checkpoint**: `npm test` passes all 3 test files. Pack opens, 6 cards flip one by one, collection persists to localStorage, page auto-resets.

---

## Phase 4: User Story 2 — Browse and Filter Collection (Priority: P2)

**Goal**: Full 165-card grid with silhouettes for unowned, image + copy count for owned, rarity filters, completion counter, tab toggle from pack view.

**Independent Test**: Open 3 packs, switch to Collection tab — grid shows 165 slots (≤18 owned with images, rest as silhouettes), completion counter reads "X / 165", rarity filter hides non-matching slots.

### Implementation for User Story 2

- [x] T017 [P] [US2] Add collection view HTML to `index.html` — rarity filter bar (7 toggle buttons, one per folder), completion counter `<span>`, 165-slot grid container `<div id="collection-grid">` (FR-008, FR-008a, FR-009)
- [x] T018 [US2] [PERSIST] Implement `src/modules/ui/collectionView.js` — `render()` iterates all 165 cards from AppState, renders silhouette `<div>` for unowned and `<img>` + copy-count badge for owned; `applyFilter(folders[])` shows/hides grid slots by `data-folder` attribute; `updateCounter()` writes "X / 165" (FR-008, FR-008a, FR-009)
- [x] T019 [US2] Wire tab toggle in `src/main.js` — clicking Pack/Collection tabs shows/hides respective view sections without resetting `AppState.currentPack`; re-renders collectionView on each switch to reflect latest collection state (FR-016, FR-017)
- [x] T020 [US2] [RESP] Add responsive collection grid to `src/styles/main.css` — CSS Grid `auto-fill minmax(80px, 1fr)` at 320 px, `minmax(100px, 1fr)` at 768 px, `minmax(120px, 1fr)` at 1024 px+ (FR-011)

**Checkpoint**: Collection tab shows full 165-card grid. Rarity filters toggle correctly. Counter updates after each pack. Tab switch preserves in-progress pack reveal.

---

## Phase 5: User Story 3 — Card Asset Setup Script (Priority: P3)

**Goal**: `download_cards.py` downloads all sv3pt5 cards into `assets/<folder>/` and writes `assets/data/cards.json` in one unattended run.

**Independent Test**: Delete `assets/` contents, run `python download_cards.py`, verify all 7 folders are populated with `.jpg` files and `assets/data/cards.json` exists with ≥ 165 entries.

### Implementation for User Story 3

- [x] T021 [US3] [ASSET] Implement `download_cards.py` card fetch — `GET https://api.pokemontcg.io/v2/cards?q=set.id:sv3pt5&pageSize=250` with optional `POKEMONTCG_API_KEY` env-var header; parse response; map each card's `rarity` string to the correct `RarityFolder` per the mapping table in `data-model.md`; log a warning and skip cards with unmapped rarities (FR-012, FR-013)
- [x] T022 [US3] [ASSET] Add image download loop to `download_cards.py` — for each card, download `images.large` URL to `assets/<folder>/<id>.jpg`; skip if file already exists (idempotency); print progress (FR-014, FR-015)
- [x] T023 [US3] [ASSET] Add `cards.json` generation to `download_cards.py` — after all downloads complete, build the manifest array (fields: `id`, `name`, `number`, `rarity`, `folder`, `imagePath`) sorted ascending by `number`; write to `assets/data/cards.json` (contracts/cards-manifest.md); print final counts per folder

**Checkpoint**: `python download_cards.py` populates all 7 folders, writes `cards.json`. Re-running skips existing files. App loads correctly after script completes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, edge-case UI, and deployment readiness.

- [x] T024 [P] [STATIC] Add production build validation to `vite.config.js` — confirm `npm run build` produces `dist/index.html` with no server-runtime references; add `"preview"` script to package.json (Constitution Principle I)
- [x] T025 [P] Add localStorage quota warning to `src/modules/collection.js` — catch `QuotaExceededError` on `setItem`, display a visible one-time banner via a `CustomEvent` dispatched to `src/main.js` (spec edge case)
- [x] T026 [P] Add missing-image fallback to `src/modules/ui/packView.js` and `src/modules/ui/collectionView.js` — on `<img>` `onerror`, swap `src` to a bundled card-back placeholder image; card still counts as revealed/owned (spec edge case)
- [x] T027 [P] [RESP] Manual responsive QA pass — verify both views at exactly 320 px, 768 px, and 1024 px in Chrome DevTools; record any breakage and fix in `src/styles/main.css` (SC-004)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks Phase 3, 4**.
- **US1 (Phase 3)**: Depends on Phase 2. No dependency on US2 or US3.
- **US2 (Phase 4)**: Depends on Phase 2. No dependency on US1 (shares collection module but not UI).
- **US3 (Phase 5)**: Fully independent — can run in parallel with Phases 2–4 (Python-only work).
- **Polish (Phase 6)**: Depends on Phases 3 and 4 completion.

### Within Each User Story

- `rng.js` → `pack.js` (pack depends on RNG)
- `collection.js` → `packView.js` (view calls `collection.add()`)
- `main.js` AppState → both `packView.js` and `collectionView.js`
- Tests can run in parallel with their corresponding implementation tasks

### Parallel Opportunities

```bash
# Phase 1 — all after T001:
T002 · T003 · T004 · T005  (different files, no deps)

# Phase 2 — after Phase 1:
T007 (rng tests)  can start as soon as T006 (rng impl) is done
T009 (collection tests)  can start as soon as T008 (collection impl) is done

# Phase 3 (US1) — after Phase 2:
T011 (pack.js)  ·  T012 (pack tests)   run together after T006
T013 (HTML)     ·  T014 (CSS flip)      run in parallel

# Phase 5 (US3) — independent, start any time:
T021 · T022 · T023  run sequentially (each builds on previous)
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **critical gate**
3. Complete Phase 3: US1 — open pack, reveal cards, save to localStorage
4. **STOP and VALIDATE**: `npm test` passes, pack opens and resets, collection saves
5. Demo: open 5 packs, verify localStorage via DevTools

### Incremental Delivery

1. Setup + Foundational → skeleton app with error overlay
2. US1 → pack opening works end-to-end (**MVP**)
3. US3 → run download script, app shows real card images
4. US2 → full collection grid with filters
5. Polish → deployment-ready

### Parallel Team Strategy

With two developers:
- Dev A: Phases 1 → 2 → 3 (browser app core)
- Dev B: Phase 5 (Python script) independently, merges when complete

---

## Notes

- `[P]` = different files, safe to execute in parallel within the same phase
- `[US1/2/3]` maps each task to its spec.md user story for traceability
- Constitution-driven labels `[PROB]`, `[PERSIST]`, `[RESP]`, `[ASSET]`, `[STATIC]` indicate which governance principle drives the requirement
- RNG and pack distribution tests are **mandatory** (Constitution Principle III + SC-002), not optional
- Commit after each phase checkpoint before advancing
- `download_cards.py` (Phase 5) can be developed in parallel with the browser app at any time
