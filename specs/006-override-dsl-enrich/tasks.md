# Tasks: Override DSL with enrich(base) and Tree-Sitter-Compatible Authoring

**Feature**: 006-override-dsl-enrich
**Branch**: `006-override-dsl-enrich`
**Spec**: [spec.md](spec.md)
**Plan**: [plan.md](plan.md)

**Story map**:
- US1 (P1) — Author an override file both tools understand
- US2 (P1) — Get mechanical auto-transformations from `enrich(base)`
- US3 (P2) — `role()` as effect accumulator
- US4 (P2) — Path-addressed transform patches
- US6 (P2) — Extend top-level grammar arrays via spread+dedupe
- US5 (P3) — Pre-evaluate phase produces tree-sitter-valid grammar

---

## Phase 1 — Setup

- [ ] T001 Add `esbuild` as a dev dependency to `packages/codegen/package.json` and run `pnpm install`
- [ ] T002 Configure `@sittir/codegen` dual build in `packages/codegen/package.json`: add `exports` field with `.` → ESM, `./dsl` → both CJS and ESM, and build scripts producing `dist/cjs/` and `dist/esm/`
- [ ] T003 [P] Add `packages/*/\.sittir/` to `.gitignore` at repo root
- [ ] T004 [P] Create empty directory structure `packages/codegen/src/dsl/` and `packages/codegen/src/transpile/`
- [ ] T005 [P] Create empty directory `packages/codegen/src/compiler/pre-evaluate/` (will hold enrich + transform runner)
- [ ] T005a Pin `tree-sitter-cli` version in `packages/codegen/package.json` devDependencies (resolves research.md R-002 deferred sub-question). Record the chosen version in `specs/006-override-dsl-enrich/research.md` R-002. The CI step (T058) must install the same pinned version

---

## Phase 2 — Foundational (blocks all user stories)

- [ ] T006 Define the shared `Rule`, `Grammar`, and `Patch` type aliases in `packages/codegen/src/dsl/types.ts` — structural types that match tree-sitter's grammar shape without importing tree-sitter
- [ ] T007 Re-export tree-sitter DSL primitives (`seq`, `choice`, `optional`, `repeat`, `repeat1`, `token`, `prec`, `blank`, `field`, `alias` native form, `grammar`) from `packages/codegen/src/dsl/tree-sitter-reexports.ts` — thin wrapper that sources them from the installed `tree-sitter-cli/dsl` (or equivalent) module
- [ ] T008 Create the DSL barrel `packages/codegen/src/dsl/index.ts` re-exporting everything consumers need. This is the stable `@sittir/codegen/dsl` import path
- [ ] T009 Wire `@sittir/codegen/dsl` into the package `exports` field (T002 dependency) and confirm `import { enrich } from '@sittir/codegen/dsl'` resolves in both CJS and ESM contexts
- [ ] T010 Add a new `pre-evaluate` phase to the pipeline driver in `packages/codegen/src/compiler/generate.ts` — runs before Evaluate, receives the raw grammar exported from `overrides.ts`, returns a Post-Transform Grammar. Stub implementation passes input through unchanged

**Checkpoint**: foundational wiring complete. DSL barrel imports resolve. Pre-evaluate phase exists as a pass-through.

---

## Phase 3 — User Story 2 (P1): enrich(base) mechanical auto-transformations

**Goal**: Wrapping the base grammar in `enrich()` applies keyword-prefix promotion, unambiguous kind-to-name wrapping, and repeat normalization mechanically. Skips are reported to stderr. Existing Link-phase mechanical passes move into enrich.

**Independent test**: Remove a hand-written keyword-prefix override from python's `overrides.ts`, wrap base in `enrich()`, regenerate, confirm the promotion still happens and fidelity ceilings hold.

