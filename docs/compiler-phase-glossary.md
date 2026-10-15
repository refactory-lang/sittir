# Codegen glossary

Entry point for the grammar DSL, compiler phases, and emitters. This page
explains what each stage owns and what flows between stages. The
[function glossaries](glossary/README.md) hold each declaration's detailed
contract; source code is authoritative. For runtime and package boundaries,
read [Architecture](architecture.md).

## Pipeline order

```text
grammar.sittir.ts: sittirGrammar(base, config)
  → enrich → wire → active grammar implementation
  → evaluate (DSL execution and canonical compiler boundary)
  → link
  → normalize (normalization passes and flattenRules)
  → simplify (invoked by normalizeGrammar)
  → assemble
  → emit TypeScript APIs and native Rust transports/render bodies
```

`packages/codegen/src/run-codegen.ts` orchestrates the run and writes the
per-grammar `.sittir/grammar-diagnostics.json`.
`compiler/compile.ts` owns compilation and its diagnostic gate;
`compiler/generate.ts` connects compilation to generation.

## Dual-pipeline execution model

`packages/<grammar>/grammar.sittir.ts` executes twice:

1. **Tree-sitter.** `.sittir/grammar.js` re-exports the grammar entry.
   Node strips TypeScript types, so its import graph must use erasable
   syntax. Tree-sitter supplies its own `grammar`, `seq`, `choice`, and
   other DSL implementations and generates `.sittir/src/grammar.json`,
   `node-types.json`, and `parser.c`; the parser build produces
   `.sittir/parser.wasm`.
2. **Sittir.** `evaluate()` executes the same entry with Sittir's DSL
   implementation, then canonicalizes the result into `RawGrammar`.

Both executions call `sittirGrammar`, which applies the same enrichment
and authored wiring before invoking the active `grammar` implementation.
Field promotion, keyword helpers, clause hoists, token forms, field enums,
and alias rewrites performed there reach parser AND IR.

A kind synthesized only in a compiler post-pass has no parser-issued
identity merely because it appears in the IR. Inspect
`packages/<grammar>/.sittir/src/grammar.json` and a CST probe to establish
what the parser actually sees; the Sittir rule map alone cannot prove it.

The runtimes normalize shapes differently: Sittir can retain a lowercase
`optional`, while tree-sitter represents it as uppercase `CHOICE` with a
`BLANK` arm. DSL-side transforms use `types/runtime-shapes.ts` predicates
to recognize both representations.

## DSL layer (`dsl/`)

The authored entry is `sittirGrammar(base, config)`:

- `dsl/sittir-grammar.ts` composes enrichment, wiring, the active grammar
  implementation, synthesized-rule cleanup, text-token metadata, and
  conflict derivation/resolution.
- `enrich()` in `dsl/enrich.ts` performs mechanical structure changes
  before the parser/compiler split; see Phase 0.
- `wire()` in `dsl/wire/wire.ts` folds authored rules, patches, groups,
  render forms, conflicts, and inline configuration into the grammar
  options. Its metadata is available to later compiler phases.
- `transform()` in `dsl/transform/` supports path-addressed rule rewrites.
  Prefer explicit rule structure and an earlier-phase fix before using it.
- `dsl/primitives/` implements Sittir's constructors and extensions such
  as `role()` and `variant()`.

References: [DSL](glossary/dsl.md), [wire](glossary/dsl-wire.md),
[transform](glossary/dsl-transform.md), and
[primitives](glossary/dsl-primitives.md).

## Function reference index

The source implementation is authoritative. Each function's detailed contract and rationale live in its directory glossary.

