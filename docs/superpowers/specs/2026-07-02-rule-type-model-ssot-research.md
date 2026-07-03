# Rule/Grammar Type-Model SSOT — Research

**Status:** research (2026-07-02), feeds a brainstorming session — not an implementation plan.
**Framing (user):** "RuleBase\<T\> was a step in the right direction, but we otherwise have
rules defined in multiple files in multiple places… nominally different use cases (typing
for the override files vs. compiler pipeline) but there should still be a SSOT. Same goes
for other structures/types."
**Prior art:** [R12 unified phase context](2026-06-29-r12-unified-phase-context.md) (ctx
consolidation, COMPLETE), [R12 RuleWalker](2026-07-01-r12-rulewalker-design.md) (one
child-edge relation), `docs/compiler-phase-glossary.md` §"Rule IR" (line 58) and §"Phase 1:
Evaluate" (line 191 — which already names `types/runtime-shapes.ts` as part of the
evaluate boundary).

---

## 0. The structural fact everything else follows from

The DSL layer (`dsl/enrich.ts`, `dsl/transform/*`, `dsl/wire/*`, `dsl/primitives/*`) is
**one source tree that physically executes under two different runtimes**:

1. **Sittir runtime** — `compiler/evaluate.ts::saveAndInjectDslGlobals`
   (evaluate.ts:2361) injects sittir's own lowercase constructors (`seq` →
   `{type:'seq', members}`, evaluate.ts:96) as globals *before* importing
   `overrides.ts` / upstream `grammar.js`. Every rule object in the pipeline is
   lowercase **by construction**.
2. **Tree-sitter CLI runtime** — `packages/<lang>/.sittir/grammar.js` is the
   esbuild bundle of `overrides.ts` (bundle header requires
   `tree-sitter-rust/grammar.js` directly — `packages/rust/.sittir/grammar.js:38`).
   There, `seq`/`choice`/… are tree-sitter's native `dsl.js` functions producing
   UPPERCASE objects (`{type:'SEQ'}`), which tree-sitter's own `grammar()` then
   consumes to emit `grammar.json`.

So the dual vocabulary is **not two type definitions that drifted** — it is two
*object producers* owned by two different systems feeding one shared code path. Sittir
owns the lowercase IR; tree-sitter owns the uppercase natives. Any SSOT design that
assumes one of them can be rewritten into the other at runtime fails immediately for the
CLI path: those objects must remain tree-sitter natives because tree-sitter consumes them
next (you cannot lowercase an object you hand back to `grammar()`).

The differences are also **structural, not just case**:

| Divergence | Sittir IR | Tree-sitter native / grammar.json |
|---|---|---|
| optional | `{type:'optional', content}` (rule.ts:264) | lowered to `CHOICE(x, BLANK)` (grammar-json.ts:36–38) |
| prec | **stripped** at evaluate (runtime-shapes.ts:44–45) | preserved as `PREC`/`PREC_LEFT`/… nodes |
| BLANK | does not exist | first-class leaf |
| `$` refs | `{type:'symbol', name}` | CLI sometimes wraps as `{symbol:{type:'SYMBOL',…}}` (runtime-shapes.ts:86–90) |
| `word` | resolved rule-name string | still the raw `$ => $.identifier` callback (enrich.ts:114–131, extractWordName enrich.ts:341) |
| supertypes | `['_expr', …]` strings | `[{type:'SYMBOL',name}, …]` (enrich.ts:324–328) |
| enum/variant/group/supertype/indent/dedent/newline | IR-only node types | no counterpart |

Case-normalization alone therefore unifies **nothing important**; the two vocabularies are
non-isomorphic unions.

---

## 1. Inventory — every place a rule shape is DEFINED

### 1a. Rule shapes proper