- [ ] T011 [P] [US2] Add unit-test fixtures for enrich passes in `packages/codegen/src/dsl/__tests__/fixtures/enrich/` — hand-authored tiny grammars exercising each pass (keyword-prefix, kind-to-name, repeat normalization) and their collision cases
- [ ] T012 [US2] Implement `keywordPrefixPromotion(grammar): { grammar, skips }` in `packages/codegen/src/dsl/enrich-passes.ts` — detects `seq(literal, ...)` shape, promotes literal to `field(literal, literal)`, returns skip records on field-name collision
- [ ] T013 [US2] Implement `unambiguousKindToName(grammar): { grammar, skips }` in `packages/codegen/src/dsl/enrich-passes.ts` — wraps sole kind references as `field(kindName, $.kindName)`; skips on naming collision (same rule already has a field with that name)
- [ ] T014 [US2] Implement `repeatNormalization(grammar): { grammar, skips }` in `packages/codegen/src/dsl/enrich-passes.ts` — rewrites `seq(X, repeat(X))` to `repeat1(X)` when `X` is structurally identical on both sides; no skip cases (pure rewrite)
- [ ] T015 [US2] Implement `enrich(base): Grammar` in `packages/codegen/src/dsl/enrich.ts` — pure function that runs the three passes in order, accumulates skip records, writes each skip to `process.stderr` in the format `enrich: skipped <pass-name> on <rule-name> (<reason>)`, returns the new grammar
- [ ] T016 [P] [US2] Unit test `packages/codegen/src/dsl/__tests__/enrich.test.ts` — purity (`enrich(g)` twice returns structurally-equal grammars), idempotence (`enrich(enrich(g))` equals `enrich(g)`), non-mutation (input is untouched)
- [ ] T017 [P] [US2] Unit test for each pass in `packages/codegen/src/dsl/__tests__/enrich-passes.test.ts` — positive case (transformation applies) and skip case (collision detected + skip reported)
- [ ] T018 [US2] Export `enrich` from `packages/codegen/src/dsl/index.ts`
- [ ] T019 [US2] Wire `enrich()` into the pre-evaluate phase in `packages/codegen/src/compiler/generate.ts` — if the override file wraps base in `enrich(...)`, the function has already run; pre-evaluate just passes the result through. (enrich is author-invoked, not pipeline-invoked.)
- [ ] T020 [US2] Add an `optional(keywordString)` detection variant to the keyword-prefix promotion pass (T012) so it handles the `optional(...)` wrapper case. This subsumes Link's `promoteOptionalKeywordFields` at `packages/codegen/src/compiler/link.ts:1328`. Verify with a unit test fixture exercising `optional(literal)` at the top level of a `seq`
- [ ] T021 [US2] Remove `promoteOptionalKeywordFields` from `packages/codegen/src/compiler/link.ts` and update the Link phase's main loop at `link.ts:27–221` to drop the pass invocation. Do NOT remove any other Link passes — they operate on sittir's post-Evaluate model and are out of scope per FR-020b
- [ ] T022 [US2] Update `packages/python/overrides.ts` to wrap its base import in `enrich()` — replace hand-written overrides that duplicate what enrich now covers. Preserve the `@ts-nocheck` header
- [ ] T023 [US2] Run `pnpm test` and confirm python's fidelity ceilings (40/30) hold. Roll back T021 if Link's heuristic passes were accidentally removed
- [ ] T024 [US2] Update `packages/rust/overrides.ts` to wrap base in `enrich()` — apply the same cleanup as T022
- [ ] T025 [US2] Update `packages/typescript/overrides.ts` to wrap base in `enrich()` — apply the same cleanup as T022
- [ ] T026 [US2] Run `pnpm test` on the full suite and confirm rust (50/40), typescript (10/10), python (40/30) ceilings all hold

**Checkpoint**: `enrich(base)` is a shipping feature. All three grammars use it. Fidelity ceilings intact. Link no longer performs mechanical passes.

---

## Phase 4 — User Story 3 (P2): role() effect accumulator

**Goal**: `role(name)` records a role as a side-effect on a per-grammar accumulator, returns `blank()`, and scopes correctly across nested `grammar()` calls.

**Independent test**: Author an `overrides.ts` with `role('indent')` inline in `externals`. Confirm Link reads the role from the grammar's `sittirRoles` sidecar.

- [ ] T027 [P] [US3] Implement module-local accumulator state + save/restore in `packages/codegen/src/dsl/role.ts` — `let current: string[] | null = null`, `withAccumulator(fn)` helper that saves/restores
- [ ] T028 [US3] Implement `role(name: string): Blank` in `packages/codegen/src/dsl/role.ts` — pushes onto current accumulator, throws if called outside any grammar scope, returns `blank()`
- [ ] T029 [US3] Wrap `grammar(base, config)` in `packages/codegen/src/dsl/grammar-wrapper.ts` to call `withAccumulator()`, evaluate `config`, attach `sittirRoles: string[]` to the returned grammar object as a sidecar field tree-sitter will ignore
- [ ] T030 [P] [US3] Unit test `packages/codegen/src/dsl/__tests__/role.test.ts` — single `role()` call captured, nested `grammar(grammar(base), config)` doesn't leak between scopes, top-level `role()` throws
- [ ] T031 [US3] Update `packages/codegen/src/compiler/link.ts` to read `grammar.sittirRoles` from its input instead of any prior mechanism — resolve each role name against `externals` to find the tagged token
- [ ] T032 [US3] Export `role` from `packages/codegen/src/dsl/index.ts`
- [ ] T033 [US3] Update `packages/python/overrides.ts` to import `role` from `@sittir/codegen/dsl` (alongside any other DSL primitives already in use) and use `role('indent')` / `role('dedent')` / `role('newline')` inline in `externals` — replace any prior sidecar role declarations. The explicit-import requirement is shared with T054 (Phase 7); doing it here keeps the file in a valid state between phases
- [ ] T034 [US3] Run python fidelity check; confirm indent/dedent/newline rendering still works and ceilings hold

