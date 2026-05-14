# Feature Specification: Pokémon TCG 151 Booster Pack Opener

**Feature Branch**: `001-pokemon-tcg-booster`
**Created**: 2026-05-13
**Status**: Draft
**Input**: User description: "Crie um jogo web de abrir boosters do Pokémon TCG..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Open a Booster Pack (Priority: P1)

A player visits the game, clicks to open a booster pack, and watches 6 cards be revealed
one at a time — from most common to most rare — each appearing with a reveal animation.
The 6 cards are drawn according to the set's rarity distribution rules and are guaranteed
to be unique within the same pack.

**Why this priority**: This is the entire purpose of the game. Without it, nothing else
has value. It is the minimum viable experience.

**Independent Test**: Can be fully tested by clicking "Open Pack" on a fresh page. Delivers
the core game loop — excitement of discovery — without any persistence or collection features.

**Acceptance Scenarios**:

1. **Given** the player is on the main page, **When** they click "Open Pack", **Then** a
   pack of exactly 6 unique cards is generated and the first card is revealed with animation.
2. **Given** a pack has been generated, **When** each card animates in, **Then** the reveal
   order goes from most common (cards 1–4: Common) through increasing rarity (card 5, card 6).
3. **Given** the rarity rules, **When** card 5 is drawn, **Then** it is Uncommon in 90% of
   packs and Rare in 10% of packs across a statistically significant sample.
4. **Given** the rarity rules, **When** card 6 is drawn, **Then** it follows: Rare 60%,
   Double Rare 25%, Art Rare 10%, Double Art Rare 4.5%, Legendary 0.5%.
5. **Given** a pack is opened, **Then** no card appears more than once within that pack.
6. **Given** card images reside in the local asset folders, **When** a card is revealed,
   **Then** the correct image for that card loads from the local asset hierarchy.

---

### User Story 2 — Browse and Filter Collection (Priority: P2)

After opening one or more packs, the player navigates to their collection to see every
card they have obtained, how many copies of each card they own, and can narrow the
display by rarity tier.

**Why this priority**: Collection tracking is the retention loop that gives repeated
pack openings meaning. Without it, players cannot measure progress toward a complete set.

**Independent Test**: Can be fully tested by opening 2–3 packs and then viewing the
collection. Delivers measurable progress — "I now own 18 cards, 2 of which are Rare."

**Acceptance Scenarios**:

1. **Given** the player has opened at least one pack, **When** they open the collection
   view, **Then** every card obtained is displayed with its image and copy count.
2. **Given** the collection view is open, **When** the player selects a rarity filter,
   **Then** only cards belonging to that rarity tier are shown; deselecting restores all.
3. **Given** the player closes and reopens the browser, **When** they return to the
   collection view, **Then** all previously obtained cards and counts are intact.
4. **Given** a card has been obtained multiple times, **When** it appears in the
   collection, **Then** the copy count accurately reflects the total number obtained.

---

### User Story 3 — Card Asset Setup (Priority: P3)

A developer runs a setup script before deploying the game. The script downloads every
card from the Pokémon 151 set (sv3pt5), maps each card to its rarity tier, and saves
its image as a `.jpg` file into the corresponding local asset folder.

**Why this priority**: This is a developer prerequisite, not a player-facing feature.
It enables the game to run offline without depending on a third-party image service
at runtime. It must be complete before the game can be played, but the game's UI and
collection logic can be built and tested independently of it.

**Independent Test**: Run the script against the live card data source. Verify that
all 7 asset folders are populated, that each folder contains only cards of the correct
rarity, and that every file is a valid `.jpg`.

**Acceptance Scenarios**:

1. **Given** the script is executed, **When** it completes, **Then** all cards in the
   Pokémon 151 set (sv3pt5) have been downloaded as `.jpg` files.
2. **Given** a card's rarity is "Common", **When** the script processes it, **Then** the
   image is saved to `assets/01_comum/`.
3. **Given** a card's rarity is "Uncommon", **When** the script processes it, **Then** the
   image is saved to `assets/02_incomum/`.
4. **Given** a card's rarity is "Rare" or "Rare Holo", **When** the script processes it,
   **Then** the image is saved to `assets/03_raras/`.
