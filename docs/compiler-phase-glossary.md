# Codegen Glossary

Entry point for the sittir codegen pipeline — the DSL authoring layer
(enrich / wire / overrides), the compiler phases, and the emitters. This
document tells the pipeline story — what each stage is responsible for,
what flows between stages, and where each lives — and indexes into the
per-directory function glossaries under [`docs/glossary/`](glossary/),
which hold the per-function reference (mechanically relocated from source
JSDoc; the source files remain the ground truth).

## Pipeline order

```
enrich (author wraps grammar(enrich(base), wire({ … })))   ← module-load, pre-tree-sitter
  → evaluate (compiler/evaluate.ts: runs the DSL; dsl/wire/wire.ts folds overrides)
    → link (compiler/link.ts)
      → normalize (compiler/normalize.ts + compiler/wrapper-deletion.ts)
        → simplify (compiler/simplify.ts)
          → assemble (compiler/assemble.ts + compiler/model/node-map.ts + compiler/collect-slots.ts)
            → emit (emitters/*.ts, orchestrated by emitters/emit.ts)
```

`packages/codegen/src/run-codegen.ts` drives the whole run and writes the
per-grammar diagnostics file
(`packages/<lang>/.sittir/grammar-diagnostics.json`).

## Dual-pipeline execution model

`packages/<lang>/grammar.sittir.ts` executes **twice**, in two different
runtimes:

1. **Tree-sitter side.** `packages/codegen/src/transpile/` bundles it with
   esbuild (CJS, self-contained — enrich, wire, and the transform helpers
   are bundled inline) into `packages/<lang>/.sittir/grammar.js`, which the
   tree-sitter CLI executes with **its own** implementations of the
   `grammar()` / `seq()` / `choice()` / `optional()` DSL runtime to
   produce the parser artifacts (`.sittir/src/grammar.json`,
   `node-types.json`, `parser.c`, `parser.wasm`).
2. **Sittir side.** `evaluate()` (compiler/evaluate.ts) imports the same
   module and executes it with **sittir's own** implementations of the
   same DSL surface, producing the `RawGrammar` the compiler phases
   consume.

Both executions run the very same bundled enrich/wire code, which is what
keeps the two sides in agreement. Consequences:

- **Code inside the DSL execution reaches both sides.** Anything enrich,
  wire, clause-hoist, or the overrides do at module load (field promotion,
  `_kw_*` synthesis, hoisted `_<parent>_optional<N>` / `_<parent>_group<N>`
  helpers, field-enum synthesis, alias injection) is seen by the parser AND
  by the IR.
- **Anything minted only in evaluate's post-passes exists only on the
  sittir side**: it has no parser symbol and therefore no parser-issued
  kindId — the phantom-kind class the ratchet tracks (see Link). Field-enum
  synthesis moved from an evaluate-only post-pass to `enrich()` for exactly
  this reason — see Phase 0.
- The two runtimes normalize differently (sittir keeps a lowercase
  `optional` wrapper; tree-sitter lowers it to `CHOICE[x, BLANK]`), so
  DSL-side passes use the dual-case predicates in
  `types/runtime-shapes.ts` to recognize both forms.
- **Ground truth for "did tree-sitter see it" is
  `packages/<lang>/.sittir/src/grammar.json`** — not the sittir-side rule
  map.

## DSL layer (`dsl/`)

The authoring surface `grammar(enrich(base), wire({ … }))` and everything
that runs inside it:

- **`enrich(base)`** (`dsl/enrich.ts`) — mechanical pre-passes over the
  base grammar; see Phase 0 below.
- **`wire(config, base?)`** (`dsl/wire/wire.ts`) — folds the declarative
  override config (rules, polymorphs, transforms, groups, renderAs,
  conflicts, inline) into the options object before either runtime's
  `grammar()` sees it, and exposes collected metadata to the compiler
  phases via its wire context.
- **`transform()` / overrides** (`dsl/transform/`) — path-addressed
  structural rewrites of a rule body, the last-resort override form (after
  explicit rule structure and earlier-phase fixes).
- **DSL primitives** (`dsl/primitives/`) — sittir's implementations of the
  constructor surface, plus `role()` / `variant()` extensions.