| # | Definition | File (size) | Vocabulary | Serves | Consumers |
|---|---|---|---|---|---|
| R1 | `Rule<Phase>` union, `RuleBase<Phase>`, `AnyRule`, `RenderRule`/`SimplifiedRule` brands, per-variant guards, `SymbolRef`, `replaceAtPath`, `sym()` | `types/rule.ts` (628 ln) | lowercase discriminants; readonly props but **mutable member arrays** (`members: Rule<T>[]`, rule.ts:261); phase-gated attrs via conditional types (rule.ts:132–167) | the compiler IR, evaluate→emit | **75 importing files** |
| R2 | Discriminant tag constants (`SEQ = 'seq'`, …) | `types/rule-types.ts` (37 ln) | lowercase consts; **self-declared deprecated** — "second vocabulary that can drift", kept only to avoid a "~5.8k-site / ~70-file codemod" (rule-types.ts:9–15; plan: `docs/superpowers/plans/2026-06-05-rule-type-consts-codemod.md`) | everything that switches on `rule.type` | **60 importing files** |
| R3 | `RuntimeRule` supertype + dual-case predicates (`typeEq`, `isSeqType`…, `isSymbolLike`, `isPrecWrapper`, `extractSymbolName`) | `types/runtime-shapes.ts` (185 ln) | `{type: string}` supertype; predicates accept `'seq' \| 'SEQ'` | the dual-runtime DSL layer (§0); header **forbids** import from `compiler/`/`validate/` (runtime-shapes.ts:22–27) | 10 files, **149 predicate callsites** |
| R4 | `GrammarNode` family: `Seq<M>`/`Choice<M>`/`Str<V>`/`Pattern`/`Sym`/`Field<N,C>`/`Alias`/`Token`/`Prec*`/`Blank` + `AuthoringRule`, `AuthoringRuleToNode/RulesToRules`, `GrammarJson`, `MutableDeep` | `grammar-shapes/grammar-json.ts` (194 ln) | UPPERCASE (tree-sitter's discriminants, *refined*); **readonly tuples** — documented as mutually exclusive with tree-sitter's mutable `Rule` (grammar-json.ts:20–35) | typed authoring surface for overrides.ts; the `as const` grammar-shape emit | 6 files (dsl + authoring-globals) |
| R5 | `EnrichRule<N>` — type-level twin of runtime `enrich()` field insertion | `grammar-shapes/enrich-type.ts` (305 ln) | type-level programming over R4; hardcodes `RustSupertypes` (enrich-type.ts:69) | precise `previous`/`original` in overrides.ts transforms | 8 files — 5 are tests (incl. `enrich-fidelity.test.ts`, the **empirical** contract check) |
| R6 | `RecursiveRuleBuilder`, `Resolve` (depth-bounded symbol expansion) | `grammar-shapes/grammar-twin.ts` (76 ln) | twins tree-sitter's ambient `RuleBuilder`/`GrammarSymbols` | wire's typed callbacks | wire.ts |
| R7 | `NodeAtPath`, `TopLevelKeys`, `PathKey`, `TransformPatchMap`, `FastKeys` | `grammar-shapes/path-type.ts` (190 ln) | type-level path addressing over R4 | typed transform patch-map keys | wire.ts + type-tests |
| R8 | `rustGrammarShape` `as const` literal | `grammar-shapes/grammar-shape.rust.ts` (**9,657 ln, GENERATED** by `emit-grammar-shape.mjs`) | R4 instantiated with concrete tuples | rust overrides typing — **rust is the only grammar with this today** (emit-grammar-shape.mjs:12: "Currently rust-only (the proving grammar)"); python/ts call bare `wire({…})` untyped | rust overrides.ts |
| R9 | tree-sitter ambient `dsl.d.ts`: `Rule`, `RuleOrLiteral`, `SymbolRule<N>`, `GrammarSchema`, `GrammarSymbols`, `RuleBuilder`, `RustRegex` (external, node_modules) | — | UPPERCASE, **mutable** members | the thing R4 refines and R6 twins; pulled in via tsconfig.overrides.json `types` | overrides tsconfig scope |
| R10 | `declare global` DSL signatures (`seq`/`choice`/`field`/… typed over R4) | `dsl/authoring-globals.d.ts` (77 ln) | ambient overloads merging with R9's globals | overrides.ts IntelliSense | overrides.ts files |

Supporting cast (not definitions of a rule shape, but rule-shape *machinery* with their own
partial vocabularies): `dsl/rule-transforms.ts` (`RuleBuilder` interface + `structuralBuilder`,
rule-transforms.ts:34/48; `attributeBuilder` lives in `compiler/simplify.ts:65`),
`dsl/rule-walker.ts` (`RuleWalker<R>` — the R12 one-edge-relation walker; note its local
`type StampedSeparator = RuleBase<'optimize'>['separator']` alias, rule-walker.ts:15).

### 1b. Secondary structures ("other structures/types")

| Structure | Definition(s) | SSOT status |
|---|---|---|
| Grammar containers | `RawGrammar` (compiler/types.ts:135), `LinkedGrammar` (:318), `OptimizedGrammar` (:415) — plus `GrammarJson` (grammar-json.ts:160), `EnrichedGrammar<B>` (dsl/enrich.ts:100), `GrammarResult` bag (enrich.ts ~:85), tree-sitter's ambient `Grammar`/`GrammarSchema` | Compiler-side trio is coherent (one file, phase-per-type — same pattern as `Rule<Phase>` but via separate interfaces rather than a parameterized one). The *authoring-side* containers are a second family, unavoidable per §0, but there are **four** of them |
| Slot/node model | `AssembledNode` hierarchy + `AssembledNonterminal` + `NodeRef`/`NodeOrTerminal`/`SlotCardinality`/`FieldStorageInfo` — all in `compiler/model/node-map.ts` (single 3.4k-ln module, deliberate R6 decision) | **Good** — one definition site. `Multiplicity` (rule.ts:56) deliberately mirrors `NodeOrTerminal.multiplicity` vocabulary (rule.ts:47–49, per `feedback_rule_slot_vocabulary_alignment`) — an *alignment convention held by hand*, not by types |
| Separator | Three-shape union on `RuleBase.separator` (`string \| Rule[] \| {rules,trailing,leading}`, rule.ts:144–151) + link-phase `repeat.separator?: string` (rule.ts:281) + `StampedSeparator` local alias (rule-walker.ts:15) | One authoritative union, but the string→object phase transition is prose ("wrapper-deletion converts…", rule.ts:135–139), not typed |
| `SymbolRef` | rule.ts:564 | single |
| `PolymorphVariant`/`ExternalRole` | `types/ir.ts` (R11) — **the layering pattern that works**: both dsl and compiler import DOWN; compiler/types.ts re-exports (:29–30) | single |
| `RefineForm` | **duplicated**: `dsl/wire/wire.ts:135` and `compiler/types.ts:202`, the latter self-documenting: "duplicated from `dsl/wire/wire.ts::RefineForm` as a plain type so the compiler tier doesn't import the DSL layer" | accidental duplicate — exactly what types/ir.ts exists to fix |
| Rule catalog/provenance | `RuleCatalog*`, `RuleProvenance`, `RuleClassification` (compiler/types.ts:36–65); note `ruleType: AnyRule['type']` (:46) correctly derives from R1 | single |

### 1c. The symptom bugs (motivation)

- `util/word-matcher.ts::ruleToRegexSource` — a **util-layer** (`types ← util ← dsl ←
  compiler`) walker forced dual-case via `String(rule.type).toLowerCase()`
  (word-matcher.ts:95) with a DUAL-CASE doc comment (:81–88): before the fix, the CLI path
  silently fell back to `/^\w+$/` while the sittir path used the real word rule —
  **keyword promotion diverged between parser and IR** (PR #111 review finding).
- `dsl/enrich.ts::extractWordName` (:341) — `word` is a resolved string in one runtime and
  a raw callback in the other; resolved via a symbol-shaped `Proxy` trick. Same class:
  per-site "accept both forms" shims (`extractSupertypeNames`/`harvestSupertypeNames`
  enrich.ts:324–381 accept both `[{name}]` and `['name']` arrays).
- `types/runtime-shapes.ts` itself contains **lies**: `isSeqType`'s uppercase narrow-arm is
  `{ type: 'SEQ'; content: Rule }` (runtime-shapes.ts:163) — but SEQ carries `members`, not
  `content` (same defect on `isChoiceType`/`isSymbolType`/`isStringType`, :166–179, and the
  `Rule` there is sittir's union, not tree-sitter's). The boundary module can drift too —
  nothing type-checks it against R4.
- 58 raw uppercase-discriminant literal lines remain scattered across 10 dsl files +
  `compiler/evaluate.ts:530` + word-matcher, **despite** runtime-shapes.ts existing to
  centralize them (its own header: "Rather than scatter `t === 'seq' || t === 'SEQ'`
  ladders through every file, consolidate…" — adoption is partial).

---

## 2. Essential vs accidental differences

**Essential (cannot be defined away):**

1. **UPPERCASE in R4/R9** — tree-sitter's own emit format. R4's header is explicit:
   "SINGLE VOCABULARY: these are tree-sitter's discriminants, refined" (grammar-json.ts:15).
   Sittir does not own this vocabulary.
2. **Readonly tuples in R4** — required by the `as const` grammar-shape emit + positional
   path indexing; *proven* mutually exclusive with assignability to tree-sitter's mutable
   `Rule` (grammar-json.ts:20–35). The `MutableDeep` bridge exists solely to prove the
   subtyping ladder.
3. **Phase-gated attributes in R1** — `Rule<'evaluate'>` vs `RenderRule` is compiler
   semantics (which variants exist when), not vocabulary drift. This is the RuleBase\<T\>
   direction the user endorses.
4. **Structural divergences** (§0 table): optional-vs-CHOICE(BLANK), prec
   stripped-vs-present, callback-vs-resolved `word`. These make the unions non-isomorphic —
   no case-transform mapping can convert one to the other.
5. **`RuntimeRule` being shape-minimal** — deliberate, so sittir Rule interfaces are
   structurally assignable via `type` alone (runtime-shapes.ts:50–54).

**Accidental (drift / convenience copies / incomplete consolidation):**

1. `types/rule-types.ts` const layer — self-declared deprecated second vocabulary (60 files).
2. `RefineForm` duplication (wire.ts:135 vs compiler/types.ts:202) — layering-driven copy;
   the `types/ir.ts` precedent (PolymorphVariant, R11) shows the correct fix.
3. The 58 scattered uppercase literals in dsl/ — the boundary module exists; adoption stopped.
4. The wrong narrow-arm types inside runtime-shapes itself (§1c) + the confusingly-inverted
   `IsRuntimeRule<T>` name (true ⇒ *lowercase/sittir* shape, runtime-shapes.ts:159).
5. `word-matcher.ts` doing its own case normalization instead of consuming boundary
   predicates — the dual-case leaked *below* the dsl layer into util.
6. Vestiges: `EnumRule` alias + retired `ENUM`/`TERMINAL` tags; `RuleIdentity` deprecated alias.
7. Per-site "accept both forms" shims (`extractWordName`, `harvestSupertypeNames`) not
   collected in one place.
8. `StampedSeparator` alias local to rule-walker rather than exported beside `RuleBase`.

---

## 3. Candidate SSOT designs

### Option (i) — generate one vocabulary from the other (type-level mapping or codegen)

*Type-level direction:* derive R4 from R1 (or vice versa) via a case-transform +
readonly-tuple lift mapped type.

**Why it fails:** the unions are non-isomorphic (§0 table) — any mapping needs a divergence
table (optional→CHOICE+BLANK, drop enum/variant/group/…, add BLANK/PREC*/IMMEDIATE_TOKEN),
and that table *is itself a second source of truth*, now written in the least-debuggable
language available (conditional types). The repo already has the cost evidence:
`enrich-type.ts` is 305 lines of type-level programming to mirror **one** runtime function,
requires an *empirical* fidelity test against all 182 rust rules to stay honest
(enrich-type.ts:10–12), hardcodes `RustSupertypes`, documents tsserver/vue-tsc-specific
collapse hazards (the `ReplaceOptionalMembers` comment, enrich-type.ts:215–221), and sits
one careless annotation away from TS2589 (the wire\<EnrichedGrammar\> comments in
`packages/rust/overrides.ts:54–66` exist to hold that line). Multiplying that machinery to
cover the *whole* vocabulary — with overrides.ts `$` autocomplete inference (the crown
jewel) downstream of it — maximizes exposure of the most fragile asset to the most fragile
technique.

*Codegen direction* (emit both `.ts` files from a neutral spec): more tractable — the
generator is ordinary code and R8 already establishes generated-type-file precedent. But it
still needs the divergence table, adds a build step for ~230 lines of hand-maintainable
types, and the protected fact (discriminant spellings) changes ~never. Poor cost/benefit.

**Verdict: reject** (either direction). Keep type-twin machinery scoped to where it pays
(enrich fidelity for `previous` precision), don't extend the pattern.

### Option (ii) — single physical definition + case-insensitive discriminant handling

Two sub-readings:

*(ii-a) One union with `'seq' | 'SEQ'` discriminants everywhere.* Blast radius: the 75
importers of R1 and the ~5.8k discriminant sites (rule-types.ts:13). Destroys exhaustive
`switch (rule.type)` narrowing — directly violates `feedback_rule_type_discrimination`
(switches-first, exhaustiveness-checked) and R12 RuleWalker decision 4 ("the walker owns
recursion, never dispatch" precisely to preserve exhaustive switches). And per §0 it
*still* wouldn't unify: optional/prec/BLANK are structural, and the CLI-path objects must
remain tree-sitter natives. **Reject.**

*(ii-b) Normalize case at the pipeline boundary so the compiler is single-case.* This is
**already true**: `saveAndInjectDslGlobals` makes every in-pipeline object lowercase by
construction, and `feedback_rule_case_as_origin_signal` treats case as a deliberate
leak detector. The residual dual-case zone (dsl/) exists precisely because that code runs
*before* the boundary in the other runtime — it cannot be normalized away without copying
the DSL layer per-runtime (a DRY loss far worse than the predicates). **Nothing left to do
except keep enforcing it** — which is Option (iii).

### Option (iii) — two vocabularies, ONE boundary module owning all conversions ★ recommended

Reframe the SSOT target per DRY's actual unit ("each fact should have one source and one
derivation"): the *vocabularies* are facts owned by two systems (tree-sitter owns
uppercase natives; sittir owns the lowercase IR) — two sources is correct. The fact that
fragments is **"how to recognize / convert a rule shape across runtimes"**, and its single
source should be `types/runtime-shapes.ts` — which half-is that module already, is named in
the phase glossary as part of the evaluate boundary, and sits at the right layer
(`types ← util ← dsl`). The work is *finishing* it and *mechanically enforcing* it:

1. **Fix the boundary module's own lies** — correct the uppercase narrow-arms
   (SEQ/CHOICE→`members`, and tree-sitter-shaped members, not sittir `Rule`); rename or
   document `IsRuntimeRule`; optionally derive the uppercase tag set as
   `Uppercase<AnyRule['type']>` where memberships overlap so predicate typos can't drift
   (cheap type-level reuse — nothing like Option (i)'s mapping).
2. **Complete adoption** — sweep the 58 raw uppercase literals in dsl/ + evaluate.ts:530
   through the predicates; route `word-matcher.ts`'s case normalization through a single
   exported `normalizedTypeOf(rule)`/predicate set so the util layer stops owning case
   logic.
3. **Collect the "accept both forms" shims** — `extractWordName`,
   `harvestSupertypeNames`-style resolvers move next to the predicates (they are the same
   boundary concern: value-shape, not just tag-case). Add the missing structural
   normalizer, e.g. `optionalInnerOf(rule)` handling both `{type:'optional'}` and
   `CHOICE(x, BLANK)` — that pattern is currently re-derived in enrich.ts *and* mirrored in
   enrich-type.ts's `OptionalInner`.
4. **Mechanize the two social rules** — the runtime-shapes header bans compiler-side
   imports; `feedback_rule_case_as_origin_signal` bans uppercase leakage. Both are
   enforceable today with ast-grep/lint gates (user-level hook infrastructure exists):
   (a) no uppercase discriminant literal outside `types/runtime-shapes.ts` +
   `grammar-shapes/`; (b) no `runtime-shapes` import under `compiler/`/`validate/`.
5. **Adjacent SSOT debts that ride along** (same theme, separable PRs): `RefineForm` →
   `types/ir.ts` (follow the PolymorphVariant precedent); export `StampedSeparator` from
   rule.ts; and — the big one, already planned — execute the `rule-types.ts` codemod so R2
   dies and R1 becomes the only compiler-side spelling.

**Repo conventions score:** DRY-as-#1 favors (iii) once the fact is identified correctly;
layering favors it (the module is already at the right level); `feedback_metadata_not_behavior`
is untouched (predicates are structural); `feedback_rule_type_discrimination` is preserved
(compiler switches stay exhaustive; only the dsl layer uses predicates — which is the
current documented split). Option (i) fights the crown jewel; (ii-a) fights the switch
convention; (iii) fights nothing.

**Failure modes of (iii), named:** (a) it does not *reduce* the number of vocabularies —
if the user's goal is literally "one type", this is a reframe, and the design discussion
should confront that head-on (the §0 argument is why one type is unattainable, not just
inconvenient); (b) the lint gate needs an allowlist for `grammar-shapes/` and generated
files, and ast-grep rules on string literals are blunt — expect a few `// @boundary-ok`
escapes; (c) predicate-based narrowing is weaker than literal switches (guards return
intersection types) — sweeping a site can *change* inferred types and surface latent
`never`s; each sweep PR needs a type-check + validate:native gate, not just a grep gate;
(d) the fixed narrow-arms in step 1 may break callers currently (mis)relying on the wrong
`content` arm — audit the 149 callsites for uppercase-arm property access first.

---

## 4. Recommended migration shape (PR-sized, gated)

Crown jewel to protect: overrides.ts inference (`$` autocomplete + typed `previous` +
TS2589 headroom). Note it depends **only** on `grammar-shapes/*` + `authoring-globals.d.ts`
+ wire's type params — Option (iii) *never touches those files*, which is the strongest
argument for it. Gate every PR with: `pnpm validate:native` counts hold + type-check of
`packages/rust/overrides.ts` under tsconfig.overrides.json + the existing negative-control
type tests (`intellisense-demo.test-d.ts` et al.).

- **PR-1 (small, self-contained):** fix runtime-shapes narrow-arm lies + `IsRuntimeRule`
  naming; add a unit test asserting predicate narrow-arms against both real shapes.
  *Breaks first:* any caller reading `.content` off an uppercase SEQ arm (audit first).
- **PR-2:** sweep dsl/'s 58 uppercase literals + evaluate.ts:530 into predicates;
  word-matcher case-handling → boundary helper. *Breaks first:* changed narrowing at swept
  sites; word-matcher behavior must stay byte-identical (regression history: PR #111).
- **PR-3:** move `extractWordName`/`harvestSupertypeNames` + add `optionalInnerOf` to the
  boundary module; enrich.ts consumes them. Pure moves + one dedup.
- **PR-4:** lint/ast-grep gates (uppercase-literal ban outside boundary; compiler-side
  import ban). Mechanical; no runtime change.
- **PR-5:** `RefineForm` → types/ir.ts; `StampedSeparator` export. Trivial.
- **PR-6 (independent track, pre-planned):** the rule-types.ts const codemod
  (`2026-06-05-rule-type-consts-codemod.md`) — the largest single dedup available
  (~5.8k sites), orthogonal to the boundary work.

---

## 5. Terminology review

Same surface as §1; each entry: what the name actually denotes, why it misleads, proposal,
blast radius (rg over `packages/codegen/src` unless noted). Feeds the same Option (iii)
recommendation — under (iii) each vocabulary keeps its own *suffix convention*, and the
boundary/lint work enforces the naming split the same way it enforces the case split.

### 5.1 `GrammarNode` (user-named)

- **Denotes:** the union of *rule-body expression* shapes in a compiled `grammar.json`
  (grammar-json.ts:125–142) — a `SEQ`/`CHOICE`/`STRING`/… tree position, i.e. a fragment of
  one rule's definition.
- **Why it misleads, twice:** (a) in this codebase "node" overwhelmingly means a *tree
  node of the parsed/assembled language* — `AssembledNode`, `NodeMap`, `NodeRef`,
  `node-types.json`, CST nodes. A `GrammarNode` is none of these; it's grammar-*definition*
  syntax, not parsed-program syntax. (b) "grammar node" also reads as "a node OF the
  grammar" = a named rule/kind — but the named-rule level is `GrammarJson['rules']`
  entries; `GrammarNode` is the *body expression* level below that.
- **Proposal:** `GrammarJsonNode` (pairs with the existing `GrammarJson` container and the
  `<X>Node` alias family that already exists for this vocabulary — see §5.3), or
  `CompiledRuleNode` if the grammar.json linkage should be explicit.
- **Blast radius:** 93 occurrences / 9 files (all dsl/ + grammar-shapes/; zero
  compiler-side — the rename never touches the pipeline).

### 5.2 optimize → normalize rename residue (user-named)

The rename **happened at the file/function/ctx level and stopped**. Current state:

| Layer | State | Evidence |
|---|---|---|
| File | renamed | `compiler/normalize.ts` exists ("compiler/normalize.ts — Normalize phase", :1); `compiler/optimize.ts` is **gone** |
| Entry fn / ctx | renamed | `normalizeGrammar` (normalize.ts:375), `NormalizeCtx` (:35, extends `BaseCtx<Rule<'link'>>`) |
| Output type | residue | `OptimizedGrammar` (compiler/types.ts:415) — 13 occ / 7 files |
| Call site | residue | `const optimized = normalizeGrammar(linked, normalizeCtx)` (generate.ts:237) — the sentence is self-contradictory |
| Phase name | residue | `PhaseName = 'evaluate'\|'link'\|'optimize'\|'simplify'` (rule.ts:74), `OptimizedPhase` (rule.ts:77), `RuleBase<Phase = 'optimize'>` default — `'optimize'` literal: 42 occ / 10 files (only 2 explicit `Rule<'optimize'>`; the default absorbs the rest) |
| Comments | residue | rule.ts:27/70/226 ("applyWrapperDeletion in optimize.ts"), node-map / collect-slots / templates / wrapper-deletion — ~291 total `optimiz` strings in src |
| Docs | residue | glossary heading "Phase 3: Optimize (`compiler/optimize.ts`)" (compiler-phase-glossary.md:299) cites a **dead file path**; 45 doc files mention optimize (most are historical specs — leave those; fix only living docs) |

- **Recommend canonical: `normalize`** — it's what the file, function, and R12 ctx already
  chose, and it matches the compiler-simplification design's phase taxonomy (Normalize =
  non-lossy canonicalization, Simplify = lossy-by-consumer). Reverting the file/fn/ctx to
  "optimize" would be the larger and semantically worse rename ("optimize" implies
  optional performance work; this phase is mandatory canonicalization).
- **Rename set:** `OptimizedGrammar`→`NormalizedGrammar` (13 occ);
  `'optimize'`→`'normalize'` in `PhaseName` + `OptimizedPhase`→`NormalizedPhase` (42 occ —
  *type-level only*: `PhaseName` has no runtime values, so zero behavior risk);
  `optimized`→`normalized` locals (generate.ts:237,243); comment sweep in
  rule.ts/node-map.ts/wrapper-deletion.ts; glossary Phase-3 heading + body. Historical
  specs/plans stay untouched (they are records).
- One subtle trap the rename should also fix or document: `OptimizedGrammar.rules` is
  typed `Record<string, Rule<'link'>>` (compiler/types.ts:417) while `Rule<'optimize'>`
  describes only its `renderRules` view — the phase-named container and the phase-named
  rule view **do not refer to the same field**.

### 5.3 The X / XRule / XNode families (user-named)

Who owns which spelling **today**:

| Spelling | Vocabulary | Examples | Where |
|---|---|---|---|
| `<X>Rule`, lowercase discriminants, phase-parameterized | sittir IR | `SeqRule<Phase>`, `ChoiceRule<Phase>`, `SymbolRule<Phase>` | types/rule.ts |
| `<X>Rule`, UPPERCASE discriminants, mutable | **tree-sitter ambient** | `SeqRule`, `ChoiceRule`, `SymbolRule<Name>`, `AliasRule`, `TokenRule`… (dsl.d.ts:1–17) | node_modules `tree-sitter-cli/dsl.d.ts`, in scope under tsconfig.overrides.json |
| bare `X` (+ `Str`/`Sym` abbreviations), UPPERCASE, readonly tuples | authoring/compiled | `Seq<M>`, `Choice<M>`, `Field<N,C>`, `Str<V>`, `Sym<N>` | grammar-shapes/grammar-json.ts |
| `<X>Node` | the *same* authoring vocabulary, aliased at import | `Seq as SeqNode`, `Choice as ChoiceNode`… (7 alias-import sites; re-exported at enrich-type.ts:305) | enrich-type.ts, path-type.ts |

The worst fact here: **tree-sitter's ambient types use the exact identifiers sittir's IR
uses** — `SeqRule`, `ChoiceRule`, `SymbolRule`, `AliasRule`, `TokenRule`, `StringRule`,
`PatternRule`, `RepeatRule`, `Repeat1Rule`, `FieldRule` — with different discriminant
case, different mutability, different member types. In any overrides-scoped file, bare
`SymbolRule` resolves to tree-sitter's; one `import type { SymbolRule } from
'types/rule.ts'` flips every annotation's meaning silently (89 `SymbolRule` occurrences
straddle the two). And the authoring vocabulary already spells the *same* concept three
ways (`Seq` at definition, `SeqNode` at import, tree-sitter's `SeqRule` underneath).

Converged convention — falls out of each SSOT option, as requested:

- **Under (iii) (recommended):** one suffix per vocabulary, mechanically enforced like the
  case split. The IR keeps `<X>Rule` (75-file surface — it stays put; it is also the
  vocabulary that "wins" compiler-side). The authoring/compiled vocabulary standardizes on
  `<X>Node` *at the definition* (rename `Seq`→`SeqNode` etc. in grammar-json.ts, deleting
  the 7 import-alias respellings; 6 importing files; the 9.7k-line generated shape file is
  unaffected — it instantiates via `as const satisfies GrammarJson` and never names node
  types). `GrammarNode`→`GrammarJsonNode` completes it: **Rule = sittir IR, Node =
  grammar.json shape**, and tree-sitter's ambient `<X>Rule` stays visibly foreign.
  Companion guideline, lintable: never import IR types into overrides-scoped files.
- **Under (i):** the generator picks one stem and emits both vocabularies from it — naming
  converges by construction, but only after buying the divergence-table machinery §3
  rejects.
- **Under (ii-a):** one union, one name — moot, since (ii-a) is rejected on other grounds.

### 5.4 Other misleading/ambiguous terms encountered while inventorying

| Current name | Actually is | Why it misleads | Proposal | Blast |
|---|---|---|---|---|
| `RuntimeRule` (runtime-shapes.ts:58) | `{type: string}` — a rule object from *either* runtime, vocabulary unknown | "runtime" reads as "at runtime" generally, not "one of the two DSL runtimes"; the name doesn't say *dual/unknown*, which is its whole point | `DualRuntimeRule` or `AnyRuleShape`; low priority (the doc comment carries it) | 313 occ — expensive, defer |
| `IsRuntimeRule<T>` (runtime-shapes.ts:159) | true ⇒ *lowercase sittir* shape | inverted: "is runtime rule = true" sounds like the tree-sitter-CLI case; it's the opposite | `IsSittirShape<T>` | ~8 occ; do inside §4 PR-1 |
| `EnumRule` (rule.ts:356) | alias of `ChoiceRule` since PR-P; `ENUM` discriminant retired | implies a distinct union member that no longer exists; invites `rule.type === ENUM` regressions | delete the alias; use `ChoiceRule` + `isEnumChoiceRule` | 47 occ / 9 files |
| Stale file-path headers | `types/rule.ts` header says "compiler/rule.ts" (:21); `types/rule-types.ts` says "compiler/rule-types.ts" (:2); `types/runtime-shapes.ts` says "dsl/runtime-shapes.ts" (:2); `dsl/rule-attrs.ts` says "compiler/rule-attrs.ts" (:2) | R11 moved the files, headers weren't updated — every header asserts a wrong layer, actively corrupting the layering story this report leans on | fix the 4 headers | trivial |
| The `source`/provenance homonyms | five overlapping-but-different vocabularies: `RuleSource` `'grammar'\|'promoted'\|'override'` (rule.ts:346); `FieldRule.source` `'grammar'\|'override'\|'enriched'\|'inferred'` (rule.ts:306); `SymbolRule.source` `'grammar'\|'link'\|'group-lift'` (rule.ts:456); `metadata.source` `RuleSource \| 'enrich' \| 'group-lift'` (rule.ts:131); `RuleProvenance` `'grammar-authored'\|…` (compiler/types.ts:36) | one word (`source`) keys five different fact-sets; a reader cannot know which vocabulary a given `.source` speaks without chasing its type | per-fact names (`fieldNameSource`, `refSource`, …) or one unified provenance enum — a design-discussion item (ties to `feedback_synthesis_and_fact_taxonomy`'s 3-outlet taxonomy) | wide; scope at the discussion |
| `Multiplicity` vs `SlotCardinality` | the same axis (count + optionality), two stems: `multiplicity` on rules and slots (deliberately aligned, rule.ts:47–49) vs `SlotCardinality`/`deriveSlotCardinality` (node-map.ts:424) | violates the one-concept-one-word rule the multiplicity alignment itself established (`feedback_rule_slot_vocabulary_alignment`) | pick `multiplicity` (the already-aligned stem); rename the cardinality family | ~dozen sites |
| `sym` ×2, `Sym` ×1 | `sym()` (rule.ts:626) builds a lowercase IR symbol; global `sym<N>()` (authoring-globals.d.ts:68) builds an UPPERCASE authoring symbol; `Sym<N>` = tree-sitter's `SymbolRule<N>` | the same three-letter name constructs *different vocabularies* depending on file scope | acceptable under (iii) *if* §5.3's suffix rules land (scope disambiguates); else rename the IR one to `symbolRef()` | rule.ts `sym`: ~15 occ |

The naming convergence rides the same migration (§4): §5.4's `IsRuntimeRule` fix joins
PR-1; the §5.3 suffix unification + `GrammarNode` rename is one additional grammar-shapes-
scoped PR (gated on the overrides type-tests, since it touches the crown-jewel files —
pure renames, but that gate is non-negotiable there); the §5.2 normalize rename set is its
own mechanical PR; `EnumRule` deletion joins the rule-types codemod track.

## DECISIONS (user, 2026-07-02 — supersede parts of §3's recommendation)

1. **Provenance's one home is `metadata`.** All provenance-ish top-level fields on rule
   types (`FieldRule.source`/`nameFrom`-was, `SymbolRule.source`, …) consolidate into the
   `RuleBase.metadata` bag — which is contractually diagnostics-only. Behavior-driving
   readers get structural derivations FIRST (see the debt report §3.1 revised verdict:
   the generated `desc.source === "override"` branch is the priority violation), then the
   top-level fields retreat into metadata or delete. This also collapses most of §5.4's
   five-way `source` homonym.
2. **Kill the case split: UPPERCASE discriminants everywhere.** Rather than maintaining a
   dual-case boundary forever (option iii's conversion module), sittir's IR adopts
   tree-sitter's UPPERCASE discriminants. Feasibility (probed 2026-07-02): no lowercase
   rule-type strings escape into emitted artifacts; the `@rule-type-consts` convention
   means the flip is const-VALUES + ~91 raw literal sites + test fixtures; the dual-case
   predicate/normalization machinery (runtime-shapes pairs, word-matcher case handling)
   dissolves. The boundary module's remaining job = SHAPE conversion only (tuples,
   member types), and §5.3's suffix conventions (Rule=IR / Node=grammar.json) still land.
   Mechanical sweeps run via lspeasy (LSP-driven rename/replace) — previously avoided;
   the accumulated debt now justifies it.

3. **Metadata is type-level OPAQUE to the compiler; sanctioned readers are ONLY enrich
   and wire** (sharpened by the user, 2026-07-02 — including wire's transform machinery,
   e.g. transform-path's `source === 'enrich'` descent keying). `RuleBase.metadata`
   becomes an opaque branded type (`RuleMetadata`); shape + accessors live in a
   dsl-owned module importable only by enrich/wire (+ diagnostics emission); any other
   import is a lint violation (same ast-grep gate family). The compiler carries/copies
   the bag blindly. This condemns, beyond the already-queued templates.ts `inlinedFrom`
   branch: (a) link.ts:484's classification chain — the metadata.source fallback feeds
   the promoted-rules MUTATION decision; fix by having the classifier RETURN its
   classification alongside the rule instead of stamping-then-re-reading; (b)
   collect-slots' slot-`source` derivation — becomes a blind bag carry (node-model
   serialization keeps working) or moves out of the compiler. COROLLARY (user,
   2026-07-02): the compiler must not infer provenance STRUCTURALLY either —
   replacing a `source` tag with a shape test that reconstructs "who authored this"
   is the same violation laundered through structure. Compiler behavior keys on
   facts named for what they MEAN (semantic/structural facts, or explicitly
   DECLARED flags set at authoring time); stamp-then-reread patterns become
   pass-internal dataflow (return values). The dsl-side
   `isEnrichShapedFieldWrapper` is exempt twice over: it lives in wire's transform
   machinery (sanctioned), and decision (a) redefined its semantic to "wrapper of
   the transparent shape, any author" — a meaning, not an authorship inference.
   Folds into PR-P1 (provenance → metadata) as its type-design core.

4. **Kind-minting is derived structurally, not from enrich tags** (user, 2026-07-02).
   The residual `metadata.source === 'enrich'` reads in link/evaluate (the content-alias
   mint gate, `isEnrichContentAlias`) must NOT become a declared protocol flag — the
   compiler mints kinds from the SAME facts tree-sitter has structurally: e.g. (1) the
   named alias's target name does not appear elsewhere in the grammar as a rule
   definition, (2) the alias is used exactly once, etc. Rationale: tree-sitter's own
   node-emission behavior is a function of grammar structure, so deriving from identical
   facts guarantees parser/IR agreement by construction (same argument as the Camp A
   word-matcher unification). The enrich tag was a proxy for "referenced rule body does
   not exist yet" — replace the proxy with the fact. Scope: all 3 remaining
   `metadata.source === 'enrich'` reads left by PR-P1's scoping note; each gets a
   diagnosed structural condition, byte-neutral gated.

5. **"Node" is banned from grammar-description vocabulary; the canonical form is
   `<X>Rule`** (user, 2026-07-03 — SUPERSEDES §5.1's `GrammarJsonNode` proposal and
   §5.3's `<X>Node` standardization, both of which pointed the other way). "Node" is
   reserved for parse-tree/CST entities (`AssembledNode`, `TreeNode`, `NodeKind`,
   `NodeMap`, node-model) — a grammar body expression is a RULE, whatever vocabulary
   it belongs to. Scope: FULL trio collapse (user-confirmed 2026-07-03) — the
   authoring shape definitions themselves rename (`Seq`→`SeqRule`, `Choice`→
   `ChoiceRule`, `Str`→`StrRule`, `Sym`→`SymRule`, …) along with the derived family
   (`GrammarNode`→`GrammarRule`, `ContainerNode`→`ContainerRule`, `NodeAtPath`→
   `RuleAtPath`, `PrecNodeUnion`→`PrecRuleUnion`, `AuthoringRuleToNode`→
   `ToGrammarRule`); the `SeqNode`/`ChoiceNode` import-alias respellings are deleted.
   Same-name pairs with the IR (`SeqRule<Phase>` in types/rule.ts vs authoring
   `SeqRule` in grammar-shapes) are disambiguated by MODULE SCOPE — the vocabulary
   boundary is the module, matching the ambient tree-sitter `<X>Rule` family this
   vocabulary refines; the rare file importing both uses an import alias. The
   companion lintable guideline stands: overrides-scoped files never import IR types.

## 6. Open questions for the design discussion

1. **Is "one boundary module" an acceptable answer to "there should be a SSOT"?** §0 argues
   one physical type is unattainable (two runtimes, two owners, non-isomorphic unions). If
   the user disagrees, the counter-position to examine is Option (i)-codegen with an
   explicit divergence table — cost lands on grammar-shapes maintenance.
2. **EnrichRule\<\>'s future:** extend to typescript/python (each adds a ~10k-line generated
   shape file + a per-grammar supertype hardcode like `RustSupertypes`), keep rust-only, or
   retreat to `FastKeys` (path-type.ts:189 — top-level counts are enrich-invariant, so
   segment-1 autocomplete survives without instantiating the twin)? This decides how much
   type-twin surface the SSOT story must carry long-term.
3. **Should the boundary module own structural normalization** (optional/CHOICE-BLANK,
   prec-peel) as *data views*, or only predicates? RuleWalker just centralized the
   child-edge relation compiler-side; a dsl-side `childrenOf` for RuntimeRule would be its
   dual — or a scope creep. (`isPrecWrapper` + transform-path's peel already gesture there.)
4. **Naming collision hygiene:** three "symbol" spellings coexist (`sym()` in rule.ts:626,
   tree-sitter's ambient `SymbolRule<N>`, R4's `Sym<N>` alias). Worth a rename pass, or
   accepted as vocabulary-per-side under (iii)?
5. **rule-types.ts codemod timing** relative to the boundary PRs — before (fewer spellings
   to sweep) or after (don't stack two mass-edits)?
6. **Grammar containers:** should `RawGrammar/LinkedGrammar/OptimizedGrammar` follow the
   `Rule<Phase>` pattern (one `Grammar<Phase>` parameterized container) as a later R-phase,
   or is the interface trio fine? (Their field overlap — name/rules/supertypes/word/
   derivations/polymorphVariants/refineForms — is large and hand-synchronized today.) If
   yes, the §5.2 normalize rename should land first so the parameterized container is born
   with the right phase names.
7. **Provenance vocabulary (§5.4):** unify the five `source` fact-sets into one taxonomy
   (per `feedback_synthesis_and_fact_taxonomy`) or keep per-fact vocabularies with
   distinguishing field names? This is a semantics question, not a rename — the value sets
   genuinely differ.