5. **Given** a card's rarity is "Double Rare", "Rare Ultra", or any Rare Holo EX/GX/V/VMAX
   variant, **When** the script processes it, **Then** the image is saved to
   `assets/04_duplo_raras/`.
6. **Given** a card's rarity is "Illustration Rare", **When** the script processes it,
   **Then** the image is saved to `assets/05_arte_secreta/`.
7. **Given** a card's rarity is "Special Illustration Rare", "Rare Rainbow", or
   "Rare Secret", **When** the script processes it, **Then** the image is saved to
   `assets/06_duplo_arte_secreta/`.
8. **Given** a card's rarity is "Hyper Rare", **When** the script processes it, **Then**
   the image is saved to `assets/07_legendária/`.
9. **Given** the script has already run, **When** it is run again, **Then** previously
   downloaded files are not re-downloaded unnecessarily (idempotent).

---

### Edge Cases

- What happens when a rarity folder has fewer than the required number of unique cards
  available to draw from (e.g., only 1 Legendary in the set)?
  → Draw without replacement within the pack; if the pool is exhausted for a slot, fall
  back to the next most common tier.
- What happens when the player's collection storage reaches the browser's capacity limit?
  → The game continues to function; new cards open but a visible warning informs the
  player that collection data may not be fully saved.
- What happens when a card image file is missing from the local assets at runtime?
  → A placeholder "card back" image is displayed instead; the card is still added to
  the collection.
- What happens when two rarity pools share cards across distribution ambiguities?
  → Each card belongs to exactly one folder, determined at script execution time by
  the rarity string returned by the data source.

## Clarifications

### Session 2026-05-13

- Q: Pity system after N packs without high rarity? → A: No pity system — stateless independent draws, as realistic as possible to the physical Pokémon TCG product.
- Q: Reveal trigger — auto-play or player-controlled? → A: Player-controlled; the player presses Space or clicks/taps a dedicated button to reveal each card one at a time.
- Q: Statistics display — aggregate pull stats screen or panel? → A: No separate stats — collection view with per-card copy counts is sufficient.
- Q: Collection completeness — show only owned cards or full 151-card grid? → A: Full grid; unowned cards shown as silhouettes/placeholders, owned cards show image + copy count.
- Q: Navigation model between pack-opening and collection views? → A: Single page with tab/toggle — only one view visible at a time.
- Q: After all 6 cards are revealed, what happens? → A: Page resets automatically after a short delay and the "Open Pack" button reappears.

## Requirements *(mandatory)*

### Functional Requirements

**Pack Opening**

- **FR-001**: The system MUST generate packs of exactly 6 cards, with no duplicate card
  within a single pack.
- **FR-002**: Cards 1 through 4 in every pack MUST be drawn exclusively from the Common
  (01_comum) card pool.
- **FR-003**: Card 5 MUST be drawn from the Uncommon pool with 90% probability and from
  the Rare pool with 10% probability. The randomness source MUST be deterministic when
  seeded (enabling reproducible test runs).
- **FR-004**: Card 6 MUST follow this distribution: Rare 60%, Double Rare 25%,
  Art Rare 10%, Double Art Rare 4.5%, Legendary 0.5%. The randomness source MUST be
  deterministic when seeded.
- **FR-005**: Cards MUST be revealed one at a time, in ascending rarity order (cards 1→6).
  The player advances to the next card by pressing the Space key or clicking/tapping a
  dedicated on-screen button. Each reveal MUST include a visible animation before the
  advance control becomes active again.
- **FR-006**: The pack-opening interaction MUST be fully usable via pointer (mouse/touch)
  and keyboard (Space key) at all supported viewport widths.

**Collection**

- **FR-007**: The system MUST persist the player's full collection — card identifiers and
  copy counts — across browser sessions without requiring a server or network connection.
- **FR-008**: The collection view MUST display the full grid of all cards in the Pokémon
  151 set. Unowned cards MUST appear as silhouettes or placeholders. Owned cards MUST show
  the card image and the number of copies obtained.
- **FR-008a**: The collection view MUST show a completion counter (e.g., "47 / 165 cards")
  reflecting how many distinct cards the player has obtained out of the full set.
- **FR-009**: The collection MUST support filtering by one or more rarity tiers; filtered
  and unfiltered views must both show accurate copy counts and silhouettes for unowned cards
  in the selected tier.
