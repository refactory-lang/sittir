# Variant/Form Surface — Structural Derivation Research (decision 7)

**Status:** research (2026-07-04), feeds the decision-7 end-state of
[2026-07-02-rule-type-model-ssot-research.md](2026-07-02-rule-type-model-ssot-research.md)
(§DECISIONS 7 + REFINEMENT + coordinator NOTE).
**Tree:** `polymorph-vestige-cleanup` @ `4649c01e` (decision-7a cleanups already landed:
dead `emitPolymorph` arms deleted, `source`→`definedBy` rename done).
**Baselines this research treats as inviolable:** grammar.json byte-identity
(git-tracked at `packages/<lang>/.sittir/src/grammar.json`) and deep AstMatchPass
**rust 117 / typescript 75 / python 102** (CONFIRMED from
`packages/tools/validation-history.jsonl`, entries of 2026-07-04T17:06Z).

Labels: **CONFIRMED** = read from code/data on this tree; **HYPOTHESIS** = inferred,
needs a probe before an implementation PR relies on it.

---

## 0. Verdict summary

1. **The placeholder never reaches tree-sitter's grammar tree today.** `variant()`
   placeholders are fully resolved *inside* the bundle, at rule-fn execution time,
   into plain `ALIAS`/`SYMBOL`/hidden-rule constructs before `grammar()` consumes
   them. What "ships grammar-side" is the **resolver machinery** (transform/wire/
   enrich, ~2.5k lines bundled into `.sittir/grammar.js`), not unresolved markers.
   Decision 7's "must not ship" therefore means: retire the bundled machinery
   (pre-resolution), not fix a marker leak. (CONFIRMED, §1.6/§5.)
