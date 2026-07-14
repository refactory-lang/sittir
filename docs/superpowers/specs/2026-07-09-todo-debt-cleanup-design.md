# TODO.md Debt Cleanup — Track 1 Design

## Context

The user maintains `TODO.md` (repo root, untracked) as a running list of debt-cleanup
items discovered during an in-progress typing-consistency pass (45 modified files,
uncommitted, in the main worktree). Two other efforts were running in parallel this
session:

- **PR-S (separator-canonical)** — fully merged (#139/#140/#141).
- **PR-T (non-slot separator rules)** — mid-planning in an isolated worktree
  (`/tmp/sittir-worktrees/pr-t`), paused.

The user reconsidered sequencing: PR-T would add new slot-model/render code on top of
a compiler that still has a deprecated JS engine, a phantom `VARIANT` rule-type, and
assorted deprecated functions — "instead of adding to the debt," TODO.md cleanup goes
first. The user asked to take over execution of TODO.md directly in the **main
worktree** (continuing their own in-progress changes there, not an isolated worktree).

## Grounding

TODO.md as originally written had 12 items (11 original + 1 added mid-brainstorm: single-phase
method consolidation). A grounding pass (three research forks, full file:line evidence)
found:

- **Item 1** (`--- IGNORE ---` comments) — already moot. Zero real hits in code;
  only the TODO.md line itself.
- **Item 10** (remove `VARIANT` rule-type) — much bigger than a cleanup item: 153
  references across 24+ files, with live `case VARIANT:` handlers in nearly every
  compiler phase (link.ts alone has ~26). This is a structural refactor comparable
  in scope to PR-T, not a mop-up. A prior "polymorph cleanup" (referenced in session
  memory) was a *different*, unrelated refactor (`Polymorph`/`PolymorphRule` runtime
  dispatch) — it did not touch this `VARIANT` rule-type discriminant at all.
- **Item 11** (fix generated `wrap.ts` type errors) — bigger than described: 648
  total type errors, not just the `SliceGroup1`/`Yield` cluster. A second, likely
  independent root cause (undefined names `CollectionElements`/`Patterns`/
  `_Parameters`) hits `from.ts`/`types.ts`/`factories.ts` (48 errors), plus
  anomalous TS-grammar-shaped failures inside Python's own test files. Needs a
  diagnosis pass before it can be planned as a task.
- **Item 6**'s flagged `SymbolRule.source: 'group-lift'` legacy marker — turned out
  to be **already fully migrated** in production code (tagged "debt PR-P1" in
  comments throughout: `types/rule.ts:563-572` deletes the field from the type;
  both writers already stamp `metadata.symbolSource` instead
  (`dsl/enrich.ts:1620-1649`, `compiler/link.ts:3056-3060`); both behavior-driving
  readers were deleted as *provably dead code*, verified empirically against all
  three real grammars (`emitters/templates.ts:1686-1701`,
  `emitters/suggested.ts:726-732`); the inlining gate already reads the structural
  `inline` flag instead (`dsl/rule-transforms.ts:317-329`, "the §15 cleanup"). The
  only remnant is 4 dead lines in one test file's fixtures — see Cluster A.

Per user decision, this work is split into tracks:

- **Track 1 (this spec)** — the well-bounded items, executed as one plan now.
- **Track 2** — `VARIANT` removal (item 10). Deferred to its own future
  brainstorm → spec → plan cycle.
- **Track 3** — `wrap.ts` type-error diagnosis + fix (item 11). Deferred to its own
  future cycle, starting with a diagnosis pass (likely `sittir-research`) rather
  than jumping to a plan.

This spec covers **Track 1 only**.

## Scope: Track 1 Clusters

Track 1 groups the remaining well-bounded items into 5 independently-testable
clusters. Each cluster is a candidate task group in the implementation plan; several
clusters will decompose into multiple bite-sized tasks.

### Cluster A — Mechanical (low-risk deletions + formatting)

No design judgment required; every deletion below was verified via infigraph
(`find_all_references`/`trace_callers`) to have zero live callers, or a fully
identified small caller set that gets migrated in the same task.

**Lint + format (item 2):**
- `pnpm exec oxlint -c oxlint.config.ts --fix packages/*/src` — addresses the 33
  unused-import + 19 unused-declaration `eslint(no-unused-vars)` diagnostics
  (56 total diagnostics found; the remaining 4 — 2 `no-empty-file`
  (`packages/tools/src/validate/node-types.ts:1`,
  `packages/codegen/src/__tests__/validate-node-types.test.ts:1`), 1
  `no-misused-new` (`packages/typescript/src/types.ts:3601` — generated file, fix
  via emitter if reproducible, otherwise note as pre-existing and out of scope),
  and 1 duplicate-identifier parse error (`packages/codegen/src/compiler/__tests__/evaluate.test.ts:16`)
  — are not auto-fixable unused-import issues; each gets its own task step with a
  targeted manual fix, not bundled into the blind `--fix` pass).
- `pnpm exec oxfmt .` — 284 of 582 files currently have formatting drift.

**Zero/near-zero-caller deprecated symbol deletions (items 4 + 6):**

**CORRECTION (found at Task 3 execution time, superseding the original grounding
below — the original pass ran on the same infigraph index caught stale/wrong
elsewhere in this document):** `RuleIdentity`, `SymbolRule.supertype`, and
`FieldRule.nameFrom` are already deleted — confirmed via `git log -S` to have
been removed by an earlier, unrelated commit (`eb47d0d65`, "debt PR-A — remove
pure-dead surface … #116") already present on this branch. `isNativeNodeData`/
`assertNativeNodeData` don't exist under those names at all — they were
already renamed to `isRenderableNodeData`/`assertRenderableNodeData`, which
are **live, non-deprecated** functions;
`packages/core/tests/native-boundary.test.ts` tests that live API and must
NOT be deleted. Only `NodeId` is real, and it has 3 additional dead-import
sites beyond the one file originally cited: `packages/core/src/types.ts:8`
(re-export), `packages/tools/src/probe/kind.ts:84` (unused import),
`packages/core/tests/readNode.test.ts:17` (unused import).

- `NodeId` type alias — `packages/types/src/core-types.ts:49-53` (tag + type).
  Zero *functional* references (no code binds a value to it), but is still
  imported (unused) in `packages/core/src/types.ts:8`,
  `packages/tools/src/probe/kind.ts:84`, and
  `packages/core/tests/readNode.test.ts:17`. Delete the type and all four
  dead imports.
- ~~`RuleIdentity`~~ — already deleted (see correction above). No task needed.
- ~~`isNativeNodeData`/`assertNativeNodeData`~~ — already renamed to
  `isRenderableNodeData`/`assertRenderableNodeData` (live, not deprecated).
  No task needed; do not delete `packages/core/tests/native-boundary.test.ts`.
- ~~`SymbolRule.supertype` field~~ — already deleted (see correction above).
  No task needed.
- ~~`FieldRule.nameFrom`~~ — already deleted (see correction above), including
  its dead-propagation read. No task needed.
- `wrap.init()`/`wrap.collect()` — `packages/codegen/src/emitters/wrap.ts:117-125`.
  Back-compat no-ops, zero call sites. Delete.
- `from.init()`/`from.collect()` — `packages/codegen/src/emitters/from.ts:264-266`.
  Same pattern, zero call sites. Delete.
- `factories.init()`/`factories.collect()` — `packages/codegen/src/emitters/factories.ts:401-403`.
  Same pattern, zero call sites. Delete.
- `ENUM`/`TERMINAL` rule-type constants — `packages/codegen/src/types/rule-types.ts:26,29`.
  Both discriminants were retired by a prior PR; every remaining reference outside
  their own definition site is a comment documenting the retirement, not live code.
  Delete the constants.
- `isEnum` — `packages/codegen/src/types/rule.ts:510`, a weaker duplicate of
  `isEnumChoiceRule` (rule.ts:376) lacking the phantom-brand narrowing. One live
  caller: `packages/codegen/src/compiler/link.ts:3117`. Migrate that caller to
  `isEnumChoiceRule`, then delete `isEnum`.
- `toNativeRenderTransport` — generated into every grammar's `utils.ts:68` from
  emitter template `packages/codegen/src/emitters/client-utils.ts:126`. No-op body
  by design; only consumer is
  `packages/codegen/src/emitters/__tests__/utils-engine-emit.test.ts` (two test
  cases both titled `'emits a deprecated no-op native transport seam'`, currently
  at lines 36 and 46 — re-verify exact lines at task time since this file may shift).
  Delete the emitter code (stop emitting the stub into generated `utils.ts`) and
  both test cases; regenerate all three grammars to confirm `utils.ts` output
  changes as expected.
- `SymbolRule.source: 'group-lift'` test-fixture remnant — the migration itself is
  already complete (see Grounding above). Delete the 4 dead
  `source: 'group-lift'` fixture properties at
  `packages/codegen/src/compiler/__tests__/simplify-group-lift-inline.test.ts:87,147,193,236`.
  These are the only remaining occurrences of the string anywhere in the codebase
  outside a doc comment that already says "retired"
  (`dsl/transform/transform-path.ts:305`). Nothing reads them; deleting is a pure
  no-op. (Re-verify whether the surrounding `as unknown as Rule` casts on these
  fixture objects can also be narrowed/removed once `source` is gone, but do not
  widen scope if other still-needed fields on the same fixture still require the
  cast.)

**Additional test-only/dead exports found by a follow-up sweep** (enumerate
exported symbols across `packages/codegen/src` + `packages/common/src`, confirm
each candidate's caller set — see "A note on verification confidence" below for
the methodology caveat on this batch):
- `SchemaRuleName`, `RecursiveRuleBuilder` — `packages/codegen/src/grammar-shapes/grammar-twin.ts:65,73`.
  The whole `grammar-twin.ts` module has zero production importers; both symbols
  are reachable only from `grammar-shapes/__tests__/transform-original.test-d.ts`.
  Delete both (and re-evaluate whether `grammar-twin.ts` has anything else worth
  keeping once these are gone).
- `RuleAtPath` — `packages/codegen/src/grammar-shapes/path-type.ts:95`. Sibling
  exports `FastKeys`/`TransformPatchMap` in the same file are genuinely
  production-used (via `dsl/wire/wire.ts`); `RuleAtPath` itself is a dead branch
  only exercised by `grammar-shapes/__tests__/transform-original.test-d.ts` and
  `intellisense-demo.test-d.ts`. Delete only `RuleAtPath`.
- `makeLinkedGrammar` — `packages/codegen/src/compiler/link.ts:194`. Wraps
  `link()`'s output into a `LinkedGrammar` shape; production code calls `link()`
  directly and never uses this wrapper. Only consumer:
  `compiler/__tests__/ctx-walker.test.ts`. Delete.
- `insert`, `replace` — `packages/codegen/src/dsl/transform/transform.ts:955,982`.
  Both are re-exported from the documented public surface `dsl/index.ts`
  (`import { transform, insert, replace, ... } from '@sittir/codegen/dsl'`), but
  a direct scan of all three grammars' `overrides.ts` found zero calls to
  either — production overrides only ever use `transform()` with inline
  patches. Only consumer: `compiler/__tests__/evaluate.test.ts`. Delete both
  (a documented API surface with no real adoption).

**DISPUTED — resolve before deleting, do not delete on this spec's say-so
alone:** `getCurrentWireContext`, `withWireContext` —
`packages/codegen/src/dsl/wire/wire.ts:141,219`. Two independent follow-up
sub-agents reached opposite verdicts on the same two symbols. One judged them
debt (`getCurrentWireContext` reads back the module-level `currentContext`
singleton for test introspection while production only ever writes to it;
`withWireContext` is a scoped context-setup helper `wire()` itself never calls,
since it establishes context through a different internal path). The other
judged them legitimate, intentional test-observability infrastructure:
`wire()` builds its `WireContext` inline (`wire.ts:570`) rather than via
`withWireContext`, so the latter plausibly exists *specifically* to let tests
install an isolated context for exercising context-dependent primitives
without running the full `wire()` pipeline — the same shape as a standard
test-harness seam, not debt. Given the conflict, the corresponding plan task
must re-investigate directly (read `wire.ts` and its test consumers in full,
don't just re-run `find_all_references`) and reach its own conclusion before
deciding delete vs. keep — do not default to deletion just because this is
"Cluster A."
- `emitFactories` — `packages/codegen/src/emitters/factories.ts:78`. Its own doc
  comment claims it's "preserved for backwards compatibility (tests, CLI
  callers)," but no CLI file actually references it; production (`emit.ts`) uses
  the `FactoryEmitter` class directly. Consumers are
  `emitters/__tests__/refine-emit.test.ts` and `utils-engine-emit.test.ts` (a
  fourth reference exists at
  `specs/005-five-phase-compiler/baseline/v1-reference/index.ts:328`, but that's
  an orphaned historical baseline artifact nothing live imports — doesn't change
  the disposition). Delete, and correct/remove the stale doc comment.
- `snakeToCamel` — `packages/codegen/src/emitters/templates.ts:148`. A
  duplicate/shadow of the canonical `snakeToCamel` in
  `compiler/model/node-map.ts`, which every production caller actually imports.
  Only consumer: `emitters/__tests__/templates-emitter-helpers.test.ts`. Delete
  the `templates.ts` copy (keep the `node-map.ts` original).
- `isAutoStampSlot` — `packages/codegen/src/emitters/shared.ts:314`. Zero
  references anywhere, including tests; superseded by
  `isAutoStampField`/`resolveEffectiveLiteral`. Delete.
- `emitRenderModuleBundle` — `packages/codegen/src/emitters/render-module.ts:381`.
  `render-module-runner.ts`'s own doc comments explicitly instruct using the
  runner / `emitRenderModule` "instead of calling `emitRenderModuleBundle`
  directly" — production has already migrated off it. Only consumer:
  `emitters/__tests__/render-module-emit.test.ts`. Delete.
- `ContainerRule` — `packages/codegen/src/grammar-shapes/grammar-json.ts:189`.
  Zero references anywhere. Delete.
- `TriviaRoleMap` — `packages/codegen/src/scm/extract-roles.ts:29`. Zero
  references; superseded by `Role`/`RoleEntry` per the (implemented, not
  archived) `specs/023-scm-role-extraction/` — this is ordinary
  superseded-by-the-next-iteration debt, not tied to any deferred initiative.
  Delete.
- `findFieldsWithRepeatFlag` (`packages/codegen/src/compiler/collect-slots.ts`),
  `mergeSlotValues` (`packages/codegen/src/compiler/model/node-map.ts`) — zero
  references anywhere. Delete.
- `verifyAll` — `packages/codegen/src/scripts/generated-manifest.ts:359`. Zero
  references; its own doc comment claims `packages/validator/src/cli.ts` calls
  it, but that file actually calls `assertGeneratedManifestsClean` instead — the
  comment is stale, confirming `verifyAll` was superseded and never cleaned up.
  Delete (after confirming `assertGeneratedManifestsClean` genuinely covers the
  same ground).

**Explicitly EXCLUDED from Cluster A — do not delete, needs its own future
investigation:** a large cluster of `packages/common/src` symbols that the same
follow-up sweep flagged as test-only or zero-reference
(`cst.ts`'s `CstRenderer`/`toCst`; `edit.ts`'s `replace`/`bindRange`/`replaceField`;
`engine.ts`'s `BackendStatusLike`; `metrics.ts`'s `PerKindMetrics`/`FfiMetrics`/
`MetricsFile`/`recordFfi`; `native-read.ts`'s `normalizeNativeReadNode`;
`nodeData.ts`'s `freezeNodeData`/`buildWithNamespace`; `utils.ts`'s
`WithMethodsRuntime`; `native-boundary.ts`'s `isRenderableNodeData`) turned out,
on inspection, to be scaffolding for two real architectural efforts, not random
cruft:
- **ADR-0018** ("De-hoisted NodeData Surface," Status: Accepted, 2026-05-03,
  `docs/adr/0018-dehoist-nodedata-surface.md`) — defines exactly the `$with`
  update namespace, frozen NodeData, napi-direct boundary (no serde JSON
  round-trip), and `$replace`/`$toEdit` methods that `nodeData.ts`/`utils.ts`/
  `edit.ts`/`cst.ts` appear to implement pieces of.
- **Archived spec 054** (`specs/archive-054-post-016-perf-tracking/spec.md`,
  "Post-016 Perf & Health Telemetry," Status: Draft) — explicitly *deferred*,
  not abandoned-as-wrong; `metrics.ts`'s `PerKindMetrics`/`FfiMetrics`/
  `MetricsFile`/`recordFfi` map directly onto its `SITTIR_METRICS` per-render
  timing and FFI-cost-tracking design.

Both are about the **native** napi boundary specifically (FFI = the native
Rust↔JS bridge, not the deprecated JS/WASM dispatch engine) — Cluster B's JS
engine removal does not make this scaffolding moot. None of these symbols carry
an explicit `@deprecated` tag, unlike every other deletion in this cluster —
the absence of a current caller here plausibly means "not wired up yet," not
"meant to be removed." Whether this scaffolding is genuinely superseded (the
final implementation lives inline in generated per-grammar code instead) or is
still-intended shared infrastructure worth finishing is a real question that
deserves its own dedicated look, not a blind mechanical sweep. (`isNativeNodeData`/
`assertNativeNodeData`, listed earlier in this cluster, stay IN Cluster A
regardless — they carry an explicit `@deprecated` tag, a deliberate author
signal this pair specifically. `GrammarEngineConfig` and
`grammar-shapes/grammar-twin.ts`'s type-test-only `MutableDeep` are not
deletions either way — already judged as legitimate test utilities, not debt.)

**New: `@forFutureUse` tagging convention (item 6, closes the ambiguity this
exact cluster exposed).** Rather than leaving this cluster as an unmarked,
easy-to-re-flag mystery, introduce a JSDoc tag mirroring `@deprecated` but with
the opposite intent — "keep despite no current caller," not "remove despite
having callers":
```ts
/**
 * @forFutureUse ADR-0018 (dehoisted NodeData surface) — $with update namespace.
 * Not yet wired into generated output; scaffolding only.
 */
```
- **Apply** to all 14 symbols in the excluded cluster above: `recordFfi`,
  `FfiMetrics`, `PerKindMetrics`, `MetricsFile` (cite archived spec 054);
  `freezeNodeData`, `buildWithNamespace`, `WithMethodsRuntime`, `replace`,
  `bindRange`, `replaceField`, `toCst`, `CstRenderer`, `isRenderableNodeData`,
  `BackendStatusLike` (cite ADR-0018). Pure annotation — no behavior change, no
  deletions.
- **Document the convention** in `.claude/codegen-conventions.md`: what it
  means, how it differs from `@deprecated` (opposite intent, same visibility
  goal), and that future dead-code/test-only sweeps (manual or tool-assisted)
  should treat `@forFutureUse`-tagged symbols as deliberately excluded rather
  than re-flagging them as mystery debt on every pass.

**A note on verification confidence for this batch:** the follow-up sweep hit a
mid-session infigraph MCP outage partway through and fell back to regex/
word-boundary text search for a portion of the scope. That fallback is
generally reliable for the fairly distinctive symbol names above, but carries a
small false-negative risk for generic names via re-export/destructuring
patterns a regex wouldn't catch. Re-verify every symbol in this "additional"
subsection with `find_all_references` once infigraph is confirmed reconnected,
before the corresponding plan task executes — do not treat this list as
final ground truth the way the original grounding-fork findings are.

**Dead-branch deletion (item 7, corroborating item 6):**
- `packages/codegen/src/emitters/transport-common.ts:116-126,135-141` and
  `packages/codegen/src/emitters/factory-map.ts:102-110` — both guarded by
  conditions (`node.children.length > 0` / `structuralChildrenOf(node)`) that are
  now provably always false, since `AssembledBranch.children` was retired to
  always return `[]` (`packages/codegen/src/compiler/model/node-map.ts:2861`).
  Comments in both files already admit this ("leaving the code structure intact so
  the dead-code pattern is visible to the cleanup pass"). Delete the dead branches.

**Doc-comment corrections (item 6 — no behavior change):**
- `RenderRule`/`SimplifiedRule` phantom brands — `packages/codegen/src/types/rule.ts:235,251-252`.
  Doc claims these brands provide compile-time mismatch protection; in reality both
  fields are optional and never written, so the two types remain mutually
  assignable. Per a prior first-party review (`docs/superpowers/specs/2026-07-02-lingering-debt-inventory-research.md`
  §3.4), the verdict is KEEP the names, but the doc comment must stop claiming
  enforcement it doesn't provide. Correct the comment only; implementing real
  brand enforcement is out of scope for this track.
- `RuleBase.metadata.inlinedFrom` — `packages/codegen/src/types/rule.ts:129` says
  "for diagnostics only," but is read for behavior (spacing) at
  `packages/codegen/src/emitters/templates.ts:434,492`. Correct the doc comment to
  state it drives render spacing, not just diagnostics. No behavior change.

**Package output (item 9):**
- Remove `"templates/*.jinja"` from the `files` array in
  `packages/typescript/package.json:19-21`, `packages/python/package.json:19-21`,
  and `packages/rust/package.json:19-21` — confirmed all three currently ship
  `.jinja` templates in their npm output; per user decision, none of the three
  published npm packages need to carry them (the Rust build pipeline consumes
  `templates/*.jinja` directly from the source repo, not from a published
  package).

### Cluster B — JS engine removal (item 5, plus item 4's `readNode`)

CLAUDE.md already states this is sanctioned: "The js/dispatch-based engine is
deprecated. The Rust render engine, Rust Tree-Sitter bindings are the source of
truth." An in-code TODO independently confirms intent:
`packages/tools/src/commands.ts:45` — *"TODO: Get rid of deprecated backends - get
rid of the js backend and make native the only backend."*

**Boundaries found:**
- `packages/core/` (`@sittir/core`, "JavaScript backend implementation for
  sittir") — defines `createJsEngine` (`packages/core/src/engine.ts:43-90`),
  re-exported via `engine-boundary.ts:3`, `index.ts:4`.
- `packages/common/src/readNode.ts` — the deprecated JS tree-walk reader
  (`@deprecated` tag at :137, body :146-277). Structurally live via generated
  `wrap.ts`'s `readNodeJs` fallback (emitted by
  `packages/codegen/src/emitters/wrap.ts:888,1281,1289`; present in all three
  grammars' `src/wrap.ts` — rust:3790, typescript:4338, python:2447 — as
  `return tree.read ? tree.read(...) : readNodeJs(...)`).
- Generated per-grammar `engine.ts` (rust/typescript/python `src/engine.ts:8,32-48`)
  — `createEngine()` = `createNativeEngine(...) ?? createJsEngine(...)`.
- CLI surface: `packages/cli/src/framework/options.ts:6` — `BACKENDS = ['native','js','all']`,
  `withBackend()` at :16-22 (default `'native'`);
  `packages/cli/src/commands/tool/check-baseline.ts:10` — a *separate* `--backend`
  option defaulting to `'js'` (inconsistent with the shared helper's default —
  this drift is itself worth fixing in the same pass).
- `backend === 'js'` branches: `packages/tools/src/validate/from.ts:186`,
  `packages/tools/src/probe/kind.ts:130,554,770`,
  `packages/tools/src/profile/bench.ts:100,294,358`.
- Per-grammar generated `backend.ts` (rust/typescript/python `src/backend.ts:96,147`)
  — the native-vs-js selection algorithm (spec 012 T040).

**Plan for this cluster:** delete `createJsEngine` and `packages/core`'s JS-engine
surface (confirm nothing else in `packages/core` is still needed before deleting
the whole package — flag as an explicit verification step, not an assumption);
delete `common/readNode.ts`'s deprecated reader; fix the codegen emitters
(`emitters/wrap.ts`, `emitters/engine.ts`) to stop emitting the `readNodeJs`
fallback and the JS-engine branch, then regenerate all three grammars (never
hand-edit the generated `wrap.ts`/`engine.ts`/`backend.ts` output directly); strip
`backend === 'js'` handling from CLI options, validate, probe, and bench; fix
`check-baseline.ts`'s inconsistent default.

### Cluster C — `recurseChildren` removal (item 4)

`packages/codegen/src/dsl/rule-transforms.ts:451` (tag at :432), `@deprecated`
with an explicit warning that `RuleWalker.map` is not a drop-in replacement. Two
live callers, both needing a visitor rewrite rather than a mechanical swap:
- `packages/codegen/src/compiler/simplify.ts:149` (`canonicalizeSeqOfLeaves`,
  self-recursive visitor).
- `packages/codegen/src/dsl/rule-transforms.ts:574` (`fuseHeadRepeatLists`).

Rewrite both onto `RuleWalker.map`, verify behavior is unchanged (existing tests
for both functions must still pass, plus `validate:native` must hold), then delete
`recurseChildren`.

### Cluster D — Structured diagnostic report (items 7 + 8)

**Current state (confirmed, not a structured report today):**
- Grammar-diagnostics (compiler-side warnings: `non-literal-separator`,
  `content-collision`, `multi-slot-nested-seq`, `supertype-list`,
  `repeat-choice-with-literal`, derive-shape/typename-collision diagnostics, etc.
  — all `canProceed: true`, catalogued across
  `packages/codegen/src/compiler/diagnostics/*.ts` and `compiler/link.ts:2755-2763`)
  print to **stderr only**, via `formatGrammarDiagnostics`
  (`compiler/diagnostics/grammar-diagnostics.ts:160-167`), once per `regen:all` —
  never persisted anywhere.
- Validator failures print to **stdout** (`runCountsCli`,
  `packages/tools/src/commands.ts:56-145`, first-failure lines capped at
  `SITTIR_VALIDATOR_MAX_FAILURES`, default 1000, via `formatFirstFailures`,
  `commands.ts:147-164`).
- `packages/tools/validation-history.jsonl` (`tools/src/history.ts:51-67,93-106`)
  persists **counts only** per (grammar, backend) run — no failure messages, codes,
  or severities. Auto-committed via `commitHistory`.
- 10 silent catch blocks were found with no `throw`/log/diagnostic push by
  default, most notably `backend.ts`'s `tryLoadNative()` (generated identically
  per grammar, ~line 115), which silently falls back to the JS/TS engine on any
  native-load failure unless `SITTIR_BACKEND_DEBUG` is set (`emitDebug`, :92-101)
  — silent by default in production, matching its own doc comment.

**Design decision for this cluster:** add one new persisted, structured report,
written on every `validate` run (not just `regen:all`), combining both existing
channels without changing their current stdout/stderr UX:
- **Location:** `packages/tools/validation-report.json` (overwritten each run —
  it reflects the most recent run, distinct from `validation-history.jsonl`'s
  append-only counts trend, which keeps its current behavior unchanged).
- **Shape:** a JSON array of entries, each
  `{ source: 'grammar' | 'validator', severity: 'error' | 'warning', code: string,
  grammar: string, backend: string, stage?: string, location?: string, message: string }`.
  Grammar-diagnostics entries map 1:1 from the existing `CompilerDiagnostic` shape
  (already has code/severity/location/message/proposal —
  `compiler/diagnostics/grammar-diagnostics.ts`). Validator entries map 1:1 from
  each stage's failure list, **unbounded** (the `SITTIR_VALIDATOR_MAX_FAILURES`
  cap stays for the human-readable stdout printout, but the persisted report
  carries every failure — the point of item 8 is that nothing gets silently
  truncated from the record).
- Wire the identified silent catches into it: `backend.ts`'s native-load fallback
  always writes a report entry (severity `warning`, code
  `native-load-fallback`) regardless of `SITTIR_BACKEND_DEBUG` — the env var still
  controls immediate stderr visibility, but the report always captures it.
  `probe/stages.ts:108,115` and `probe/kind.ts:539,782,807`'s already-captured
  errors get additionally surfaced into the same report when probe runs as part
  of `validate` (not a behavior change to probe's own standalone JSON output).

### Cluster E — Single-phase method consolidation (item 12), via lsproxy

Grounded against every file flagged by an in-code "move into phase" TODO, plus a
broader sweep of non-phase compiler files, plus the inverse case (phase-file
exports used by only one *other* phase file). Only 4 moves are clean (single
caller-file, no import-cycle hazard):

| Symbol | From | To | Note |
|---|---|---|---|
| `flatten` | `packages/codegen/src/compiler/wrapper-deletion.ts:320` | `packages/codegen/src/compiler/normalize.ts` | Sole caller-file: `normalize.ts:22` (called :420,476). Matches that file's own TODO exactly. |
| `isAliasMintedRef` | `packages/codegen/src/compiler/variant-structural.ts:209` | `packages/codegen/src/compiler/link.ts` | Sole caller-file: `link.ts:60`. Matches that file's own TODO exactly. |
| `buildRuleCatalog` + `attachReferenceRuleIds` | `packages/codegen/src/compiler/rule-catalog.ts` | `packages/codegen/src/compiler/evaluate.ts` | Sole caller-file: `evaluate.ts:32`. Move together (one caller imports both). |
| `isTerminalShape` (inverse case) | `packages/codegen/src/compiler/link.ts:1663` | `packages/codegen/src/compiler/normalize.ts` | Defined in Link, used only by `normalize.ts:18`. Link itself never calls it. |

**Explicitly excluded:** `deleteWrapper` (`wrapper-deletion.ts:309`) — 2
caller-files (`simplify.ts:814`, `model/node-map.ts:920`), and moving it into
`normalize.ts` would create a `normalize.ts ↔ simplify.ts` import cycle
(`normalize.ts` already imports from `simplify.ts`). This is a previously
documented, already-deferred hazard
(`docs/superpowers/plans/2026-05-26-compiler-simplification-master-plan.md`).
Not attempted in this track.

**Also excluded (genuinely cross-phase-shared, despite being flagged or
suggested):** `deriveStructuralVariantChildren` and `prefixNamedSuffix`
(variant-structural.ts, 3 and 2 caller-files respectively), `opaqueFacts`/
`readFacts`/`OpaqueFacts` (opaque-facts.ts — consumed by `node-map.ts` and by
`@sittir/tools` outside the compiler package entirely; a cross-cutting home like
`types.ts` is the right eventual destination, not a phase file, but that move is
out of scope here since it's not a single-phase case), all 4 `diagnostics/*.ts`
files, `ctx.ts`, `types.ts` (all confirmed hard cross-cutting infra, consumed by
≥2 phase files or by `node-map.ts`).

**Bonus deletions found during the sweep (0 external production callers — verify
again at task time before deleting, since the codebase is actively changing):**
- `createEmptyRuleCatalog` (`rule-catalog.ts`) — only used by 3 test files.
- `findStructuralVariantChoices` + `StructuralVariantChoice`
  (`variant-structural.ts`) — only used internally / by their own test file.
- `wrapVariants`, `deduplicateVariants`, `nameVariant` (`link.ts:1087,1102,1118`)
  — zero external production callers; only reachable via the re-export below, and
  only exercised by a test.

**Re-export requiring explicit handling:** `normalize.ts:1120` —
`export { wrapVariants, deduplicateVariants, nameVariant, tokenToName } from './link.ts';`
Three of the four re-exported symbols are being deleted as unused (above);
`tokenToName` has a real external consumer (`model/node-map.ts:60`) and must stay
exported — from wherever `tokenToName` ends up (it is not one of the 4 moves in
this cluster, so it stays defined in `link.ts` and the re-export narrows to just
`tokenToName`). `normalize.test.ts`'s `describe('Normalize — tokenToName', ...)`
block currently tests all four symbols through this re-export; update it to drop
coverage of the three deleted symbols (their own tests, if any exist elsewhere,
are unaffected) and keep `tokenToName` coverage.

**Process constraint for every move in this cluster:** use lsproxy (not manual
Edit) to perform the actual move, per this project's established convention.
After each move, confirm via infigraph (`find_all_references`) that the moved
symbol is not re-exported from its new home unless a genuine external consumer
still needs it.

## Global Constraints

- **Worktree:** all work in this track happens directly in the main worktree
  (`/Users/pmouli/GitHub.nosync/refactory-lang/sittir`), continuing the user's own
  in-progress uncommitted changes there — not an isolated worktree, unlike PR-T.
- **Never hand-edit generated artifacts** — `packages/{rust,python,typescript}/src/*`,
  `packages/{rust,python,typescript}/templates/*.jinja`,
  `packages/{rust,python,typescript}/.sittir/*`, `overrides.suggested.ts`. Fix
  codegen (`packages/codegen/src/emitters/*`, `packages/codegen/src/compiler/*`)
  or `packages/<lang>/overrides.ts`, then regenerate.
- **Verify before delete, every time:** the codebase is actively changing (this
  spec's own grounding already found citations from a 7-day-old research doc were
  stale). Immediately before any deletion task, re-verify caller counts via
  infigraph (`find_all_references`/`trace_callers`), not grep, and not by trusting
  this spec's line numbers blindly — re-read the current file first. Infigraph's
  `find_all_references` was itself caught missing real production references
  twice during this spec's own grounding (once via a genuine stale-index miss,
  once during an MCP outage that forced a regex-based fallback) — if infigraph is
  unavailable or its result looks suspicious (e.g. a "well-known," heavily-used
  symbol reporting zero references), cross-check with a direct text/import search
  before trusting a zero-caller verdict, rather than deleting on a single tool's
  say-so.
- **Deprecation-marker check before deleting "unused" code:** a symbol with no
  current caller is not automatically debt. Before deleting anything not already
  tagged `@deprecated` in this spec, check whether it plausibly implements an
  Accepted ADR (`docs/adr/*.md`) or a drafted-but-deferred (not rejected) spec —
  grep the symbol's name and its file's apparent purpose against `docs/adr/` and
  `specs/archive-*/`. An explicit `@deprecated` tag is a deliberate author signal
  safe to act on; the mere absence of a caller often just means "not wired up
  yet." See Cluster A's "Explicitly EXCLUDED" note for a concrete example (the
  ADR-0018 / archived-spec-054 scaffolding in `packages/common/src`).
- **lsproxy for moves/renames** (Cluster E specifically, and generally per project
  convention) — never a manual cut-paste Edit for a symbol relocation.
- **Gate every task on `pnpm run validate:native`** holding steady or improving
  (re-confirm the fresh baseline at plan-execution start — do not assume it
  matches any previously recorded number, since this worktree already has 45
  uncommitted files changing compiler internals).
- **Full test suite must pass** after every task; regenerated output must be
  reviewed for whether it's expected to change (Cluster A/B/C/E should be
  byte-neutral on the 3 real grammars except where a task explicitly changes
  generated output, e.g. Cluster B's `wrap.ts`/`engine.ts`/`backend.ts` edits and
  Cluster A's `toNativeRenderTransport` stub removal — both of which are expected
  to change generated `utils.ts`/`wrap.ts`/`engine.ts`/`backend.ts` content, and
  that diff should be reviewed, not treated as a failure).
- **`propose-14`** (signature-conformance ratchet, runs in the pre-commit hook)
  must pass on every commit.
- **Commits:** explicit pathspecs only (never `git add -A`/`.`), never
  `--no-verify`, never amend a published commit.

## Out of Scope for This Track

- Item 1 (`--- IGNORE ---` comments) — already moot, no task needed.
- Item 10 (`VARIANT` type removal) — Track 2, own future spec cycle.
- Item 11 (`wrap.ts` type errors) — Track 3, own future spec cycle, starting with
  diagnosis.
- `SymbolRule.source: 'group-lift'`'s original migration — already done; only the
  4-line test-fixture remnant is in scope (folded into Cluster A above).
- The actual disposition (delete vs. finish wiring up) of the `packages/common/src`
  cluster tied to ADR-0018 and archived spec 054 — this track only tags it
  `@forFutureUse` and documents the convention (see Cluster A), it does not
  decide whether that scaffolding should eventually be deleted or completed.
  Candidate for its own future investigation (Track 4?).
