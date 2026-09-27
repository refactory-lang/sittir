# Unsupported shapes are diagnostics, and every hand-written rule states its cause

**Status:** approved design, 2026-09-22; amended 2026-09-26 (render bodies stay
on `renderAs:`, all five grammars, measured ceilings, upstream taken from the
base `wire()` receives); amended again 2026-09-26 (diagnostics are checks
over the evaluated rule tree and gate link, §4); implemented 2026-09-27:
ceilings typescript 6 / rust 13 / python 14 / scm 1 / regex 1, floors recorded
in each grammar's `expectDiagnostics`.

**Goal:** the compiler refuses every grammar shape it does not model, at the
site, naming the shape and the patch form that resolves it; and every
hand-authored departure from the upstream grammar (a `rules:` entry, a
`renderAs:` entry or a `patches:` entry) is justified by a diagnostic it resolves. Nothing is
"resolved by structural recursion" any more, and a departure the compiler no
longer needs is itself reported.

**Builds on:** `2026-05-28-grammar-diagnostics-preflight-design.md` (the
preflight, `canProceed`, code-based gating) and the alias-identity spec's
amendment (`alias-distributed`, `display-union-mixed`).

## Problem

Two things drift silently today.

**Shapes.** `collect-slots` meets shapes it has no model for and falls back:
`unclassifiable-shape` ("not a leaf or a choice of leaves — resolved by
structural recursion"), `union-slot-mixed-row` ("keeping status quo") and
`multi-slot-nested-seq`. All three are warnings with `canProceed: true`.
The fallback is a guess about the node's shape that the validator may or may
not catch downstream. Only three codes block (`parsekind-noninjective`,
`storagename-collision`, `nonterminal-separator-unstamped`).

**Departures.** The five grammar files (typescript, rust, python, scm,
regex) carry a hand-authored surface and nothing records why any entry
exists:

| grammar | hand-written rules | of which replace an upstream rule | new rules | `renderAs:` entries |
| --- | --- | --- | --- | --- |
| typescript | 12 | 8 | 4 | 3 |
| rust | 14 | 5 | 9 | 10 |
| python | 15 | 5 | 10 | 4 |
| scm | 1 | 0 | 1 | 0 |
| regex | 1 | 0 | 1 | 0 |

A hand-written rule is whole-rule re-authoring. Three causes recur: lexical
re-authoring where upstream's token is opaque (`string`, `template_*`,
`string_content`, `format_specifier`); alias or hoist restructuring
(`_reserved_identifier`, `tuple_type`, `tuple_expression`,
`_non_special_token`, `print_statement`, `_simple_pattern`); and genuine
ambiguity or precedence fixes (`primary_expression`, `arrow_function`,
`object_type`, `impl_item`, `reference_expression`). The first two classes are
compiler debt wearing an override; the third is authoring. Today they are
indistinguishable, so the debt never shrinks and a re-authored rule outlives
the compiler gap that justified it.

## Decision

1. A shape the model does not support is a **blocking** diagnostic. The
   compiler never falls back to a guessed shape.
2. A hand-authored departure is the sanctioned resolution of a diagnostic,
   and must **claim** one. A departure that resolves nothing is reported.
3. The hand-written rule counts are ratchet ceilings that only shrink.

## 1. Hand-written rules

### 1.1 Every `rules:` entry carries a cause

The `rules:` block's value shape becomes a declaration, not a bare body:

```ts
rules: {
  primary_expression:    reauthored('ambiguity', ($, original) => …),
  string:                reauthored('lexical-interior', ($, original) => …),
  tuple_type:            reauthored('alias-shape', ($) => …),
  _whitespace:           vocabulary(($) => choice($._tight, …)),
  _tuple_type_elements:  vocabulary(($) => …),
}
```

- `reauthored(cause, body)`: replaces an upstream rule of the same name.
  `cause` is one of `'lexical-interior' | 'alias-shape' | 'ambiguity'`.
- `vocabulary(body)`: a rule sittir adds (the `_whitespace` vocabulary and
  every helper rule a re-authoring introduces); never replaces an upstream
  rule. `vocabulary-replaces-upstream`, blocking, otherwise.
- a bare body is a compile-time error: `rule-cause-missing`, blocking.

A helper minted by a patch (`rule(name, body)` in `patches:`) is not declared
in `rules:`; its reason is the patch's claim (§2).

### 1.2 Render bodies stay on `renderAs:`

An external token's render body is declared on the grammar's `renderAs:`
block, the one surface for render-only bodies; it never reaches the parser
and never appears in `rules:`. Every `renderAs:` key must name an upstream
external; a key that names a parser rule is `render-only-not-external`,
blocking.