- **FR-010**: Collection data MUST survive browser close and reopen without loss.

**Post-Reveal Loop**

- **FR-018**: After the 6th card is revealed, the pack-opening view MUST automatically
  reset after a short delay (≤ 3 seconds) and display the "Open Pack" button, ready for
  the next pack. The revealed cards disappear during the reset transition.

**Navigation**

- **FR-016**: The application MUST present a single page with a tab or toggle control
  that switches between the Pack Opening view and the Collection view. Only one view
  MUST be visible at a time.
- **FR-017**: Switching between views MUST NOT lose any in-progress pack reveal state;
  returning to the Pack Opening view MUST resume from the same reveal position.

**Responsiveness**

- **FR-011**: Every screen and interactive element MUST be fully functional at 320 px,
  768 px, and 1024 px viewport widths (Constitution Principle IV).

**Asset Setup Script**

- **FR-012**: A standalone setup script (`download_cards.py`) MUST download all cards
  from the Pokémon 151 set and save each card image as a `.jpg` file.
- **FR-013**: The script MUST map rarity strings from the data source to exactly one of
  the 7 asset folders as specified in User Story 3.
- **FR-014**: The script MUST be idempotent: re-running it MUST NOT duplicate already-
  downloaded files.
- **FR-015**: All downloaded assets MUST reside under `assets/` following the folder
  structure `assets/<NN_folder_name>/<card-id>.jpg` (Constitution Principle V).

### Out of Scope

The following are explicitly excluded from this feature:

- Card trading or transfer between players
- Battle or gameplay mechanics using cards
- User accounts, login, or authentication
- In-app purchase or unlocking of booster packs
- Deck building
- Multiplayer features of any kind

### Key Entities

- **Card**: Represents a single Pokémon TCG card. Has a unique identifier, name, rarity
  tier (one of the 7 categories), and a local image path within `assets/`.
- **Rarity Tier**: One of exactly 7 categories — Common, Uncommon, Rare, Double Rare,
  Art Rare, Double Art Rare, Legendary — each mapping to one `assets/` subfolder.
- **Pack**: A one-time draw of exactly 6 unique Cards following the slot distribution
  rules. Packs are ephemeral; they are not stored after opening.
- **Collection**: The cumulative, persistent record of all Cards a player has obtained,
  with a copy count per Card. Stored exclusively on the client.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can reveal all 6 cards by pressing Space or clicking the advance
  button once per card; the full sequence, including animations, completes in under
  10 seconds of active play time when advanced at a normal pace.
- **SC-002**: When 10,000 packs are simulated with a fixed random seed, the frequency of
  each rarity in slots 5 and 6 deviates from the specified probabilities by no more
  than ±2 percentage points.
- **SC-003**: The collection view loads and responds to rarity filter changes in under
  1 second, regardless of how many packs have been opened.
- **SC-004**: The game interface renders without layout breakage or inaccessible content
  at 320 px, 768 px, and 1024 px viewport widths.
- **SC-005**: Collection data is present and accurate after the player closes and
  reopens the browser, across at least 50 consecutive open/close cycles.
- **SC-006**: The setup script downloads and correctly categorises 100% of Pokémon 151
  set cards in a single unattended run.

## Assumptions

- Card images retrieved from the pokemontcg.io data source are of sufficient visual
  quality (typically 245 × 342 px) for in-browser display without additional processing.
- The Pokémon 151 set (sv3pt5) contains at least one card in each of the 7 rarity tiers
  as defined by the data source's rarity strings.
- The setup script (`download_cards.py`) is a developer tool executed once during
  project setup; end players never run or interact with it.
- Players start with an empty collection; there is no import, export, or reset feature
  in this version.
- Browser client-side storage provides sufficient capacity to persist collection
  metadata (card identifiers and counts — not raw image binary data).
- The game is single-player; no server is required to synchronise state between sessions
  or between players.
- The Pokémon 151 set contains enough Common cards (≥ 4) to fill the first 4 pack slots
  without pool exhaustion.
- The data source's rarity string for a given card is deterministic and does not change
  between script runs.
- Pack draws are stateless — each pack is generated independently with no pity counter or
  guaranteed-upgrade mechanic, matching the behaviour of the physical Pokémon TCG product.