Reference: [glossary/dsl.md](glossary/dsl.md),
[glossary/dsl-wire.md](glossary/dsl-wire.md),
[glossary/dsl-transform.md](glossary/dsl-transform.md),
[glossary/dsl-primitives.md](glossary/dsl-primitives.md).

## Function reference index

| Source directory (`packages/codegen/src/…`) | Glossary |
| --- | --- |
| `compiler/` (phases, ctx, rule catalog, SCC, generate) | [glossary/compiler.md](glossary/compiler.md) |
| `compiler/model/` (`NodeMap`, Assembled hierarchy, slots) | [glossary/compiler-model.md](glossary/compiler-model.md) |
| `compiler/diagnostics/` (grammar diagnostics, preflight) | [glossary/compiler-diagnostics.md](glossary/compiler-diagnostics.md) |
| `dsl/` (enrich, rule-transforms, rule-attrs, walker) | [glossary/dsl.md](glossary/dsl.md) |
| `dsl/primitives/` (seq/choice/field/alias constructors) | [glossary/dsl-primitives.md](glossary/dsl-primitives.md) |
| `dsl/transform/` (override `transform()` machinery) | [glossary/dsl-transform.md](glossary/dsl-transform.md) |
| `dsl/wire/` (override folding into the options object) | [glossary/dsl-wire.md](glossary/dsl-wire.md) |
| `emitters/` (all generated-output emitters) | [glossary/emitters.md](glossary/emitters.md) |
| `grammar-shapes/` (typed grammar-shape projections) | [glossary/grammar-shapes.md](glossary/grammar-shapes.md) |
| `transpile/` (grammar.sittir.ts → .sittir/grammar.js) | [glossary/transpile.md](glossary/transpile.md) |
| `types/` (Rule IR, runtime shapes, diagnostics types) | [glossary/types.md](glossary/types.md) |
| `scm/` | [glossary/scm.md](glossary/scm.md) |
| `scripts/` | [glossary/scripts.md](glossary/scripts.md) |
| `util/` | [glossary/util.md](glossary/util.md) |
| `validate/` (codegen-side validation helpers) | [glossary/validate.md](glossary/validate.md) |
| `src/` root (run-codegen, engine loader) | [glossary/root.md](glossary/root.md) |

## Rule IR and snapshots

One discriminated union (`Rule`, `packages/codegen/src/types/rule.ts`) flows
through the pipeline; which variants are present depends on the phase. Every
variant extends `RuleBase`, whose pushed-down modifier attributes
(`fieldName`, `multiplicity`, `nonterminal`, `separator`, `aliasedTo`)
deliberately mirror the slot vocabulary so values flow
rule → slot under identical names. `nonterminal === true` is the
authoritative slot-presence signal.

Three rule views coexist after Normalize (two carried as `SimplifiedGrammar`
fields — `rules` and `normalizedRules` — the post-link view attached only
per node in Assemble):