2. **variant()'s classification role is already ~dead.** Link's
   `applyOverridePolymorphs` was DE-POLYMORPHed on 2026-06-01 — it no longer builds
   `PolymorphRule`; `modelType:'polymorph'` is never produced (#59 A1). The wire
   `{parent,child}` pairs survive only as (a) the `variantChildKinds` feed for
   `node-model.polymorphVariants`, (b) a diagnostics skip-set, (c) userFacing
   marking, (d) a scaffold-push-down trigger. All four are structurally derivable
   from the alias-choice shape wire already injects. (CONFIRMED, §1.4–§1.5.)
3. **The form-surface *names* already fall out structurally.** `factory-map.ts`
   derives each descriptor's suffix by stripping the `${kind}_` prefix from the
   child kind name — the childKind map carries zero information beyond the kind
   names themselves. Only *which kinds get an entry* still comes from wire
   metadata. (CONFIRMED, §2.2.)
4. **The structural predicate reproduces 32/39 current surfaces exactly**, 4
   partially (multi-level adoption), 3 only if hidden-kind arms are admitted; the
   unrestricted "any choice of named kinds" reading would ADD ~137 new surfaces
   across the three grammars — the scoping of that widening is the main open
   design fork. (CONFIRMED probe + HYPOTHESIS on exact assemble-time behavior, §2.)
5. **The old "400+ phantom variant() wrappers" claim is historical.** The
   `tagVariants` pass that synthesized them is REMOVED (`link.ts:930`); the only
   live IR `{type:'variant'}` producer is evaluate's
   `collapseAllFieldChoiceMembers`. (CONFIRMED, §3.3.)

---

## 1. Current-machinery map (end-to-end)

### 1.1 Authoring surfaces (two, funneling into one mechanism) — CONFIRMED

| Surface | Where | Count on this tree |
|---|---|---|
| `variant('x')` patch values inside `transforms:` | `packages/rust/overrides.ts` (20 calls, 8 parents: pointer_type ×2, expression_statement ×2, foreign_mod_item ×2, match_arm ×2, line_comment ×3, delim_token_tree ×3, token_tree ×3, token_tree_pattern ×3); `packages/typescript/overrides.ts` (14 calls, 5 parents: ambient_declaration ×3, parenthesized_expression ×2, export_statement ×4, call_expression ×3, update_expression ×2); python 0 | 34 real calls |
| `polymorphs:` declarative config `{ '<path>': '<suffix>' }` | rust: 11 parents / 28 arms (overrides.ts:106); typescript: 13 parents incl. the hidden `_export_statement_default*` cascade (overrides.ts:203); python: 6 parents (overrides.ts:71) | ~66 arm entries |

The spec's "43 authored variant() calls (rust 20 / ts 23)" is `rg -c 'variant\('`
**line counts** — ts's 23 includes 9 comment lines; real ts calls are 14
(matching ts's 14 `polymorphVariants` entries exactly). Both surfaces execute the
same machinery: `wire.ts::buildPolymorphParentFn` (wire.ts:763) converts each
`polymorphs:` arm into a `variantPlaceholder(suffix)` patch and calls
`transform()` — a `polymorphs:` entry IS a `variant()` call.

### 1.2 DSL placeholder → transform resolution — CONFIRMED

- `dsl/primitives/variant.ts:26` — `variant(name)` → `{__sittirPlaceholder:'variant', name}`;
  guard `isVariantPlaceholder` (:22). Sibling placeholders: `alias()` one-arg
  (primitives/alias.ts:27), `field()` one-arg (primitives/field.ts:173).
- `dsl/transform/transform.ts:100` `transform()` → `applyPathPatches` →
  `partitionPatchesByVariant` (:170) → `applyVariantPatches` (:195, deepest-first
  path sort) → two paths:
  - **Hoist path** `tryHoistSiblingVariants` (:240) + `buildHoistedVariants`
    (:374): when any targeted arm matches empty, ALL sibling arms hoist the
    parent seq's scaffolding into their bodies; emits
    `{type:'ALIAS', content: SYMBOL(_hidden), named:true, value: visible}`
    (:423–428), registers the hidden body via `wireRegisterSyntheticRule`, the
    pair via `wireRegisterPolymorphVariant`, and **GLR conflicts** via
    `registerHoistedVariantConflicts` (:453 — cross-variant group + per-variant
    self-conflicts; parser-affecting).
  - **Per-patch path** `resolvePatch` (:660): gate
    `variantBranchIsUnmaterializable` (:505 — transparent unit-production arms
    are left bare, NO kind minted, NO pair registered); else
    `registerAliasedVariant` (:1017 — shared with alias(); empty-match factoring
    wraps the call site in `optional(alias(...))`).
- Naming: `wire.ts::polymorphVisibleName` (:829) = `<parent minus leading _>_<suffix>`;
  `polymorphHiddenName` (:835) = `_<visible>`. Used identically by wire's
  placeholder injection and both transform paths.

### 1.3 Wire context + both runtimes — CONFIRMED

- `wire.ts:85` `WireContext` — `polymorphVariants: PolymorphVariant[]` (:93, doc:
  "Sittir's Link reads these to classify polymorphs — **tree-sitter ignores
  them**"), `deposits`, `conflictGroups`, `currentRuleKind`.
- `wireRegisterPolymorphVariant` (:190, idempotent), `injectHiddenRulePlaceholders`
  (:801 — declares each `_<parent>_<suffix>` as a real rule fn via
  `makeDeferredContentFn`, so **every minted kind is a declared grammar rule with
  a real kindId** — the every-kind-has-a-kindId invariant holds by construction),
  `wire()` body (:585–718) attaches `__wireContext__` non-enumerably (:712).
- **Both runtimes execute this identically.** Sittir runtime: `evaluate.ts` injects
  DSL globals, runs `wire()` + rule fns, then `drainPolymorphMetadata`
  (evaluate.ts:1531) reads `__wireContext__.polymorphVariants` →
  `RawGrammar.polymorphVariants` (compiler/types.ts:187). Tree-sitter CLI runtime:
  `.sittir/grammar.js` (esbuild bundle produced by
  `transpile/transpile-overrides.ts:57–181`, `tree-sitter-<lang>` externalized)
  executes the same wire/transform/enrich code; the registered pairs are simply
  discarded (nothing reads `__wireContext__` there). The 6 `__sittirPlaceholder`
  occurrences in each bundle are the 3 producer + 3 guard definitions — no
  placeholder *instance* survives into the grammar object `grammar()` receives.

### 1.4 Link — the classification that no longer classifies — CONFIRMED

- `link.ts:294–295` → `applyOverridePolymorphs(rules, raw.polymorphVariants, …)`
  (:1101). **DE-POLYMORPH comment at :1143–1156**: when the variant-child aliases
  are already present in the found choice (the normal case), the pass STOPS —
  the parent stays a plain seq/choice and "flows through as a plain BRANCH …
  no forms / no $variant dispatch". Its two residual jobs:
  1. `emitVariantChildDerivations` (:1175) — derivation-log entries per child
     (feeds suggested.ts visibility).
  2. `pushAmbientScaffoldIntoVariantChildren` (:1211) — when the aliases are NOT
     visible in the choice, push flanking literals into each child's body. Its
     matcher `isAllAliasChoice` (:1284) is **already purely structural** (choice
     whose every arm is an alias/symbol targeting `<parent>_<child>` names).
- `promotePolymorph` is a dead comment header (:1077); `modelType:'polymorph'`
  is never produced (factory-map.ts:129: "excised in #59 A1").
- Separate vocabulary collision, for clarity: IR `{type:'variant'}` **wrapper
  nodes** are a different thing from `variant()` — see §3.3.

### 1.5 Normalize → Assemble → emitters → validator — CONFIRMED

- `normalize.ts:418–426` — pairs only build `variantSkip`, a **diagnostics**
  skip-set for the slot-grouping propose-diagnostic (false-positive suppression).
- `assemble.ts:158–164` — `variantParents` (suppresses any polymorph
  auto-promotion in `classifyNode`, :198) and `variantChildrenByParent` →
  `AssembledBranch.variantChildKinds` (model/node-map.ts:2430, :2480).
  `assemble.ts:302–307` — `variantChildKindsSet` feeds `markUserFacing` (:890) so
  hidden-named variant children still emit templates/factories.
- `emitters/factory-map.ts:103–123` — `buildFactoryMap`: for every
  `modelType==='branch'` node with `variantChildKinds.length>0`, emit
  `polymorphVariants[kind] = { definedBy:'override', childKind }` where each
  suffix is **derived by stripping the `${kind}_` prefix** (:117).
  `emitters/node-model.ts` serializes this into `packages/<lang>/src/node-model.json5`
  (rust 19 / ts 14 / py 6 entries; all `definedBy:'override'`; the `'promoted'`
  union arm of `PolymorphVariantDescriptor` (polymorph-variant.ts:18–41) is
  schema-only, zero instances).
- **Validator inference:** `packages/tools/src/validate/common.ts::nodeToConfig` →
  `inferPolymorphVariant` switches on `definedBy`; `'override'` → look up the
  first named child's kind in `childKind` → variant tag.
  `read-render-parse.ts` (~:140–160) builds its variant-adopted kind set from
  the same descriptors.
- **`$variant` stamping:** `emitters/factories.ts:806` and `:898` stamp
  `$variant: '<form.name>' as const` on **form factories** (modelType `'group'`
  nodes with `parentKind` set — produced by the `refine()` forms path and
  variant-child groups); `resolvePolymorphFormVariantName` (:1123). Plain
  branches never stamp `$variant`.
- **`refine()` forms** are the adjacent form mechanism (wire.ts:104
  `refineForms`; primitives/refine.ts registers; emitters emit per-form
  namespace factories) — rule tree untouched, tree-sitter unaffected. Decision 7
  keeps it; it is already placeholder-free and grammar-invisible.

### 1.6 Which steps run inside the transpiled bundle — CONFIRMED

Executed at tree-sitter-CLI time and **parser-affecting**: enrich passes
(`applySymbolToField`, `applyOptionalKeyword` → `_kw_*` synthesis), wire's hidden-
rule injection + deferred-content fns + wrapped `conflicts:`/`inline:` +
`applyWirePatternReplacement` + enrich clause-group inlining, transform patches
including both variant paths (hoist conflicts included), native `prec*` calls.
Executed but **discarded at CLI time** (sittir-metadata only): pair registration,
`refineForms`, `renderAs` (stripped before tree-sitter; link's
`stampStaticRenderAs` consumes it sittir-side), `role()` (accumulator never read
under CLI). See §5 for the retirement analysis.

---

## 2. The structural predicate

### 2.1 Proposed predicate — assemble-time

> A kind `K` (modelType branch or group) acquires a **form surface** for each
> choice node `C` in its post-link body whose every arm resolves to a **named
> kind ref** — a symbol/alias whose target owns a real kindId and materializes a
> CST node (concrete branch/group kinds, or leaf token/keyword kinds; supertype
> refs excluded). One form per arm, **named by the arm's kind**: strip a
> `${K}_` prefix when present, else the arm kind's `irKey`
> (`tokenToName` for operator tokens — the `binaryExpression.plus` case).

Two tiers, matching the refinement's wording:

- **Tier A** — arms are named node kinds ("choice of named kinds — branch/group
  kinds"). This is where all 39 current surfaces live.
- **Tier B** — arms are leaf tokens under a branch ("a leaf nested under a
  branch node", e.g. `binary_expression.operator`). Gated on the universal
  per-slot-enum work (`project_universal_per_slot_enums`): once every terminal
  choice arm is an enum-member kind, tier B is tier A by extension.

Two structural sub-facts the runtime already computes and the predicate should
absorb (rather than re-decide): *materializability* (transform.ts:505 — a
transparent unit-production arm mints no kind; tree-sitter would never surface
it) and *empty-match factoring* (transform.ts:1017). Both are facts about what
tree-sitter's CST can contain — exactly the "same facts tree-sitter has"
doctrine of decision 4.

### 2.2 Probe against current surfaces — CONFIRMED (probe), approximation caveats flagged

Probe: over `node-model.json5` slots (a slot with ≥2 values, all node-refs with
**visible `parseKind`**, approximates "choice of named kinds"; `parseKind`, not
the storage `name`, because variant-child refs store the hidden name with the
visible parseKind — e.g. `array_expression.content` =
`[_array_expression_semi→array_expression_semi, _array_expression_list→array_expression_list]`).

| Grammar | pv entries | fully reproduced | partial | missed (hidden arms) | NEW kinds matched (no pv today) |
|---|---|---|---|---|---|
| rust | 19 | 16 | 3 (`function_type`, `range_pattern`, `visibility_modifier`) | 0 | 36 (9 hidden) |
| typescript | 14 | 11 | 1 (`public_field_definition`) | 2 (`_export_statement_default`, `_export_statement_default_from_arm`) | 68 (17 hidden) |
| python | 6 | 5 | 0 | 1 (`_match_block`) | 33 (3 hidden) |

- **Reproduced (32/39):** the wire-injected alias-choice IS the structural
  signal; the childKind suffixes regenerate identically (factory-map already
  derives them that way).
- **Partial (4):** multi-level/nested adoption — children registered at several
  path depths don't all surface as one slot's arms (e.g. `visibility_modifier`'s
  `in_path` lives inside the `pub` arm's body). The assemble-time predicate must
  walk the rule tree (per-choice-node), not the flattened slot view; HYPOTHESIS:
  a rule-tree walk reproduces these 4 too — verify with an assemble-time probe,
  not the node-model approximation.
- **Missed (3):** parents/arms that are hidden kinds (`_`-prefixed cascade
  intermediates). The predicate must admit hidden named kinds as arms (they have
  kindIds and node-model entries; `markUserFacing` already promotes them), or
  these cascades flatten into the visible ancestor (§ DECISIONS-NEEDED 3).
- **Additions (~137 kinds):** the unrestricted predicate sweeps in every
  union-typed slot — e.g. rust `match_arm.attributes` =
  `choice(attribute_item, inner_attribute_item)`, ts `member_expression`,
  python `argument_list`. These are *ordinary union slots*, not today's
  form-defining content choices. Tier B adds rust 3 / ts 6 / py 3
  terminal-choice slots (`binary_expression.operator` et al.).

**Implication:** the predicate as literally worded ("any choice of named kinds")
is a **surface-widening decision**, not a refactor — ~137 new form surfaces =
new factory sub-methods + node-model entries + validator dispatch entries. The
reproduce-today's-surface predicate is the narrower: *choice whose arms are
(mostly) `${K}_`-prefix-named alias-minted kinds* — i.e. exactly the population
`isAllAliasChoice` (link.ts:1284) already matches structurally.

---

## 3. The authored variant() calls — classification

### 3.1 Per-call disposition — CONFIRMED (counts), classification per-arm

All 34 explicit `variant()` calls + all `polymorphs:` arms take one of three
runtime dispositions, and the **node-model records the outcome** (absent
children = skipped arms):

1. **Mints a genuinely anonymous arm** (survives as alias-sugar): the large
   majority (~83% per the arm-level audit). Examples with minted names falling
   out of the structural rule: `array_expression_semi`/`_list`,
   `closure_expression_block`/`_expr`, `token_tree_paren`/`_bracket`/`_brace`,
   `export_statement_default`/`_type_export`/`_equals_export`/`_namespace_export`,
   `assignment_eq`/`_type`/`_typed`. In every case the minted name =
   `polymorphVisibleName(parent, suffix)` and the reverse derivation (strip
   prefix) is what factory-map already does — **the same name falls out of the
   structural naming rule by construction.**
2. **Targets an already-named/transparent arm → silently dropped at runtime**
   (the retag-phantom class, auto-filtered): `pointer_type mut`,
   `field_pattern shorthand`, `mod_item inline`, `foreign_mod_item body`,
   `match_arm block_ending`, `expression_statement block_ending`,
   `or_pattern`'s dropped arm, `line_comment` partial, ts `import_clause
   namespace_import`/`named_imports`, `import_specifier name`,
   `index_signature mapped_type_clause`, `class_heritage implements_clause`,
   `arrow_function _call_signature`, `ambient_declaration declaration`,
   `parenthesized_expression sequence`, `call_expression member` (present),
   etc. — compare each `polymorphs:` arm list against the node-model childKind
   maps: rust alone shows 9 authored arms with no node-model child. These
   authored entries are **already phantom** (the unmaterializable-arm gate at
   transform.ts:505 refuses them); under structural derivation they can be
   DELETED from overrides.ts with zero surface change. (CONFIRMED by
   childKind-map diffing; per-arm re-verification belongs in the cleanup PR.)
3. **Hidden-cascade intermediates** (ts `_export_statement_default*`,
   py `_match_block`): mint hidden kinds that parent further adoption — the
   predicate-scope question of §2.2.

### 3.2 What information content would be LOST without variant()?

Only the **suffix names themselves** where they differ from what any automatic
namer would pick (e.g. `with_semi`, `trait_form`, `left_with_right` — authored,
meaningful) and the **grouping/paths** (which arms to split). That is exactly
"syntactic sugar to give grammar kinds to nested anonymous choice arms" — the
authored call keeps choosing the *name*; everything downstream derives from the
resulting named kind. Nothing else authored survives: pairs, classification,
$variant, validator dispatch are all reconstructible from the kind structure.

### 3.3 The "400+ phantom variant() wrappers" claim — CONFIRMED historical

`specs/013-canonical-surface/tagvariants-removal-plan.md` inventories rust 48
kinds/142 wrappers, ts 59/202, py 29/89 (~433 total) — these were IR
`{type:'variant'}` **wrapper nodes** synthesized by link's `tagVariants` pass,
NOT authored `variant()` calls. `tagVariants` is REMOVED (link.ts:930
"tagVariants / isStructurallyHomogeneousChoice removed."); `wrapVariants`
(link.ts:966) survives export-only (tests + normalize re-export, no production
caller). The one live producer of IR variant wrappers is
`evaluate.ts::collapseAllFieldChoiceMembers` (:179–206, heterogeneous-field
choices → variant-retyped members), which downstream treats as transparent
(collect-slots recurses through them). A subagent audit initially reported the
phantom pass as "currently active" — that is WRONG on this tree; corrected here.

---

## 4. variant()-as-alias-sugar design

### 4.1 What variant() is, minus classification — CONFIRMED

`variant('x')` ≡ one-arg `alias('parent_x')` (`resolveAliasPlaceholder`,
transform.ts:928 — both call `registerAliasedVariant`) **plus** four extras:

| Extra | Parser-affecting? | Fate under decision 7 |
|---|---|---|
| Auto-prefix naming (`polymorphVisibleName`) | no | KEEP — this is the sugar |
| `wireRegisterPolymorphVariant` pair | no (metadata) | DELETE (structural derivation replaces) |
| Sibling-hoist restructuring (`tryHoistSiblingVariants`) | **YES** (moves scaffolding, changes rule bodies) | KEEP — grammar semantics |
| GLR conflict registration (`registerHoistedVariantConflicts`) | **YES** (conflicts array) | KEEP — grammar semantics |

So variant() does NOT collapse into alias(): hoist + conflicts are real grammar
behavior alias() deliberately lacks. It *reframes* as "alias-mint sugar with
polymorph-split ergonomics"; the classification channel is what dies.

### 4.2 Should resolution move to evaluate (kindId minting, no wire placeholder)?

**No earlier than rule-fn execution is possible, and nothing earlier is
needed.** The patches address positions in the *base rule body*, which only
exists when tree-sitter's `grammar()` protocol hands the rule fn its
`previous`/`original` — resolution is therefore intrinsically
rule-fn-execution-time in whichever runtime executes the DSL. The invariant the
task worries about already holds: hidden bodies become real declared rules
(deposits + `injectHiddenRulePlaceholders`) *before* tree-sitter iterates, so
every minted kind gets a kindId through the normal
`base.grammar.rules`-injection route (`project_every_kind_has_kindid_invariant`).
What CAN move is **which artifact tree-sitter consumes** (§5): if tree-sitter is
fed post-resolution output, the resolver stops shipping.

Breakage audit for any resolution-mechanics change:

- **Positional path keys ('1/0'):** anchored to the base grammar shape at
  rule-fn time; also depend on `applyVariantPatches`' deepest-first ordering
  (transform.ts:207) and on prec-transparency in `applyPath`. Any re-plumbing
  must preserve both or paths silently miss (SITTIR_DEBUG bail logging exists,
  transform.ts:296).
- **`<parent>_<suffix>` naming:** needs `currentRuleKind` (wire wrapper) — fine
  wherever wire still wraps rule fns; breaks only if resolution moves outside a
  wire context.
- **Conflicts/prec:** hoisted bodies re-wrap the parent's prec stack
  (`wrapVariantBodyInParentPrec`, transform.ts:640) and register conflicts whose
  ORDER reaches grammar.json's `conflicts` array — byte-gate sensitive.

### 4.3 Prior art — CONFIRMED

- **`mintContentAliasKinds` + `isClauseHoistVisibleGroupAlias`** (link.ts:690–780)
  is the template: a former `metadata.source === 'enrich'` read replaced by a
  4-condition structural gate ("alias value has no independent rule body",
  "content is a hidden symbol ref", …), explicitly verified population-identical
  across all 3 grammars (doctrine decision 4). Deriving `variantChildKinds`
  structurally is the SAME move: `isAllAliasChoice` (link.ts:1284) already
  matches the wire-injected alias-choice with no metadata. Note its condition
  (d) *excludes* inlined polymorph-hoist byproducts — the two mint populations
  are disjoint by construction, so a structural variant gate won't double-mint.
- **renderAs** is NOT parallel prior art for naming (it substitutes sittir-side
  bodies for external-scanner symbols and is stripped pre-tree-sitter) — it is
  prior art for the *dual-artifact* idea: sittir-only facts that never reach the
  parser can live outside the grammar artifact entirely.
- **refine()** is prior art for a form surface with zero grammar footprint —
  the end-state's form surface should converge on refine's emission path
  (per-form factories + `$variant` stamp) regardless of whether the form came
  from refine selections or a structural choice-of-named-kinds.

---

## 5. Bundle CLI-time inventory + pre-resolution feasibility

### 5.1 What the bundle does today — CONFIRMED (subagent-verified)

Bundle = esbuild of `overrides.ts` + dsl layer (`transpile/transpile-overrides.ts:130–159`,
`tree-sitter-<lang>` externalized, CJS default-flatten footer).
`run-codegen.ts::runTreeSitterGenerate` (:115–122) runs bare `npx tree-sitter
generate` in `.sittir/` → grammar.json → parser.c/wasm.

Parser-affecting at CLI time (must be reproduced by any pre-resolution):
enrich `_kw_*` synthesis + symbol→field promotion; enrich clause-group hoisting +
inline registration; wire hidden-rule injection, deferred deposits, wrapped
`conflicts:`/`inline:` callbacks, `applyWirePatternReplacement` (×2 passes);
transform patches incl. variant hoist + GLR conflicts; native prec wrappers.

CLI-time no-ops (metadata discarded): pair registration, refineForms, renderAs,
role(). variant()'s *classification* half is already CLI-inert; its *structural*
half (alias mint, hoist, conflicts) is not.

### 5.2 If variant() leaves the wire path, what remains? — CONFIRMED

Everything in the parser-affecting list except the variant-specific transform
paths. I.e. removing variant() classification shrinks the bundle by ~0 —
enrich/wire/transform must still execute somewhere to produce the grammar.
**Conclusion: decision 7's placeholder-protocol goal is achieved not by
shrinking the bundle but by changing the handoff artifact.**

### 5.3 Pre-resolution options — HYPOTHESIS (research-first, as the coordinator NOTE says)

- **(P1) Feed tree-sitter `grammar.json` instead of `grammar.js`.** The
  post-wire resolved form ALREADY exists as a committed byte-gated artifact:
  `.sittir/src/grammar.json` is exactly "post-wire resolved rules" in
  tree-sitter's own vocabulary. Modern tree-sitter CLI accepts a grammar.json
  path for `generate` (skips JS execution) — VERIFY on the pinned CLI version as
  stage 0. Under P1 the bundle demotes from *shipped grammar* to *internal
  codegen tool* (still executed by sittir's regen to produce grammar.json when
  overrides change — but under whose runtime? see risk below); the artifact
  tree-sitter consumes contains only plain constructs, dissolving the
  protocol-shipping concern by construction.
  **Risk:** today grammar.json is produced by tree-sitter executing the bundle
  under ITS runtime (uppercase natives, optional→CHOICE/BLANK, prec preserved).
  Sittir's lowercase pipeline CANNOT emit grammar.json (§0 of the SSOT research:
  non-isomorphic unions, prec stripped at evaluate). So P1 keeps a one-shot
  "execute bundle under tree-sitter-shaped runtime, capture grammar.json" step —
  either tree-sitter itself (as today; simplest, byte-safe) or a sittir-hosted
  uppercase evaluation (new machinery, byte-risk). **Recommend: keep tree-sitter
  as the executor; P1 then changes only what is SHIPPED/consumed downstream,
  which may make it a packaging no-op unless something other than tree-sitter
  consumes grammar.js today (nothing found — CONFIRMED: only `tree-sitter
  generate` and the wasm build read it).**
- **(P2) Emit a resolved plain grammar.js** (print grammar.json back as vanilla
  DSL calls). Mechanical printer, but adds a THIRD grammar representation and a
  fidelity obligation (prec/externals/word/supertypes round-trip) for zero
  functional gain over P1. **Reject unless P1's grammar.json input path proves
  unsupported.**
- **(P3) Status quo bundle + structural variant derivation.** The placeholder
  protocol keeps *executing* CLI-side but carries nothing variant-specific once
  the pairs are unread; decision 7's letter ("the protocol has nothing to carry
  and dissolves by construction") is satisfiable by P3 + deleting
  `wireRegisterPolymorphVariant`; the `variant()` placeholder itself remains as
  the sugar's transport between patch-map and transform. Lowest risk; does not
  retire the dual-runtime boundary.

---

## 6. Parser-identity risk + verification harness

### 6.1 Byte gates that exist — CONFIRMED

- `packages/<lang>/.sittir/src/grammar.json` and `parser.c` are **git-tracked**;
  `git diff --exit-code packages/*/.sittir/src/grammar.json` after regen is the
  byte gate (tree-sitter's emit is deterministic; key order stable run-to-run).
- `packages/<lang>/.sittir/generated.manifest.json` (committed, PR f519fe32)
  carries sha256 of grammar.js / grammar.json / parser.wasm — cross-commit drift
  detection.
- AstMatch baselines: `pnpm validate:native` → `validation-history.jsonl`
  `readRenderParseAstMatchPass` = 117/75/102 (quote DEEP, not shallow —
  `project_manifest_committed`).
- No dedicated base-vs-override grammar.json differ exists; the CLAUDE.md corpus
  comparison numbers come from corpus validation
  (`packages/tools/src/__tests__/corpus-validation.test.ts`), a behavioral gate.
- Known flake: python `.sittir/grammar.js` nondeterministic ~15-line reorder per
  validate run (`project_grammar_js_nondeterministic_reorder`) — gate on
  grammar.JSON, not grammar.JS, and restore grammar.js before committing.

### 6.2 Risk ranking per migration step

| Step | grammar.json risk | Why |
|---|---|---|
| Structural `variantChildKinds` derivation at assemble | **zero** | post-parser; regen must show empty git diff on `.sittir/**` + byte-identical node-model |
| Deleting `wireRegisterPolymorphVariant` + pair plumbing | **near-zero** | metadata-only; BUT it lives inside `buildHoistedVariants`/`resolvePatch` next to deposit/conflict calls — surgical removal, gate anyway |
| Deleting phantom authored arms from overrides.ts (§3.1 class 2) | **low but real** | the arms were runtime-dropped, so the grammar never saw them — verify per-arm: some `polymorphs:` entries still trigger the HOIST of siblings even when one arm is later dropped (HYPOTHESIS — check `anyEmpty` interplay before deleting any arm) |
| Reordering/refactoring hoist or conflict registration | **HIGH** | conflicts array order + hoisted body shape are grammar.json bytes |
| P1/P2 pre-resolution | **HIGH** until proven | byte-compare grammar.json produced both ways before switching |

---

## 7. Staged plan (smallest-first, each gated)

Gate for every stage: regen all 3 → `git diff --exit-code
packages/*/.sittir/src/grammar.json packages/*/.sittir/src/parser.c` +
`pnpm validate:native` AstMatch 117/75/102 exact + node-model.json5 diff empty
(V1–V2) or reviewed-additive (V3+).

- **V0 (mechanical, sonnet):** assemble-time probe tool (`tool` subcommand or
  test) that computes the structural variantChildKinds set from the rule tree
  (via `isAllAliasChoice`-style matching over post-link rules) and asserts
  set-equality with the wire-derived set on all 3 grammars. Pure diagnostic; also
  settles the §2.2 partial/missed cases at assemble granularity. Verify
  `tree-sitter generate <grammar.json>` support on the pinned CLI (one command).
- **V1 (mechanical, sonnet):** flip `assemble.ts:158–164` to consume the
  structural derivation; keep the wire pairs feeding only V0's equality assert.
  Byte-neutral everywhere.
- **V2 (mechanical, sonnet):** delete the metadata channel:
  `wireRegisterPolymorphVariant`, `WireContext.polymorphVariants`,
  `drainPolymorphMetadata`, `RawGrammar/LinkedGrammar/NormalizedGrammar.polymorphVariants`,
  normalize's `variantSkip` (re-derive from the structural set),
  `applyOverridePolymorphs`' pair-driven loop (its scaffold push-down re-keys on
  `isAllAliasChoice` directly; derivation-log entries re-key on the structural
  set). Byte-neutral.
- **V3 (mechanical, sonnet; after V2):** delete the §3.1-class-2 phantom
  authored arms from overrides.ts, one grammar per commit, with the per-arm
  hoist-interplay check from §6.2. Byte-neutral (each deletion individually
  verified).
- **V4 (design-heavy, INLINE):** predicate widening per DECISIONS 1–3 below —
  hidden-arm admission, per-slot form surfaces, tier-B terminals. Additive
  node-model/factory deltas, explicitly justified; grammar bytes still frozen.
- **V5 (design-heavy, INLINE; research-first per the coordinator NOTE):** the
  P1 artifact flip (tree-sitter consumes grammar.json; bundle becomes internal).
  Prereq: V0's CLI verification; gate: grammar.json byte-compare produced both
  ways, corpus parse comparison unchanged.
- **V6 (mechanical, sonnet):** re-document `variant()` as alias-sugar
  (skill `sittir-transforms`, glossary, overrides typedocs); optionally rename
  `wireRegisterPolymorphVariant`-adjacent vocabulary that survives
  (hoist/conflict machinery keeps "variant" as its rule-splitting term).

---

## DECISIONS-NEEDED

1. **Predicate scope for new surfaces (V4).** Literal "any choice of named
   kinds" adds ~137 form surfaces (rust 36 / ts 68 / py 33 kinds), sweeping in
   ordinary union slots. Options: (a) reproduce-only (prefix-named alias
   choices — V1's predicate, zero additions); (b) full widening; (c) widen only
   where the choice is the kind's sole/whole-body content slot (today's 39 are
   all of this shape). **Recommendation: (a) for V1–V3, then (c) as V4's first
   increment; treat (b) as a per-grammar opt-in measured by factory-surface
   growth.**
2. **Form-surface granularity.** Today's surface is per-kind (one content
   choice). The widened predicate can hit multiple choices per kind. Per-slot
   form surfaces (`kind.slot.form`) align with universal per-slot enums; per-kind
   cross-products do not scale. **Recommendation: per-(kind, slot), with the
   single-content-choice case rendering as today's flat `kind.form`.**
3. **Hidden cascades** (`_export_statement_default*`, `_match_block`): admit
   hidden named kinds as form arms (keeps today's node-model shape) or flatten
   intermediate hidden parents into the visible ancestor's surface.
   **Recommendation: admit hidden arms in V1 (byte-neutral reproduction);
   flattening is a separate ergonomics decision for V4.**
4. **Pre-resolution end-state (V5):** P1 (grammar.json as tree-sitter input,
   bundle internal-only) vs P3 (keep bundle, protocol carries nothing) vs P2
   (resolved-JS printer — recommend reject). **Recommendation: P3 is the honest
   near-term end-state of decisions 7's classification goal; adopt P1 only if
   the design discussion confirms the dual-runtime boundary itself is in scope
   (it changes packaging, not parsing).**
5. **variant() vs alias() unification:** collapse into one primitive with a
   `prefix` option, or keep both. **Recommendation: keep both — hoist + GLR
   conflict registration are variant-specific parser semantics; unify only the
   shared mint path (already shared via `registerAliasedVariant`).**
6. **Tier-B (`binaryExpression.plus`) sequencing:** block on per-slot enum
   completion or special-case operator tokens earlier. **Recommendation: block
   on per-slot enums; the example then falls out of decision 1(c)+2 with no
   token-specific machinery.**

## RESOLUTIONS (user, 2026-07-04)

All six recommendations ACCEPTED, with two clarifications:

- **Decision 1 (predicate scope), clarified:** the V4 widening (option c)
  applies only when the kind has EXACTLY ONE choice slot — assessed at
  whatever level the choice appears when traveling DOWNWARD through the rule
  tree (not top-level-body-only; a single choice nested under wrappers/seq
  positions qualifies; two-plus choice slots anywhere on the walk
  disqualifies). The qualifying choice's arms may be HIDDEN or VISIBLE
  kinds. Additionally: emit a DIAGNOSTIC when a form-surface arm kind is
  enrich-created (per the retained `author: 'enrich'` metadata, a sanctioned
  diagnostics read) — enrich-minted names (`_parent_optional1`-style) yield
  user-unfriendly form names, so the diagnostic proposes an authored rename.
- **Decision 5 (variant() role), extended then narrowed:** a candidate
  SECOND residual purpose was considered — variant() as a VISIBLE-ALIAS
  applier (making a hidden kind visible, or renaming for factory DX, e.g.
  `binaryExpression.plus` → `binaryExpression.add`). USER LEANING (accepted
  as the working position): do NOT use variant() for renaming — it has no
  parse-time benefit (even when it makes a hidden kind visible) and is
  principally factory-side DX, so if form-name ergonomics ever demand it,
  the mechanism belongs on the factory/naming side (an overrides naming
  table), not as a grammar-side authored signal. variant()'s sole surviving
  job remains kind-minting for anonymous arms.