### 1.3 A replacement must be provoked

For each `reauthored` rule, the compiler checks the **upstream** body of
the same name with the same rule checks (§4): the base `wire(config, base)`
receives (the grammar's `enrichedBase`, the same object it composes) is
evaluated and checked with no wire config. The upstream is never located by
package path; each grammar's own `base` import is the one source. Symbol
facts in these checks, as everywhere in diagnostics, come from the
predicted `SymbolSource` (§4.3). No stage but the final one is ever linked,
normalized or assembled. If no blocking
diagnostic fires on the upstream shape, the replacement is unjustified: `rule-reauthored-without-cause`,
blocking, naming the rule and its declared cause. If a blocking diagnostic
does fire, its code is recorded on the rule as the claim, and the diagnostic
is suppressed for that rule only.

`'lexical-interior'` is provoked by the token-interior diagnostics (an
opaque token whose interior the grammar addresses); `'alias-shape'` by
`alias-distributed`, `display-union-mixed`, or the four shape codes of §3;
`'ambiguity'` by a parser-generation failure or a corpus divergence recorded
in `expectTestFailures`. The provocation table records only codes the
upstream compiles are observed to report. A cause whose provoking diagnostic
is not among those fired is a mismatch and is reported as
`rule-cause-mismatch`; a `reauthored` declaration on a name upstream does not
define is the same mismatch.

### 1.4 Ratchet

`hand-written rules: typescript 12, rust 14, python 15, scm 1, regex 1` are
ceilings recorded beside the phantom-kind ceilings, counted from the
evaluated `rules:` entries (a duplicate key counts once, as evaluated). A
count above its ceiling fails the ratchet check; ceilings only go down.

## 2. Patches claim a diagnostic

A `patches:` entry exists for one of two reasons: authoring (a field name, a
variant name, an options registration, a spelling site) or resolving a shape
the compiler cannot model at that path. The second kind must claim the
diagnostic it resolves; the first kind claims nothing and is never demanded
by one.

- Each shape diagnostic names, in its message, the patch form that resolves
  it (`rule(...)` for a hidden helper, `alias(...)` for a promotion,
  `field(...)` for an unnamed nonterminal in a union row, `variant(...)` for
  a mixed row).
- A patch whose placeholder is one of those forms, at a path where no
  diagnostic fires on the upstream shape, is `patch-without-cause`,
  blocking. The `rule(name, body)` placeholder is always a resolving form. This is `body-pattern-zero-match` generalized from groups to
  every resolving patch form.
- Authoring placeholders (`field`, `options`, `variant` used only to name)
  are exempt: the check applies only when the placeholder's form is one a
  diagnostic could have demanded and the diagnostic did not fire.

The census labels every current patch as authoring or
resolving; the resolving ones are the compiler's work list, per the rule
that an audit's findings are the work list.

## 3. Shape diagnostics block

The collect-slots codes that report a fallback are
`canProceed: false`:

| code | shape | resolving form |
| --- | --- | --- |
| `unclassifiable-shape` | a slot member that is neither a leaf nor a choice of leaves | `rule(...)` naming the structured arm |
| `union-slot-mixed-row` | a mixed row: structured named arm beside union arms | `variant(...)` splitting the row, until the structured-arm enrich mint gives each structured arm its own kind in the union slot |
| `multi-slot-nested-seq` | a multi-slot seq in a repeat position | a visible `groups:` entry making each repetition one node |
| `union-slot-unaddressable` | a fieldless structural choice that qualifies for union routing but carries no rule id, so its union slot cannot be addressed | fires only in upstream stages today (rust `function_type`, typescript `for_in_statement`); both wired grammars resolve it |

`union-slot-routed` stays a warning: it reports the union-slot design's
supported routing (unnamed nonterminal arms, with any label-routed arms, in
one kind-dispatched `content` slot), and blocking it would demand patches
that undo that design.

`alias-distributed` (alias over a seq or repeat) and `display-union-mixed`
(a display over terminal and nonterminal storage) join the table with
`alias(...)` and `rule(...)` as their forms. `expectDiagnostics` keeps its
role as the per-grammar accepted floor for a code, so the flip lands without
a red gate: the current instances are listed, each with its resolving form
named in the grammar's glossary, and the list only shrinks. A floor is per
code: an owner kind floored for one code still blocks on another.
`multi-slot-nested-seq` has no instance in any grammar and has an empty
floor.

## 4. Where diagnostics run

### 4.1 Checks over the evaluated rules; link is gated

A grammar diagnostic is a check over an **evaluated stage**: raw (the
upstream grammar as written), enriched (after enrich, before wire), final
(after wire). No check needs the parser: each stage runs the id-free front
half (link, normalize, simplify, slot collection, assemble) over its
predicted kind catalog (§4.3), with no tree-sitter generate, no parser tables
and no generate output. A compile runs in this order:

1. evaluate each stage and derive its records (§5);
2. **gate before link:** if any final-stage record answerable from the
   evaluated grammar alone (a failed catalog prediction, an invalid
   `expectDiagnostics` entry, a cause or patch-site judgement against the
   upstream stage) blocks (`canProceed: false`) and is not covered by
   `expectDiagnostics`, the compile stops. Link does not run;
3. run the final stage's front half;
4. **gate after assemble:** the same test over the front half's records.

One gate function serves both points. A grammar tree-sitter rejects never
reaches link. A shape the front half cannot model is reported, not thrown;
a phase that meets an impossible state asserts (§4.4).

A non-blocking code (`union-slot-routed`) is recorded and never
gated: it reports supported routing, and the gate's target of zero applies to
blocking codes. `expectDiagnostics` floors stay the only exception to the
gate, per code and per owner, and only shrink.

### 4.2 Which checks are rule checks

| family | codes | fact the check reads |
| --- | --- | --- |
| evaluate events | `body-pattern-zero-match`, `desugar-divergence-*` | evaluate's own events |
| causes and claims | `rule-cause-missing`, `rule-cause-mismatch`, `render-only-not-external`, `vocabulary-replaces-upstream`, `rule-reauthored-without-cause`, `patch-without-cause` | wire declarations, patch sites, the upstream stage's records |
| alias sites | `display-union-mixed`, `display-union-unknown-member`, `content-alias-noninjective`, `alias-distributed`, `parsekind-noninjective` | ALIAS sites in the rules (display target versus source symbol) |
| slot shapes | `unclassifiable-shape`, `union-slot-mixed-row`, `union-slot-unaddressable`, `union-slot-routed`, `union-slot-nondegenerate-arm`, `multi-slot-nested-seq`, `content-collision`, `storagename-collision`, `union-slot-content-collision` | the splice view (§4.3): fields, repeat multiplicity and separators, choice-arm partitions, rule classification |
| literal sets | `single-literal-choice` (new) | a choice whose literal arms reduce to one value, which assemble today rejects by throwing (typescript `meta_property` upstream) |
| inline list | `inline-array-visible-name` | the `inline:` list and predicted visibility |
| symbol table | `dangling-internal-ref` (a reference that names no rule and no external), `unpredictable-symbol-table` (new) | the catalog prediction (§4.3); tree-sitter rejects either grammar, so neither is expectable |

Detection moves to the rule checks, and classification stays in one place:
the member-shape classifier and the storage-name derivation are single
functions over rule nodes, called by the checks over the splice view and by
collect-slots during assemble. No slot fact is derived twice.

### 4.3 The splice view and predicted symbol facts

Slot-shape checks must see a hidden kind's body where normalize will splice
it. The splice view walks the evaluated rules through every SYMBOL whose
reference inlines. `inlinesAtReference` takes a `SymbolSource` and is the
one predicate: the splice view calls it with the predicted source, and link
(stamping parser visibility, then normalize's splicing) calls it with the
catalog source. `SymbolSource` answers every fact the predicate reads:
hiddenness (including an aliased hidden rule), supertype, terminality,
visible external and inlining. The predicted source is the catalog source
over a predicted kind catalog: evaluate ports tree-sitter's symbol-table
construction over the evaluated rules, externals, extras, `inline:`,
`supertypes:` and `word`, and turns the predicted table into rows with the
same derivation that turns parser.c's table into rows. It never reads
parser.c.

Renames that link applies from the parser's tables (a hidden rule that the
parser always presents under an alias name) come from the same rows. Link
asserts that the predicted catalog agrees with the parser's on every field
the pipeline reads, row by row; every other fact, renames included, then
agrees by construction. A disagreement is a predictor bug, fixed in the
predictor; it is never absorbed by moving a floor. A grammar the prediction
cannot build a table for is one tree-sitter rejects: it is recorded (§4.2),
not thrown.

### 4.4 What is not a grammar diagnostic

- **Kind-id ratchet** (`kindid-*`): these compare sittir's kinds with the
  parser's ids, so they are answerable only after tree-sitter generates the
  parser. They stay the post-generate phantom-kind ratchet: ceilings that
  only shrink, outside the gate.
- **Compiler invariants**: a fixpoint that never converges, an alias target
  the parser never mints, a `factoryInline` kind with nowhere to nest, and a
  hydrate-time reference to a kind absent from the node map. Each throws in
  the phase that owns it and is unreachable once the gate passes. An
  invariant that fires is a missing rule check: its grammar-level cause gets
  a check in §4.2, and the invariant stays an assertion. A reference that
  names no rule and no external is not one of them: it is a failed catalog
  prediction, recorded as `dangling-internal-ref` (§4.2). `unclassifiable-shape`
  is the one verdict for a top-level or member shape the slot model has no
  place for; no second postcondition audit re-derives it.
- **Naming events**: an automatic type-name rename. It is codegen output,
  printed in the gen log (`[naming]` lines), not a diagnostic.
- **Emit-level reports** (`seam-word-hazard`, `unnamed-choice-slot`) are out
  of scope for this gate.

## 5. Diagnostic records

Every stage's rule-check output folds into one record per key:

```ts
interface DiagnosticRecord {
  code: string;
  ruleId: RuleId;              // the owner kind's root rule id
  ownerKind: string;
  slotName?: string;
  ruleProvenance: 'upstream' | 'enrich' | 'wire';
  resolved: boolean;
  resolvedBy?: { stage: 'enrich' | 'wire'; by: readonly ResolvedBy[] };
}
type ResolvedBy = { rule: string } | { patch: { ownerKind: string; path: string; form: string } };
```

- The key is `(code, ruleId, slotName?)`. Diagnostics are owner-level, and
  rule ids below the root are not stable across stages (enrich's field wraps
  and hoists change paths), so the key uses the owner's root id. Owner
  identity is that root id, stable across renames: a rule id points back to
  the source rule, so a kind the catalog renames to its parser name keeps the
  id it was minted with, and no rename canonicalization is needed.
- `ruleProvenance` is where the owner kind comes from: `upstream` if the raw
  stage declares it, `enrich` if enrich mints it, otherwise `wire`. The first
  stage a key appears in is not stored; it is read from the stage records.
- `resolved` is operational: the key is absent from the final stage's
  exhaustive check.
- `resolvedBy.by` lists the `rules:` entries and patch sites that resolved
  the key. A patch site claims the records owned by its owner kind and by
  every enrich lift the patch rewrites or renames; the lift writers record
  that evidence, never a name match. An enrich resolution has an empty `by`:
  nothing names the enrich pass that removed a diagnostic.
- Patch-site labels (`authoring` / `resolving`) derive from the records: a
  site is resolving iff it claims a key present in the enriched stage and
  resolved by wire.
- The compilation exposes the records as `diagnosticRecords`. Each stage's
  diagnostics are read where they live: `stages.raw.diagnostics` and
  `stages.enriched.diagnostics` for the evaluated stages, and
  `grammarDiagnostics` for the final stage. No second copy of any stage is
  stored.

## 6. Acceptance

- Every `rules:` entry in the five grammar files is `reauthored` or
  `vocabulary`; no bare body remains. Every `renderAs:` key is an upstream
  external.
- `rule-reauthored-without-cause` is silent on all five grammars outside
  their floors, and fires in a unit fixture where a `reauthored` rule
  replaces a rule the compiler accepts.
- `patch-without-cause` is silent on all five grammars after the census,
  and fires in a fixture where `rule(...)` is applied at a path with no
  diagnostic.
- The three shape codes and the two alias codes report `canProceed: false`;
  `expectDiagnostics` lists their current instances per grammar; the
  structural-recursion fallback in `collect-slots` runs only for
  floor-listed instances, and an unlisted instance blocks.
- Ratchet: hand-written rule counts at or below 6/13/14/1/1 (typescript,
  rust, python, scm, regex); the check runs with the phantom-kind ratchet.
- No diagnostic reads link, normalize or assemble output. A grammar with an
  unfloored blocking record stops before link; a unit fixture proves it.
- Every stage, including typescript's raw stage, produces records; no stage
  compile exists to fail.
- In all five grammars, link's catalog agrees with the predicted
  `SymbolSource` on every fact `inlinesAtReference` reads and on the renames.
- The compiler invariants of §4.4 are assertions and fire on no grammar; the
  final-stage floors are unchanged or smaller.
- Native gate unchanged: read-render-parse, factory-render-parse and
  ir-render-parse at baseline in every grammar; the declaration migration is
  byte-identical on generated output.

## 7. Out of scope

- Fixing any of the shapes the census surfaces; each is its own work item.
- The `expectTestFailures` list: it stays as the corpus-divergence record and
  is only read here as the provocation for `'ambiguity'`.
- A cause vocabulary for `patches:` entries; the claim is the diagnostic
  code itself.