| View | Type | Produced by | Attached as | Consumed by |
| --- | --- | --- | --- | --- |
| Post-link wrapped view | `Rule<'link'>` | `applyNormalizationPasses` | `node.rule` (per node only) | the few justified wrapper-shape-dependent consumers (enumerated on `NodeMap.linkRules`'s doc comment) |
| Wrapper-free render view | `RenderRule` | `applyWrapperDeletion` | `normalizedRules` / `node.renderRule` | the `TemplateEmitter` |
| Derivation view | `SimplifiedRule` | `computeSimplifiedRules` | `rules` / `node.simplifiedRule` | slot derivation (`collectSlots`) → factories / wrap / from |

`RenderRule` excludes the wrapper node types (`optional` / `field` /
`repeat` / `repeat1`) — their meaning lives in leaf attributes.
`SimplifiedRule` additionally approaches the flat seq-of-leaves shape
(assertable via `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`).

`dsl/rule-transforms.ts::hasAnyField` is one of the few justified
wrapper-shape-dependent consumers: it walks `OPTIONAL`/`REPEAT`/`REPEAT1`/
`GROUP` wrapper nodes to answer "is there a FIELD anywhere in
this still-wrapper-bearing tree", genuinely needed only where a real
`Rule<'link'>` tree is in hand (`link.ts`'s own classification, and
`AssembledBranch.isContainerShape`'s deliberately link-phase `.rule`). At
normalize/simplify a FIELD has already collapsed to the `fieldName` /
`nonterminal` `RuleBase` attribute — a different, phase-appropriate check
(`hasSlotBearingContent` in `compiler/assemble.ts`) answers the same
question there instead of re-deriving it by walking wrappers.

## Phase 0: Enrich (`dsl/enrich.ts`)

`enrich(base)` runs at module load, **before tree-sitter consumes the
grammar** — the author writes `grammar(enrich(base), wire({ … }))` in
`packages/<lang>/grammar.sittir.ts`. Every rewrite therefore reaches both
the parser and the downstream IR; there is no second authoring layer.
Mechanical, strictly local passes: unambiguous bare-symbol → `field()`
wrapping (including inside choice arms), bare/optional keyword promotion
into hidden `_kw_*` rules, optional-symbol promotion, and clause hoisting
(`applyClauseHoist`) — `optional(seq(...))` content is minted into a hidden
`_<parent>_optional<N>` helper when inline-safe, or surfaced as a visible
kind via a hidden `_<parent>_group<N>` rule plus a reference-site `alias()`
when it carries multiple slots. Enrich-added fields carry
`source: 'enriched'`; collisions skip with a notification. Enrich stamps no
derived slot attributes — those are wrapper-deletion's job.

Runs last, over the fully merged rules bag (base + `_kw_*` + clause-hoist
groups): `synthesizeFieldEnumRules` mints a named, `prec(-1, …)`-wrapped
hidden rule for an inline field-enum (`field('operator', choice('+', '-',
…))`), giving tree-sitter a real symbol for a shape that would otherwise
collapse to anonymous tokens with no catalog row. Canonical naming prefers,
in order: an existing rule anywhere in the grammar with the identical
member set (reused verbatim, regardless of field name — the general fix
for what would otherwise be a duplicate, separately-symbolized production);
a field name shared by ≥2 distinct parent kinds; else `_<parent>_<field>`.
The low precedence defers to whatever else the same literal could
previously start, without a `conflicts:` entry per migrated occurrence.

Reference: [glossary/dsl.md](glossary/dsl.md).

## Phase 1: Evaluate (`compiler/evaluate.ts`, `dsl/wire/wire.ts`, `types/runtime-shapes.ts`)

`evaluate(entryPath)` executes the grammar DSL (grammar.js or
grammar.sittir.ts) with sittir extensions (`role()`, `variant()`,
`transform()`) and produces a `RawGrammar`. The DSL constructors normalize
as they build (degenerate-nesting collapse, `choice(x, blank())` →
optional, all-string choices → enum, comma-separated seq lift); a
post-pass synthesizes hidden rules for non-bare alias sources
(`synthesizeInlineAliasSources`) — field-enum synthesis is `enrich()`'s job
(Phase 0), not evaluate's, so the same rule tree-sitter compiled reaches
the IR unchanged. `wire(config, base?)` folds the declarative override config (rules,
polymorphs, transforms, groups, renderAs, conflicts, inline) into the
options object before tree-sitter sees it, and exposes the collected
metadata to the later phases via its wire context. The DSL globals run in
two runtimes (sittir's evaluator and tree-sitter's CLI), so
`types/runtime-shapes.ts` provides dual-case predicates that recognize both
the lowercase and the tree-sitter-normalized uppercase rule forms.

Reference: [glossary/compiler.md](glossary/compiler.md),
[glossary/dsl-wire.md](glossary/dsl-wire.md),
[glossary/types.md](glossary/types.md).

## Phase 2: Link (`compiler/link.ts`)

`link(raw, ctx?)` resolves what each node *is*, shape-preserving (no
restructuring). It resolves aliases (named aliases become symbols carrying
`aliasedFrom` provenance — the hidden source rule stays the single source
of truth and is promoted to user-facing visibility later by assemble's
alias-source mechanism), flattens token wrappers, classifies hidden rules
(enum / supertype / group), centralizes the separated-list lift
(`liftSeparators` — `repeat(seq(sep, x))` and `commaSep1` shapes become
separator-bearing repeats), infers field names from the symbol-reference
graph, classifies polymorphs (heuristic and `variant()`-sourced), and
annotates block-bearer fields. Link also stamps parser-issued kindIds onto
catalog refs; names it cannot stamp are reported as `kindid-unstamped-*`
diagnostics — the per-build phantom-kind inventory persisted to
`grammar-diagnostics.json` and ratcheted by
`packages/codegen/src/__tests__/phantom-kind-ratchet.test.ts` (shrink-only
ceilings).

Reference: [glossary/compiler.md](glossary/compiler.md).

## Phase 3: Normalize (`compiler/normalize.ts`, `compiler/wrapper-deletion.ts`)

`normalizeGrammar(linked, ctx?)` runs four steps and returns a
`SimplifiedGrammar` carrying all three rule views. First
`applyNormalizationPasses`: collapse degenerate wrappers, fan out
`seq(a, choice(b, c), d)` into a choice of seqs, factor common
prefix/suffix across choice branches, dedupe adjacent structurally-equal
members, inline single-use hidden rules (fixpoint) — non-lossy on named
content. Then `applyWrapperDeletion` pushes `optional` / `field` /
`repeat` / `repeat1` / `alias` wrappers down to leaf `RuleBase` attributes
("outer wins", idempotent), producing the wrapper-free `RenderRule` view.
Third, a fixed-point loop (up to 8 passes) of `inlineHiddenSeqRefs` splices
hidden-seq refs into their use sites on the render view — each pass can
expose fresh hidden-seq refs, and the keep-set is re-derived per pass.
Finally it calls `computeSimplifiedRules` (Phase 3.5) and threads top-level
alias bodies through the same three-step pipeline so Assemble reads
snapshots and never re-simplifies per call.

Reference: [glossary/compiler.md](glossary/compiler.md).

## Phase 3.5: Simplify (`compiler/simplify.ts`)

`computeSimplifiedRules(normalizedRules, ctx?)` computes the derivation-only
`SimplifiedRule` view consumed by slot derivation — templates deliberately
do NOT use it, so delimiters survive in render. It inlines parser-inlined
helpers (`inlineRefs` in `dsl/rule-transforms.ts`: anything in
`grammar.inline`, plus hidden group/multi refs, re-stamping the referring
symbol's attributes onto the inlined leaves), strips anonymous delimiters,
merges position-equivalent choice branches, hoists shared fields across
branches, and canonicalizes toward a flat seq of leaves. Simplify is
wrapper-node-free by construction: all rule construction goes through the
phase-injected `ctx.builder` (the `attributeBuilder`, which pushes
attributes instead of building wrapper nodes), and `simplifyRule`'s
`default` case throws if a stray wrapper node reaches it. Multiplicities
combine through an explicit lattice (`combineMultiplicity`) rather than a
survivor silently keeping its own.

Reference: [glossary/compiler.md](glossary/compiler.md),
[glossary/dsl.md](glossary/dsl.md).

## Phase 4: Assemble (`compiler/assemble.ts`, `compiler/model/node-map.ts`, `compiler/collect-slots.ts`)

`assemble(ctx)` is the first materialization of nodes. Each rule is
classified into a model type (branch / polymorph / supertype / group /
multi / enum / pattern / keyword / token), constructed as an
`AssembledNode` carrying its rule snapshots, and given names
(snake_case kind → PascalCase type / camelCase factory + property names,
with collision resolution and `ir.*` key assignment). Slot derivation is
`collectSlots` over the simplified rule — "a slot IS a
`nonterminal`-flagged node": seqs distribute member slots, field-named
choices stay one union slot, unnamed structural choices distribute into
arms and merge by name, and same-named slots across positions fold into one
slot whose values union. `hydrateSlotRefs` later replaces unresolved slot
value refs with concrete nodes (making the graph cyclic); parameterless and
user-facing kinds are marked by fixpoint passes.

Reference: [glossary/compiler.md](glossary/compiler.md),
[glossary/compiler-model.md](glossary/compiler-model.md).

### `classifyNode`'s RenderRule-only design

`classifyNode` (`compiler/assemble.ts`) reads `RenderRule` (the
wrapper-deleted normalize-phase view) exclusively, never the link-phase
`inlinedRule` — the reverse of `assemble()`'s node CONSTRUCTORS, most of
which still need `inlinedRule`'s pre-deletion wrapper node (`AssembledGroup`
being the deliberate exception noted on its own construction site;
`AssembledMulti` also constructs directly off `RenderRule` since a hidden
repeat helper's own body IS the repeat). An "undecorated" guard
(`fieldName === undefined && multiplicity === undefined`) gates the
SUPERTYPE/GROUP/PATTERN/STRING early-exit switch: `PATTERN`/`STRING` are
wrapper-COLLAPSIBLE (a `repeat1('.')` collapses to a bare-looking `STRING`
carrying `multiplicity: 'nonEmptyArray'`), so a *decorated* one is really a
field/repeat-wrapped leaf masquerading as bare and must fall through to
`classifyTerminalFallback` instead of early-exiting as keyword/token/pattern.
`hasSlotBearingContent` replaces the link-phase `hasAnyField(rule) ||
hasAnyChild(rule)` walk with the SAME question — "is there a named field or
a rule reference here" — narrower than "does this produce a slot at all"
(a repeat over terminals genuinely IS a slot per Table 2, which
`nonterminal` correctly reflects; `hasSlotBearingContent` isn't asking that).
`isAllTextShape` is phase-invariant by construction: `OPTIONAL`/`REPEAT`/
`REPEAT1`/`FIELD`/`ALIAS`/`TOKEN` collapse to `never` outside evaluate/link,
so the same switch correctly serves all three of its real callers —
`collectAnonymousNodes` (still-wrapper-bearing `Rule<'link'>`),
`classifyTerminalFallback` (normalize-phase `RenderRule`), and
`diagnoseSlotGrouping` (simplify-phase `SimplifiedRule`).

## Phase 5: Emit (`emitters/*.ts`)

`emitAll` (emitters/emit.ts) fans out to the emitters. Every emitter
follows the same canonical pattern: iterate `nodeMap.nodes`, dispatch on
`node.modelType`, and own all string generation locally — the compiler-side
Assembled classes expose data only. Template emission is the
`TemplateEmitter` (`runTemplateEmitter`, emitters/templates.ts), which
consumes `node.renderRule` per kind (per-form for polymorphs) and enforces
a slot-preservation gate (each declared slot appears exactly once in the
output; bypass with `SITTIR_SLOT_PRESERVATION=0`). Other emitters produce
types, factories, `.from()` resolvers, wrap functions, guards, consts, the
`ir.*` namespace, the native render/transport Rust modules, the
`node-model.json5` snapshot, `overrides.suggested.ts` (only when there are
suggestions), and per-kind tests.

Reference: [glossary/emitters.md](glossary/emitters.md).

## Diagnostics

Compiler diagnostics flow through a shared sink
(`compiler/diagnostics/grammar-diagnostics.ts`) and are persisted per
grammar to `packages/<lang>/.sittir/grammar-diagnostics.json` (committed,
so drift shows up in review). Notable codes: `kindid-unstamped-*` (the
phantom-kind inventory — see Link), `parsekind-noninjective`,
`seq-with-nested-seq`, `typename-collision`. Inspect via
`sittir tool grammar-diagnostics`.

`kindid-unstamped-symbols`/`kindid-unstamped-literals` (`link.ts`'s
`reportKindIdStampMisses`) are `warning`-severity, promoted from `info`: a
stamp miss means a referenced kind or literal never resolved a parser
kindId — visible now instead of deferring the gap to a native "unknown
kind id" render error, per the invariant's end-state goal. They report the
FULL miss set, not split by exclusion class — `reportVaporizedKinds`
partitions symbol misses three ways: `kindid-inline-excluded-symbols`
(in the grammar's authoritative `inline:` array), `kindid-vaporized-symbols`
(not inline AND unreachable from the grammar's root by an independent
reference-graph walk — real evidence of dead surface, not just the
complement of the inline check), and `kindid-unclassified-symbols`
(not inline but reachable — a genuine, unaccepted gap, reported at
`warning` severity so a future regression can't hide inside "vaporized").
Literal misses stay a two-way split (inline-excluded vs vaporized) since
bare literal text has no rule-name identity to test reachability against.
Cross-reference these codes against the unstamped codes to see which
entries already have an accepted reason.

Reference:
[glossary/compiler-diagnostics.md](glossary/compiler-diagnostics.md).