**Checkpoint**: `role()` is a shipping primitive. Python uses it. Link reads the accumulator.

---

## Phase 5 — User Story 4 (P2): path-addressed transform patches

**Goal**: `transform()` supports path strings (`'0/0/0'`), wildcards (`'0/*/1'`), nested patches, and single-arg `alias($.name)` shorthand.

**Independent test**: Patch a rule with a nested structure using a path-addressed patch. Confirm the patch applies at the target position only and fidelity ceilings hold.

- [ ] T035 [P] [US4] Implement path parser in `packages/codegen/src/dsl/transform-path.ts` — parses `'0/0/0'`, `'0/*/1'`, `'*'`; rejects leading/trailing slashes; returns a structured `PathSegment[]` (either numeric index or `'*'` wildcard)
- [ ] T036 [P] [US4] Unit test `packages/codegen/src/dsl/__tests__/transform-path.test.ts` — valid paths parse correctly, invalid paths throw with the path in the error message
- [ ] T037 [US4] Implement `applyPatch(rule, path, value)` in `packages/codegen/src/dsl/transform-apply.ts` — walks the rule along the parsed path, installs `value` at the target position, handles wildcards by applying to every matching branch, raises hard error on out-of-bounds or zero-match wildcard
- [ ] T038 [P] [US4] Unit test `packages/codegen/src/dsl/__tests__/transform-apply.test.ts` — cover `seq`/`choice`/`optional`/`repeat` containers; wildcard matching; out-of-bounds error messages name the path and actual shape
- [ ] T039 [US4] Implement the unified `transform(rule, ...patches)` in `packages/codegen/src/dsl/transform.ts` — accepts flat object form (backwards-compat) OR array-of-patches form with `{path, value}` shape; applies patches left-to-right
- [ ] T040 [US4] Implement `insert(rule, path, value)` and `replace(rule, path, value)` wrappers in `packages/codegen/src/dsl/transform.ts` — single-patch convenience around `transform()`
- [ ] T041 [US4] Implement one-arg `alias($.name)` shorthand in `packages/codegen/src/dsl/alias.ts` — detects one-argument call, expands to `alias($.name, $.name)`; two-argument form passes through to tree-sitter's native alias
- [ ] T042 [P] [US4] Unit test `packages/codegen/src/dsl/__tests__/alias.test.ts` — one-arg shorthand expands correctly, two-arg form unchanged
- [ ] T043 [US4] Export `transform`, `insert`, `replace`, `alias` from `packages/codegen/src/dsl/index.ts`
- [ ] T044 [US4] Pick one nested-rule override in any grammar's `overrides.ts` that currently rewrites the whole rule, convert it to a path-addressed patch, confirm fidelity ceilings hold

**Checkpoint**: transform API supports path addressing, wildcards, nested patches, and alias shorthand.

---

## Phase 6 — User Story 6 (P2): extension-point spread+dedupe merge

**Goal**: Override files extend `supertypes`, `externals`, `extras` via spread+dedupe and replace `word`. Omitted fields leave base unchanged.

**Independent test**: Add a new external token to python's override without restating base externals. Regenerate. Confirm base externals + new token present, no duplicates.

- [ ] T045 [P] [US6] Implement `mergeExtensions(base, overrides)` in `packages/codegen/src/dsl/merge-extensions.ts` — per-field spread+dedupe for `supertypes`/`externals`/`extras` using reference equality; scalar replacement for `word` via `overrides.word ?? base.word`; omitted fields pass base through
- [ ] T046 [P] [US6] Unit test `packages/codegen/src/dsl/__tests__/merge-extensions.test.ts` — spread for arrays, dedupe on reference equality, scalar replacement for `word`, omitted fields untouched, order (base first, overrides appended)
- [ ] T047 [US6] Wire `mergeExtensions` into the `grammar(base, config)` wrapper from T029 — after accumulator setup, merge extension fields before returning the grammar object
- [ ] T048 [US6] Add a new-external-token smoke test in `packages/python/overrides.ts` (or a test fixture) exercising spread-merge. Confirm Link sees both base and override entries

