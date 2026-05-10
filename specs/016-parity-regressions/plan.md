# Implementation Plan: Parity & Regressions

**Branch**: `016-parity-regressions` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-parity-regressions/spec.md`

## Summary

Lift the corpus-validator pass counts above the baseline measured at `b4ccc6cc` for both backends — TS-mode (16 → 0 vitest failures) and native-mode (most floors 0 → matching at least 50% of TS-mode pass rate per grammar). Approach: tooling-first cluster work. Commit #1 lands `collect-baseline.ts` plus the initial JSON snapshots; subsequent commits each fix one failure cluster at the codegen-pipeline level (walker/emitter/overrides only — never hand-edit generated output), regenerate, and update the JSON. CI gains a regression-checker job that diffs the JSON against the PR's base and fails on any count drop. Cluster order: python comprehensions × 6 → rust mut/captured patterns × 5 → factory-rt × 1 → ts coverage × 1 → dsl tests × 3, with native parity work folded into each cluster where the same template intent applies. PR `#016` opens against `012-rust-core-port`; auto-rebases when #12 merges.

## Technical Context

**Language/Version**: TypeScript 6.0.2 (ESM, `.ts` extensions in imports), Rust 1.82+ for native render path (already shipped on 012).
**Primary Dependencies**: `@sittir/codegen` (walker / emitter / link / assemble / evaluate pipeline), `@sittir/core` (render, readNode, edit), `@sittir/types` (NodeData, ConfigOf, FromInput type projections), per-grammar packages (`@sittir/{rust,typescript,python}`), per-grammar napi crates (`sittir-{rust,typescript,python}-napi` for native render). Vitest for the test suite that defines the baseline.
**Storage**: File system — `specs/016-parity-regressions/baselines/{ts,native}.json` is the durable contract; generated TS/templates under `packages/{lang}/src/` and `packages/{lang}/templates/*.jinja` are codegen output (never hand-edited).
**Testing**: vitest (baseline truth), oxlint --deny-warnings on `packages/{lang}/src` (phase-0 invariant), tsgo strict-build (phase-0 invariant), `packages/tools/src/validate/jinja.ts` (header check), `npx tsx packages/codegen/src/scripts/probe-kind.ts --engine both` for engine-vs-engine render diffing.
**Target Platform**: Local dev + CI (GitHub Actions, Node 20.x and 24.x matrix, x86_64 linux).
**Project Type**: Internal codegen pipeline — pure transformation over in-memory parse trees + on-disk grammar files, no runtime persistence layer.
**Performance Goals**: Baseline collection completes in under 30s on a warm checkout; regression-checker CI step adds under 1 min total. Cluster cadence guidance (in quickstart.md, not a hard SC): roughly 4 hours of focused work per cluster commit; clusters that exceed it are split or deferred per the spec's scope-drift edge case.
**Constraints**:

- Fix-the-generator only: hand-edits to `packages/{lang}/src/*` or `templates/*.jinja` are forbidden (Constitution III, XI).
- Zero TS-mode regressions across the lifetime of the feature (spec SC-004) — every count in `baselines/ts.json` may only move up.
- Phase-0 invariants (build green, lint clean, jinja header check passing on 509 files, API-surface snapshots match) hold at every commit.
- No skip-marks, no `it.todo`, no floor downgrades as workarounds.
  **Scale/Scope**: 3 grammars × ~100–150 visible kinds each ≈ 400 kind-template pairs across both backends. 16 known TS-mode failures clustered into 5 root-cause groups. ~30+ polymorph null-forms flagged in `project_recursive_factory_cluster.md` (out-of-scope for this feature unless they fall inside a US3 cluster fix; deferred to a follow-up if not).

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                     | Status  | Notes                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **I. Grammar Alignment**                      | ✅ Pass | Spec uses tree-sitter-native terms (kind, field, named, supertype, NodeData, polymorph). No invented vocabulary.                                                                                                                                                                                                                                                                   |
| **II. Fewer Abstractions**                    | ✅ Pass | Feature reuses existing emitter / walker / override surfaces. No new types added to `@sittir/types`; `collect-baseline.ts` is a script, not a published API.                                                                                                                                                                                                                       |
| **III. Generated vs Hand-Written**            | ✅ Pass | Explicit FR-003: hand-edits to `packages/{lang}/src/*` and `templates/*.jinja` are forbidden. Every fix lands in `packages/codegen/src/*` or `packages/{lang}/overrides.ts`.                                                                                                                                                                                                       |
| **IV. Test-First**                            | ✅ Pass | Vitest is the baseline truth — every cluster fix must move tests from fail to pass without disabling assertions. New tests may be added to lock in cluster behaviour; existing ones may not be skipped or weakened (FR-004).                                                                                                                                                       |
| **V. Library-First**                          | ✅ Pass | No CLI surface added. `collect-baseline` is an internal script invoked via `npx tsx`.                                                                                                                                                                                                                                                                                              |
| **VI. Deterministic Output**                  | ✅ Pass | Baseline JSON is deterministic by construction (FR-001: stable key ordering, no embedded timestamps). Generated codegen output already deterministic per the existing pipeline; FR-006 verifies via `git diff --quiet` after a clean regen post-cluster.                                                                                                                           |
| **VII. Grammar-Agnostic Pipeline**            | ✅ Pass | Cluster fixes that touch the pipeline (walker/emitter/link/assemble/evaluate) MUST work for any grammar — only `overrides.ts` carries grammar-specific knowledge. Spec edge case "Native render gap with no clear TS counterpart" reinforces this: missing dispatcher entries are emitter bugs, not per-template hand-fills.                                                       |
| **VIII. Non-lossy Transformations**           | ✅ Pass | Cluster fixes correct lossy transformations (e.g. walker dropping literals from non-primary choice branches per `project_choice_with_literals_cluster.md`). The feature direction is _toward_ non-lossiness, not away from it.                                                                                                                                                     |
| **IX. @sittir/core is the Rust-port surface** | ✅ Pass | No additions to `@sittir/core` planned. The native render path is already the Rust mirror (shipped on 012); cluster fixes touch render-template emitters, not the runtime API.                                                                                                                                                                                                     |
| **X. Don't hand-roll types you can import**   | ✅ Pass | The baseline JSON shape will derive its NodeData / TreeHandle / validator-result types from `@sittir/types` and existing validator return types — no parallel local declarations.                                                                                                                                                                                                  |
| **XI. DRY — One Source, One Derivation**      | ✅ Pass | The baseline JSON is the _single_ source of truth for "how many tests pass per cluster." The regression-checker derives its verdict from one walk of that JSON; no parallel cache, no second walker. Cluster fixes that turn out to share a root cause (e.g. python comprehensions waterfalling to dict-builders) are documented in one commit per Q5/A — one fix, one derivation. |