| Source area | Reference |
| --- | --- |
| Compiler phases and contexts | [compiler](glossary/compiler.md) |
| Assembled model and slots | [compiler model](glossary/compiler-model.md) |
| Grammar and shape diagnostics | [compiler diagnostics](glossary/compiler-diagnostics.md) |
| Enrichment and DSL transforms | [DSL](glossary/dsl.md) |
| DSL primitives | [primitives](glossary/dsl-primitives.md) |
| Path-addressed transforms | [transform](glossary/dsl-transform.md) |
| Authored wiring | [wire](glossary/dsl-wire.md) |
| TypeScript and native emission | [emitters](glossary/emitters.md) |
| Construction overlays | [overlays](glossary/emitters-overlays.md) |
| Grammar-shape projections | [grammar shapes](glossary/grammar-shapes.md) |
| Parser scaffolding | [transpile](glossary/transpile.md) |
| Rule and diagnostic types | [types](glossary/types.md) |
| SCM support | [SCM](glossary/scm.md) |
| Codegen diagnostics/scripts | [scripts](glossary/scripts.md) |
| Shared utilities | [utilities](glossary/util.md) |
| Codegen validation helpers | [validation](glossary/validate.md) |
| Codegen orchestration | [root](glossary/root.md) |

## Rule IR and snapshots

The phase-parameterized discriminated union `Rule` lives in
`packages/codegen/src/types/rule.ts`. `RuleBase` carries identity,
provenance, and annotations; normalized phases also carry `fieldName`,
`multiplicity`, separator, tokenization, and spacing facts. `nonterminal`
marks slot-bearing content. These are canonical facts consumed by model
construction, not cues for each emitter to infer again.

The compiler preserves different views for different jobs:

| View | Type | Location | Consumer |
| --- | --- | --- | --- |
| Linked, wrapped rules | `Rule<'link'>` | `LinkedGrammar.rules` | Link and normalization passes needing wrapper structure |
| Wrapper-free render view | `RenderRule` | `SimplifiedGrammar.normalizedRules` | Render-rule resolution and render-body emission |
| Derivation view | `SimplifiedRule` | `SimplifiedGrammar.rules` | Classification, slot derivation, and construction-model creation |

Compilation retains the linked and normalized phase objects. Assemble
receives the simplified and render views and passes the appropriate view
to each model constructor. The model's protected `rule` is not a public
post-link snapshot; consumers must not assume it contains old wrappers.

`RenderRule` excludes `optional`, `field`, `repeat`, and `repeat1` wrapper
nodes: their meaning is represented as attributes.
`SimplifiedRule` further canonicalizes toward a flat sequence of leaves,
checkable with `SITTIR_ASSERT_UNIVERSAL_SHAPE=1`.

## Phase 0: Enrich (`dsl/enrich.ts`)

`enrich(base, authored)` runs inside `sittirGrammar` before the active
`grammar()` call. Structural changes therefore reach both parser and IR.
It promotes unambiguous symbol references into fields, synthesizes hidden
keyword helpers, and hoists clauses and token alternatives into grammar
rules with explicit identities. Added rule origins are retained for
later diagnostics.

`applyClauseHoist` lifts optional/grouped content into reusable helpers.
`hoistTokenForms` gives lexical alternatives distinct parser symbols;
`annotateTokenFormArms` and automatic-variant metadata retain their
construction relationship. Authored field sites and group bodies inform
these passes so mechanical enrichment respects authored structure.

Alias handling also belongs before the parser boundary: enrichment mints
literal-alias storage, distributes inline alias choices, and resolves
overloaded displays. `synthesizeFieldEnumRules` gives inline literal
choices real grammar rules; `mintInlineTextTokens` supplies named text
tokens. Whitespace enrichment adds the layout supertype and required
external symbols. These are parser-visible changes, not emitter guesses.

The merged rules pass through field wrapping, field-enum synthesis,
automatic variant stamping, text-token minting, and whitespace enrichment.
Field-enum synthesis is not the final enrichment pass. Normalized slot
attributes are produced later by the canonical flattening path.

Reference: [DSL](glossary/dsl.md).

## Phase 1: Evaluate (`compiler/evaluate.ts`, `dsl/wire/wire.ts`, `types/runtime-shapes.ts`)

`evaluate(entryPath, fileTypes)` executes the DSL through `evaluateDsl`,
then calls `canonicalGrammar` to produce `RawGrammar`. Sittir's DSL
constructors retain authored metadata while recognizing equivalent
runtime representations such as `choice(x, blank())` and `optional(x)`.

