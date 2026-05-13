<!--
## Sync Impact Report

**Version**: 0.0.0 → 1.0.0
**Bump rationale**: Initial population from blank template — all five principles created from scratch
(MAJOR: first substantive version establishing governance).

### Modified Principles
- All five principles are net-new; no prior named principles existed.

### Added Sections
- Core Principles (I–V)
- Stack Constraints
- Testing & QA Workflow
- Governance

### Removed Sections
- None (initial version)

### Templates Requiring Updates
- `.specify/templates/plan-template.md` — ✅ Constitution Check gates annotated with principle identifiers
- `.specify/templates/spec-template.md` — ✅ No structural changes required; existing constraint fields cover front-end/responsive context
- `.specify/templates/tasks-template.md` — ✅ No structural changes required; principle-driven task categories noted inline

### Deferred TODOs
- `TODO(PROJECT_NAME)`: Project name not confirmed by user — derived as "Portfolio App" from directory
  path `portfolio/spec_driven_project`. Confirm and amend when project name is established.
-->

# Portfolio App Constitution

## Core Principles

### I. Pure Front-End (No Backend)

The project MUST be implemented entirely as a front-end application. No server-side components,
backend services, server-rendered pages, or runtime servers are permitted. All logic, routing,
and data processing MUST execute in the browser. Build artifacts MUST be deployable as static
files (HTML/CSS/JS) to any static hosting provider without server execution.

**Rationale**: Eliminates operational complexity, maximises portability, and keeps the deployment
surface to a single `dist/` directory.

### II. Client-Side Persistence Only

All state that MUST survive page reload MUST be persisted exclusively using browser-native APIs
(localStorage, sessionStorage, IndexedDB, or Cache API). No data MAY be transmitted to or
retrieved from a remote server or third-party storage service. The persistence strategy for each
feature MUST be documented in its spec.

**Rationale**: Enforces the no-backend constraint end-to-end and makes offline use a first-class
property of every feature.

### III. Testable Probabilistic Distribution

Any feature involving randomness or probabilistic outcomes MUST use a seedable, deterministic
algorithm. Tests MUST verify distribution properties (expected value, variance, or frequency
histograms) against at least one fixed seed. Non-deterministic test behaviour is NOT acceptable;
flaky probabilistic tests MUST be treated as failing tests.

**Rationale**: Makes stochastic features auditable, reproducible in bug reports, and verifiable
in CI without special configuration.

### IV. Mandatory Responsiveness

Every UI component MUST be responsive and fully functional across the following breakpoints:

| Breakpoint | Minimum width |
|------------|---------------|
| Mobile     | 320 px        |
| Tablet     | 768 px        |
| Desktop    | 1024 px       |

No feature MAY be considered complete if any layout breaks or content becomes inaccessible at any
standard breakpoint. Responsiveness MUST be validated both visually (manual review) and via
automated snapshot or viewport checks before merge.

**Rationale**: The portfolio targets diverse devices; a broken mobile layout is a shipped defect.

### V. Organised On-Disk Assets

All static assets (images, fonts, icons, data files, audio, video) MUST reside under a top-level
`assets/` directory, categorised by type:

```
assets/
├── data/
├── fonts/
├── icons/
├── images/
└── (additional categories as needed)
```

No orphaned or undocumented assets are permitted. Every asset added MUST be referenced by at
least one source file; unreferenced assets MUST be removed or explicitly archived with a comment.

**Rationale**: Prevents asset sprawl as the portfolio grows and makes auditing bundle size
straightforward.

## Stack Constraints

- The tech stack MUST be pure front-end: HTML5, CSS3, and JavaScript or TypeScript.
- No server-side frameworks (Node.js express servers, Django, Rails, etc.) MAY be introduced.
- Build tools (Vite, Parcel, Webpack, etc.) are permitted provided they produce a static,
  server-runtime-free output directory.
- Third-party libraries MUST be evaluated for bundle-size impact; tree-shaking MUST be used
  where the library supports it.
- External API calls are permitted only for publicly accessible, read-only data sources that do
  not require authentication secrets stored server-side.

## Testing & QA Workflow

- Unit tests MUST cover all probabilistic and algorithmic logic (Principle III).
- Responsive-layout tests MUST cover all three standard breakpoints (Principle IV).
- Asset inventory checks (e.g., a script verifying no orphaned files exist) MUST be included
  in the CI pipeline (Principle V).
- All test suites MUST be runnable without a server, network connection, or environment secrets.
- Test coverage is NOT a vanity metric; untested UI paths are acceptable if the code path is
  purely presentational and carries no logic.

## Governance

This constitution supersedes all prior working agreements and individual feature decisions.
Amendments require:

1. A documented rationale added to this file's Sync Impact Report.
2. A semantic version increment per the policy below.
3. A propagation check across all `.specify/templates/` files before the amendment is merged.
4. Review and acceptance by the project lead.

**Versioning policy**:
- **MAJOR** — Backward-incompatible removals or redefinitions of existing principles.
- **MINOR** — New principle, section, or materially expanded guidance added.
- **PATCH** — Clarifications, wording fixes, non-semantic refinements.

All spec, plan, and task documents MUST include a Constitution Check section verifying compliance
with active principles. Features failing any principle-gate MUST NOT be merged until remediated.

**Version**: 1.0.0 | **Ratified**: 2026-05-13 | **Last Amended**: 2026-05-13
