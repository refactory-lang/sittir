# Unsupported shapes are diagnostics, and every hand-written rule states its cause

**Status:** approved design, 2026-09-22. Implementation plan to follow.

**Goal:** the compiler refuses every grammar shape it does not model, at the
site, naming the shape and the patch form that resolves it; and every
hand-authored departure from the upstream grammar (a `rules:` entry or a
`patches:` entry) is justified by a diagnostic it resolves. Nothing is
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

**Departures.** The three grammar files carry a large hand-authored surface
and nothing records why any entry exists:

| grammar | patched rules | hand-written rules | of which replace an upstream rule | new rules | re-author an external |
| --- | --- | --- | --- | --- | --- |
| typescript | ~88 | 17 | 10 | 4 | 3 |
| rust | ~67 | 26 | 9 | 10 | 7 |
| python | ~51 | 22 | 10 | 12 | 0 |

A hand-written rule is whole-rule re-authoring. Reading the 65 of them, three
causes recur: lexical re-authoring where upstream's token is opaque
(`string`, `template_*`, `string_literal`, `string_content`,
`format_specifier`); alias or hoist restructuring that the alias-identity
primitives now cover (`_reserved_identifier`, `tuple_type` and
`_tuple_type_elements`, `_let_chain`, `_non_special_token`, the
`print_statement` family, the comprehensions, `case_*_pattern`,
`_wildcard_pattern`); and genuine ambiguity or precedence fixes
(`primary_expression`, `arrow_function`, `class_body`, `object_type`,
`impl_item`, `reference_expression`). The first two classes are compiler
debt wearing an override; the third is authoring. Today they are
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
  primary_expression: reauthored('ambiguity', ($, original) => …),
  string:             reauthored('lexical-interior', ($, original) => …),
  _let_chain:         reauthored('alias-shape', ($) => …),
  _whitespace:        vocabulary(($) => choice($._tight, …)),
  float_literal:      renderOnly(($) => …),
}
```

- `reauthored(cause, body)`: replaces an upstream rule of the same name.
  `cause` is one of `'lexical-interior' | 'alias-shape' | 'ambiguity'`.
- `vocabulary(body)`: a rule sittir adds by design (`_whitespace`); never
  replaces an upstream rule.
- `renderOnly(body)`: an external token given a render body; never reaches
  the parser. The existing render-only-rules mechanism, now declared rather
  than inferred from the externals list.
- a bare body is a compile-time error: `rule-cause-missing`.

A new helper rule (one that replaces nothing and is not vocabulary) is not
declared here at all: it is minted by a patch (`rule(name, body)` from the
alias-identity spec) at the path that needs it, so its reason is the patch's
claim (§2). The 26 current new rules migrate to that form; `_whitespace`
stays as vocabulary.

### 1.2 A replacement must be provoked

For each `reauthored` rule, the compiler evaluates the **upstream** body of
the same name through the same pipeline (the base grammar is already
evaluated as `enrichedBase`). If no blocking diagnostic fires on the upstream
shape, the replacement is unjustified: `rule-reauthored-without-cause`,
blocking, naming the rule and its declared cause. If a blocking diagnostic
does fire, its code is recorded on the rule as the claim, and the diagnostic
is suppressed for that rule only.

`'lexical-interior'` is provoked by the token-interior diagnostics (an
opaque token whose interior the grammar addresses); `'alias-shape'` by
`alias-distributed`, `display-union-mixed`, or the four shape codes of §3;
`'ambiguity'` by a parser-generation failure or a corpus divergence recorded
in `expectTestFailures`. A cause whose provoking diagnostic is not among
those fired is a mismatch and is reported as `rule-cause-mismatch`.

### 1.3 Externals are render-only

A `renderOnly` rule must name an external. One that names a parser rule is
`render-only-not-external`, blocking. The 10 current external re-authorings
migrate as they are.

### 1.4 Ratchet

`hand-written rules: typescript 17, rust 26, python 22` become ceilings
recorded beside the phantom-kind ceilings. A count above its ceiling fails
the ratchet check; the alias-identity plan's Task 7 lowers rust to 24 and
python to 20.

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
  blocking. This is `body-pattern-zero-match` generalized from groups to
  every resolving patch form.
- Authoring placeholders (`field`, `options`, `variant` used only to name)
  are exempt: the check applies only when the placeholder's form is one a
  diagnostic could have demanded and the diagnostic did not fire.

The initial census (plan Task 1) labels every current patch as authoring or
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
a red gate: the current instances are listed, and the list only shrinks.

## 4. Acceptance

- Every `rules:` entry in the three grammar files is `reauthored`,
  `vocabulary` or `renderOnly`; no bare body remains.
- `rule-reauthored-without-cause` is silent on all three grammars at the
  ceilings, and fires in a unit fixture where a `reauthored` rule replaces a
  rule the compiler accepts.
- `patch-without-cause` is silent on all three grammars after the census,
  and fires in a fixture where `rule(...)` is applied at a path with no
  diagnostic.
- The four shape codes and the two alias codes report `canProceed: false`;
  `expectDiagnostics` lists their current instances per grammar; no fallback
  path remains in `collect-slots`.
- Ratchet: hand-written rule counts at or below 17/26/22; the check runs
  with the phantom-kind ratchet.
- Native gate unchanged: read-render-parse, factory-render-parse and
  ir-render-parse at baseline in all three grammars; the census and the
  declaration migration are byte-identical on generated output.

## 5. Out of scope

- Fixing any of the shapes the census surfaces; each is its own work item.
- The `expectTestFailures` list: it stays as the corpus-divergence record and
  is only read here as the provocation for `'ambiguity'`.
- A cause vocabulary for `patches:` entries; the claim is the diagnostic
  code itself.
