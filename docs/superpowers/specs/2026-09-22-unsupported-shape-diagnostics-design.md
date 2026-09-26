# Unsupported shapes are diagnostics, and every hand-written rule states its cause

**Status:** approved design, 2026-09-22; amended 2026-09-26 (render bodies stay
on `renderAs:`, all five grammars, measured ceilings, upstream taken from the
base `wire()` receives).

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
structural recursion", 3 sites), `union-slot-routed` (4), `union-slot-mixed-row`
(1), `multi-slot-nested-seq` (1). All four are warnings with `canProceed: true`.
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

For each `reauthored` rule, the compiler evaluates the **upstream** body of
the same name through the same pipeline: the base `wire(config, base)`
receives (the grammar's `enrichedBase`, the same object it composes) is
compiled a second time with no wire config. The upstream is never located by
package path; each grammar's own `base` import is the one source. Symbol
terminality in this compile, as everywhere in diagnostics, comes from the
catalog-based `SymbolSource`. The upstream compile runs only when the grammar
has at least one `reauthored` rule or resolving patch. If no blocking
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
define is the same mismatch. An upstream compile that throws is one
`upstream-compile-failed` warning and no judgements.

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

The four collect-slots codes flip to `canProceed: false` and drop their
fallback:

| code | shape | resolving form |
| --- | --- | --- |
| `unclassifiable-shape` | a slot member that is neither a leaf nor a choice of leaves | `rule(...)` naming the structured arm |
| `union-slot-routed` | an unnamed nonterminal arm routed into a union slot beside labelled arms | `field(...)` on the arm |
| `union-slot-mixed-row` | a singular mixed row: structured named arm beside leaves | `variant(...)` splitting the row |
| `multi-slot-nested-seq` | a multi-slot seq in a repeat or optional position | `rule(...)` hoisting the seq |

`alias-distributed` (alias over a seq or repeat) and `display-union-mixed`
(a display over terminal and nonterminal storage) join the table with
`alias(...)` and `rule(...)` as their forms. `expectDiagnostics` keeps its
role as the per-grammar accepted floor for a code, so the flip lands without
a red gate: the current instances are listed, each with its resolving form
named in the grammar's glossary, and the list only shrinks. A floor is per
code: an owner kind floored for one code still blocks on another.
`multi-slot-nested-seq` has no instance in any grammar and has an empty
floor.

## 4. Acceptance

- Every `rules:` entry in the five grammar files is `reauthored` or
  `vocabulary`; no bare body remains. Every `renderAs:` key is an upstream
  external.
- `rule-reauthored-without-cause` is silent on all five grammars outside
  their floors, and fires in a unit fixture where a `reauthored` rule
  replaces a rule the compiler accepts.
- `patch-without-cause` is silent on all five grammars after the census,
  and fires in a fixture where `rule(...)` is applied at a path with no
  diagnostic.
- The four shape codes and the two alias codes report `canProceed: false`;
  `expectDiagnostics` lists their current instances per grammar; the
  structural-recursion fallback in `collect-slots` runs only for
  floor-listed instances, and an unlisted instance blocks.
- Ratchet: hand-written rule counts at or below 12/14/15/1/1; the check runs
  with the phantom-kind ratchet.
- Native gate unchanged: read-render-parse, factory-render-parse and
  ir-render-parse at baseline in every grammar; the declaration migration is
  byte-identical on generated output.

## 5. Out of scope

- Fixing any of the shapes the census surfaces; each is its own work item.
- The `expectTestFailures` list: it stays as the corpus-divergence record and
  is only read here as the provocation for `'ambiguity'`.
- A cause vocabulary for `patches:` entries; the claim is the diagnostic
  code itself.