**Checkpoint**: extension-point merge is a shipping behavior. Documented in the quickstart.

---

## Phase 7 — User Story 1 (P1): tree-sitter-compatible authoring flow

**Goal**: `packages/<lang>/overrides.ts` is authored in TS, transpiled to `.sittir/grammar.js`, consumable by `tree-sitter generate`.

**Independent test**: Run `pnpm sittir codegen --grammar rust`. Confirm `.sittir/grammar.js` is produced, `tree-sitter generate` (from `packages/rust/`) succeeds without errors.

- [ ] T049 [US1] Implement `transpileOverrides(grammarName)` in `packages/codegen/src/transpile/transpile-overrides.ts` — runs esbuild with `format=cjs`, `bundle=true`, `platform=node`, `target=node18`, preserves `@ts-nocheck`, externalizes only the base tree-sitter grammar package (per research.md R-003). Output: `packages/<grammarName>/.sittir/grammar.js`
- [ ] T050 [P] [US1] Create `packages/rust/tree-sitter.json` pointing `grammars[0].path` at `./.sittir` (per research.md R-002)
- [ ] T051 [P] [US1] Create `packages/typescript/tree-sitter.json` with the same shape
- [ ] T052 [P] [US1] Create `packages/python/tree-sitter.json` with the same shape
- [ ] T053 [US1] Wire `transpileOverrides(grammarName)` into the codegen pipeline in `packages/codegen/src/compiler/generate.ts` — runs after pre-evaluate succeeds, before emission
- [ ] T054 [US1] Update all three `overrides.ts` files to explicitly import DSL primitives from `@sittir/codegen/dsl` (no global injection). Preserve `@ts-nocheck`
- [ ] T055 [US1] Run `pnpm sittir codegen --grammar rust` and confirm `.sittir/grammar.js` is generated and contains bundled DSL primitives
- [ ] T056 [US1] Manually run `cd packages/rust && npx tree-sitter generate` against the transpiled output and confirm exit code 0
- [ ] T057 [US1] Repeat T055/T056 for typescript and python
- [ ] T058 [US1] Add a CI step to `.github/workflows/ci.yml` — for each grammar, run `pnpm sittir codegen --grammar <lang>` then `cd packages/<lang> && npx tree-sitter generate`. Fail the build on any non-zero exit
- [ ] T058a [US1] Verify the existing fidelity-ceiling CI job in `.github/workflows/ci.yml` still runs `corpus-validation.test.ts` (or the equivalent fidelity-gate test) and still fails the build on ceiling regressions after the Phase 7 wiring changes. This is a structural check — no code change expected, but Link-pass migration (T020/T021) has a non-zero chance of disturbing upstream CI assumptions. Resolves FR-023

**Checkpoint**: override files are now single-source-of-truth artifacts readable by both sittir and tree-sitter. CI enforces the dual compatibility.

---

## Phase 8 — User Story 5 (P3): pre-evaluate phase invariant

**Goal**: The post-transform grammar handed to Evaluate contains only tree-sitter-native constructs + sidecar fields. Structural property of the pipeline, enforced by test.

**Independent test**: After pre-evaluate runs, serialize the grammar back to `.js` source and feed it to `tree-sitter generate`. Must succeed for all three grammars (already covered by T058 — this phase adds the invariant test).

- [ ] T059 [P] [US5] Add `packages/codegen/src/compiler/__tests__/pre-evaluate-invariant.test.ts` — asserts that after pre-evaluate runs on each grammar, the resulting object has no sittir-specific fields outside `sittirRoles` (which is a documented sidecar), and every rule is a tree-sitter-native construct (no transform-patch records leaking through)
- [ ] T060 [US5] If T059 fails for any grammar, fix the pre-evaluate phase to strip any leaked sittir metadata before returning

**Checkpoint**: pre-evaluate produces a tree-sitter-valid grammar, proven by both test and CI round-trip.

---

## Phase 9 — Polish & Cross-Cutting