The canonical boundary in `compiler/canonical-rules.ts` normalizes
precedence, token wrappers, and degenerate nesting for later phases.
Parser-relevant alias and field-enum synthesis remains in enrichment;
adding it only here would leave the parser without the corresponding
symbol. Wiring metadata and evaluation-stage snapshots survive for
validation and diagnostic provenance.

References: [compiler](glossary/compiler.md),
[wire](glossary/dsl-wire.md), and [types](glossary/types.md).

## Phase 2: Link (`compiler/link.ts`)

`link(evaluated, ctx?)` resolves references and aliases against the parser
kind catalog. It derives the canonical `wordMatcher`, stamps parser
visibility and reference-site identities, classifies hidden rules, and
carries alias provenance for later storage and surface decisions.

Link also performs structural work: renamed-rule collapse, text-leaf
splicing, reference inlining, separator lifting, static render-form
stamping, and authored group handling. It is not a shape-preserving pass.
`liftSeparators` recognizes repeated separator/item structure once so
later phases consume the separator fact.

`structureTokenInterior` describes the pieces inside a lexed token using
literal runs and named slots. The parser still reads one lexical node;
the compiler retains the interior for construction and render consumers.
Reference-site storage and parse identities remain distinct from the
referenced rule's isolated identity.

`reportKindIdStampMisses` reports unresolved symbol/literal/alias-target
identities through compiler diagnostics. The phantom-kind ratchet pins
accepted debt; an unstamped reference is visible during generation rather
than discovered only as an unknown native kind at runtime.

Reference: [compiler](glossary/compiler.md).

## Phase 3: Normalize (`compiler/normalize.ts`, `compiler/flatten.ts`)

`normalizeGrammar(linked, ctx?)` first runs
`applyNormalizationPasses`, then `flattenRules` creates the wrapper-free
render view. Wrapper meanings become attributes through the canonical
flatten/attribute-builder path.

A bounded fixed-point loop runs `inlineHiddenSeqRefs` on the render view,
recomputing the keep-set on each pass. It then constructs `SimplifyCtx`
and calls `computeSimplifiedRules` with the `attributeBuilder` to produce
the derivation view.

Top-level alias bodies receive the corresponding normalization,
flattening, and simplification steps before their results join the output
maps. `SimplifiedGrammar` carries both `normalizedRules` and `rules`, so
Assemble does not independently simplify rules at each use site.

Reference: [compiler](glossary/compiler.md).

## Phase 3.5: Simplify (`compiler/simplify.ts`)

`computeSimplifiedRules(ctx: SimplifyCtx)` produces the derivation-only
view used for classification and slot construction. Render emission uses
the separate render view so syntax needed to print a node is retained.

`simplifyRules` and the attribute builder preserve wrapper meaning while
canonicalizing construction structure. Each result passes through
`canonicalizeSeqOfLeaves`, `flatten`, and `fuseHeadRepeatLists`; source
kind facts are retained with `withKindFacts`. Multiplicity belongs to
values and combines through the canonical multiplicity operations.

`SITTIR_ASSERT_UNIVERSAL_SHAPE=1` checks the canonicalized rules.
`diagnoseSlotGrouping` records unsupported grouping shapes in the shared
collector and diagnostic sink, so consumers do not invent their own
interpretation of an ambiguous slot layout.

References: [compiler](glossary/compiler.md) and [DSL](glossary/dsl.md).

## Phase 4: Assemble (`compiler/assemble.ts`, `compiler/model/node-map.ts`, `compiler/collect-slots.ts`)

`assemble(ctx)` materializes the model consumed by emitters. Its taxonomy
is `branch`, `envelope`, `polymorph`, `alias`, `supertype`, `enum`,
`keyword`, `punctuation`, `pattern`, and `list`. These model types are
independent of the parser's kind names and the eventual TypeScript names.