**No violations.** Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/016-parity-regressions/
├── spec.md                 # Feature spec (already written)
├── plan.md                 # This file
├── research.md             # Phase 0 output
├── data-model.md           # Phase 1 output
├── quickstart.md           # Phase 1 output
├── contracts/              # Phase 1 output
│   └── baseline-json.md    # Schema for baselines/{ts,native}.json
├── checklists/
│   └── requirements.md     # Spec quality checklist (already written)
├── baselines/              # Created in commit #1
│   ├── ts.json             # TS-mode counts at HEAD
│   └── native.json         # Native-mode counts at HEAD
└── tasks.md                # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/
├── codegen/
│   └── src/
│       ├── scripts/
│       │   ├── collect-baseline.ts         # NEW: writes baselines/{ts,native}.json
│       │   ├── probe-kind.ts               # existing
│       │   ├── probe-stages.ts             # existing
│       │   └── …
│       ├── emitters/                       # walker → emit pipeline; cluster fixes land here
│       │   ├── factories.ts
│       │   ├── from.ts
│       │   ├── wrap.ts
│       │   ├── templates.ts                # jinja emitter
│       │   ├── types.ts
│       │   └── …
│       ├── compiler/                       # walker / link / assemble / evaluate; root-cause work also here
│       │   ├── rule.ts
│       │   ├── link.ts
│       │   ├── assemble.ts
│       │   └── …
│       ├── dsl/                            # variant() / refine() / transform() / enrich() — override surface
│       │   ├── primitives/
│       │   ├── transform/
│       │   └── …
│       └── validate/                       # corpus validators (the test data sources)
│           ├── common.ts                   # treeHandle / nativeTreeHandle / buildReadHandle
│           ├── roundtrip.ts
│           ├── factory-roundtrip.ts
│           ├── from.ts
│           └── readnode-roundtrip.ts
├── rust/
│   ├── overrides.ts                        # grammar-specific patches; rust pattern cluster fix lands here
│   ├── src/                                # GENERATED — never hand-edit
│   ├── templates/                          # GENERATED .jinja — never hand-edit
│   └── tests/                              # parity.test.ts; api-surface.test.ts
├── typescript/
│   ├── overrides.ts
│   ├── src/                                # GENERATED
│   ├── templates/                          # GENERATED
│   └── tests/
├── python/
│   ├── overrides.ts                        # grammar-specific patches; python comprehension cluster fix lands here
│   ├── src/                                # GENERATED
│   ├── templates/                          # GENERATED
│   └── tests/
└── core/, types/                           # untouched by this feature

.github/workflows/
└── ci.yml                                  # NEW step: regression-checker job

scripts/
└── packages/tools/src/validate/jinja.ts    # phase-0 invariant; moved into @sittir/tools
```

**Structure Decision**: This is the existing pnpm workspace layout — no new packages, no new directories at the top level. Cluster fixes touch `packages/codegen/src/{emitters,compiler,dsl,validate}/*.ts` (the codegen pipeline) and `packages/{rust,python}/overrides.ts` (where grammar-specific knowledge lives). The new script `packages/codegen/src/scripts/collect-baseline.ts` joins the existing diagnostic-script family. The new CI step is a job in `.github/workflows/ci.yml`. No restructuring required — this feature is a contract layered over the existing tree.

## Complexity Tracking

No constitution violations to justify.