- [ ] T061 [P] Add `@sittir/codegen/dsl` API reference to `packages/codegen/README.md` — document `enrich`, `role`, `transform`, `insert`, `replace`, `field`, `alias` with one example each
- [ ] T062 [P] Add `docs/authoring-overrides.md` — link to `specs/006-override-dsl-enrich/quickstart.md` and the relevant ADRs (0001–0005)
- [ ] T063 [P] Update `CLAUDE.md` to mention `@sittir/codegen/dsl` as the stable authoring surface for override files
- [ ] T064 Type-check pass — run `pnpm -r run type-check` and fix any tsgo errors introduced by the new DSL surface
- [ ] T065 Lint pass — run `pnpm lint` (oxlint) across `packages/codegen/` and fix issues
- [ ] T066 Final full-suite run — `pnpm test` for unit + integration + fidelity, all ceilings held
- [ ] T067 Update `specs/006-override-dsl-enrich/checklists/requirements.md` — mark all items verified against the shipped implementation

---

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) — blocks everything
    ↓
    ├─→ Phase 3 (US2 enrich)   ─┐
    ├─→ Phase 4 (US3 role)     ─┤
    ├─→ Phase 5 (US4 transform)─┼─→ Phase 7 (US1 transpile + CI)
    └─→ Phase 6 (US6 merge)    ─┘       ↓
                                  Phase 8 (US5 invariant)
                                        ↓
                                  Phase 9 (Polish)
```

**Story independence**:
- US2, US3, US4, US6 can be implemented in parallel after Phase 2 — they touch different files in `packages/codegen/src/dsl/`.
- US1 (Phase 7) depends on all of them because it exercises the full DSL surface and requires the overrides.ts files to be updated.
- US5 (Phase 8) is a structural invariant test that validates the combined result.

## Parallel execution examples

**After Phase 2 foundational is complete**, a single developer (or parallel agents) can work these in parallel without file collisions:

```
Agent A: Phase 3 (enrich)       — packages/codegen/src/dsl/enrich*.ts
Agent B: Phase 4 (role)         — packages/codegen/src/dsl/role.ts, grammar-wrapper.ts
Agent C: Phase 5 (transform)    — packages/codegen/src/dsl/transform*.ts, alias.ts
Agent D: Phase 6 (merge)        — packages/codegen/src/dsl/merge-extensions.ts
```

After all four converge, Phase 7 (transpile + CI wiring) integrates them and updates the three `overrides.ts` files. Phase 7 is sequential within itself because all three grammars share the same pipeline wiring.

## Implementation strategy

**MVP scope (smallest shippable slice)**: Phase 1 + Phase 2 + Phase 3 (US2 enrich).

This delivers the highest-leverage principle — mechanical Link passes become visible in the override file — for one grammar (python). It validates the constitution's Grammar-Agnostic and Non-lossy principles against a real grammar, and it's the foundation the other stories rely on. Everything after Phase 3 is incremental surface area.

**Incremental delivery**:
1. Phase 3 lands → python uses `enrich()`, ceilings hold → ship.
2. Phase 4 lands → role accumulator working → ship.
3. Phase 5 lands → transform API richer → ship.
4. Phase 6 lands → extension-point merge → ship.
5. Phase 7 lands → tree-sitter CI gate live → ship (biggest external-visibility change).
6. Phase 8 + 9 → invariants and polish.

Each ship point is a usable increment — no big-bang merge required.

## Task count summary

- Setup: 6 tasks (T001–T005, T005a)
- Foundational: 5 tasks (T006–T010)
- US2 (enrich): 16 tasks (T011–T026)
- US3 (role): 8 tasks (T027–T034)
- US4 (transform): 10 tasks (T035–T044)
- US6 (merge): 4 tasks (T045–T048)
- US1 (transpile): 11 tasks (T049–T058, T058a)
- US5 (invariant): 2 tasks (T059–T060)
- Polish: 7 tasks (T061–T067)
- **Total: 69 tasks**

## Independent test criteria recap

| Story | How to test it in isolation |
|---|---|
| US2 | Remove a hand-written keyword-prefix override from python, wrap base in `enrich()`, fidelity ceilings hold |
| US3 | Add `role('indent')` inline in externals, confirm Link reads it from the sidecar |
| US4 | Rewrite one nested-rule override as a path-addressed patch, fidelity ceilings hold |
| US6 | Add a new external token without restating base externals, confirm both present after merge |
| US1 | `pnpm sittir codegen --grammar rust && cd packages/rust && npx tree-sitter generate` succeeds |
| US5 | `pre-evaluate-invariant.test.ts` passes for all three grammars |