Assemble iterates render rules alongside their simplified counterparts,
classifies each kind, and constructs the appropriate model. Compound
constructors receive both views. Slot derivation uses `collectSlots` on
the simplified structure; each slot owns its values, multiplicities,
separator facts, and source rule identities. A `NodeRef` retains its
reference-site `parseKind`, `parseKindId`, and `storageKindId`.

Subsequent passes resolve naming collisions and construction keys, stamp
full/delimited forms and factory visibility, and compute indexes by rule
and kind ID. `hydrateSlotRefs` then resolves slot references against the
assembled graph; compilation invokes it before `stampIrSurface`.
Downstream emitters consume this graph rather than resolving strings or
walking rule trees to rediscover the same facts.

References: [compiler](glossary/compiler.md) and
[compiler model](glossary/compiler-model.md).

### `classifyNode` and the rule views

`classifyNode(kind, rule, opts?)` primarily reads `SimplifiedRule`.
`opts.renderRule` supplies a fallback when render syntax still references
a kind that simplification has reduced to text.

A seated structured rule is classified as a list or compound before leaf
classification. Otherwise an undecorated rule (`fieldName` and
`multiplicity` absent) can become an enum, supertype, pattern, keyword, or
punctuation. A decorated string or pattern must retain its slot/repetition
meaning rather than early-exiting as a bare leaf. Separated-list and
slot-bearing structure are handled before terminal fallback.

`hasSlotBearingContent` and `isAllTextShape` are canonical shape
predicates. Callers use their phase-appropriate rule view; emitters must
not recreate the predicates with partial wrapper walks or text heuristics.

## Phase 5: Emit (`emitters/*.ts`)

`emitAll` resolves render rules, static spacing, site preferences, and
address tables once, then dispatches the model by taxonomy to the
factory, coercion, wrap, render-body, and native render emitters. Each
emitter owns printing; the assembled model owns the shared semantic facts.

`TemplateEmitter` is the internal render-body emitter. It consumes the
render view, finalizes a body catalog, and runs the slot-preservation gate
unless `SITTIR_SLOT_PRESERVATION=0`. `RenderModuleEmitter` produces the
compiled grammar-owned Rust transports and render functions from those
bodies and the same model facts. There is no Jinja/Askama or JavaScript
template engine in the supported runtime.

Other outputs include type modules, strict/coercing factory modules and
overlays, typed wrappers, guards, constants, render options, construction
namespaces, package helpers, and tests. Orchestration writes the
node-model snapshot and generated suggestions when applicable. The
`.sittir/render-bodies.json` catalog is diagnostic output; the runtime
renders through compiled Rust code.

Reference: [emitters](glossary/emitters.md).

## Diagnostics

**Grammar diagnostics** describe shapes and authored configuration that
the grammar author must resolve. They carry a code, owner, intrinsic
`canProceed`, and supporting facts, and are persisted to the grammar's
`.sittir/grammar-diagnostics.json`.

`diagnoseGrammar` in `compiler/compile.ts` gates evaluation records before
collecting the linked/normalized/assembled diagnostics, then gates the
combined result. `blockedRecords` applies the grammar's
`expectDiagnostics` and explicitly allowed diagnostics. `compileGrammar`
throws `GrammarDiagnosticError` on a blocked diagnosis before hydration
and construction-surface stamping. Inspect with
`sittir tool grammar-diagnostics`.

**Compiler diagnostics** belong to the owning phase's `DiagnosticSink`
and generation log. A compiler invariant that cannot proceed throws at
its owner; it is not disguised as an authoring warning. Automatic type
renames are naming events on `AssembledNodeMap.namingEvents` and appear as
`[naming]` log lines.

`kindid-unstamped-symbols` and `kindid-unstamped-literals` report the full
miss sets. `reportVaporizedKinds` separately distinguishes parser-inline
exclusions, kinds unreachable from the root, and reachable unclassified
misses. Reachable unresolved kinds remain warnings rather than being
accepted as dead grammar surface. Compare these categories with the
unstamped inventory and the shrink-only phantom-kind ceiling.

Reference: [compiler diagnostics](glossary/compiler-diagnostics.md).
