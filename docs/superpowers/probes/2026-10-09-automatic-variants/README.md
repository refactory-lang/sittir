# Automatic variant labels: what stopping them would cost

Measures every label enrich stamps automatically (`dsl/automatic-variants.ts::stampRuleVariants`), to size a
change where variant names come only from authored `variant()` calls. Read-only; it changes nothing.

```sh
pnpm exec tsx docs/superpowers/probes/2026-10-09-automatic-variants/automatic-variants.mts "$PWD" \
  docs/superpowers/probes/2026-10-09-automatic-variants/outputs
```

The argument is a checkout root. The script runs unchanged on master (`0de637d9d`) and on the builder-path branch;
both give the numbers below. `outputs/<grammar>.md` holds the full per-label tables, `outputs/summary.txt` the
one-line counts.

## Method

- The automatic labels are the keys of the grammar's automatic-variant record (`RawGrammar.automaticVariants.keys`,
  `owner \0 label \0 ref`) after `collapseRenamedRules`. A key whose owner is in `supertypeOwners` is group 1
  (a supertype member's label, `statement.if`); every other key is group 2 (an arm of an ordinary choice,
  `attribute.input`). A key whose owner has no node after assemble is counted but not classified further.
- "Own flat key": the member's kind has an `irKey` that names a member of the generated `ir`.
- "Arm route": the owner's sub-factory set has an entry under the label (`subFactoriesOf`). A value arm is a
  literal the label spells; a node arm forwards to a child kind.
- "Only through the label": a value arm, or a node arm whose child has no flat key of its own. A value arm's literal
  can still be passed as the slot's text, so for value arms this counts the named builder only.
- "Names a kind": the arm's kind is `<owner>_<label>`. The label is derived from the kind's display name
  (`armNameOf(owner, display)`), not the other way round, so dropping the label renames no kind.
- Provenance: link's `VariantChild.definedBy` (`variant-structural.ts::definedByOf`: `'enrich'` when the label's
  key is in the automatic record, `'override'` for an authored `variant()`, `alias()` or group label), compared with
  the split master's `ir` used for flattened routes (child named `<parent>_<label>` and reachable only through that
  parent), over every variant-bearing supertype.
- Bindings: automatically named kinds (above) that are parser kinds (`.sittir/src/grammar.json` rules), and whether a
  `bindings.scm` / `bindings.seed.scm` claim names them.

## Results

| grammar | labels | group 1 | member has own flat key | group 2 (live) | arm routes (value) | only through the label | definedBy ≠ minted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rust | 306 | 91 | 82 | 215 (195) | 5 (4) | 4 | 4 |
| typescript | 324 | 130 | 122 | 194 (121) | 9 (4) | 4 | 6 |
| python | 192 | 91 | 88 | 101 (85) | 16 (1) | 4 | 0 |
| scm | 26 | 9 | 9 | 17 (17) | 0 | 0 | 1 |
| regex | 55 | 0 | 0 | 55 (55) | 23 (5) | 7 | 0 |

**Is an authored label distinguishable from an automatic one?** Yes, per label, at link:
`VariantChild.definedBy` on `LinkedGrammar.variantChildren`, derived from the automatic record, which
`withAuthoredLabel` keeps honest by deleting a key when `variant()` relabels an arm. The fact is lost at assemble:
a model ref (`NodeBackedRef`, slot values, supertype subtypes) carries only `variant`, `variantOf` and `default`, so
model readers cannot ask it.

**definedBy against the minted split.** Over the flattened parents `ir` uses, 4 routes differ: two authored labels
on kinds that also stand alone (typescript `pattern → _lhs_expression`, `_class_body_member → empty_member`) and two
element-supertype arms enrich mints with an automatic label (typescript `_enum_body_element →
enum_body_element_name`, scm `_list_element → list_element_quantifier`). The other 7 differences are on
supertypes `ir` does not flatten (rust `_token_pattern`, `_tokens`, `_type`, `_condition`; typescript `type` ×2,
`primary_type`).

**Bindings.** Only typescript's `decorator_member_expression`, `decorator_call_expression` and
`decorator_parenthesized_expression` are automatically named parser kinds that a claim names. Since a label never
names a kind, removing the label leaves the claims intact.

**Arms that lose their builder** (only through the label): rust `non_special_token` mutable_specifier, self, super,
crate (value arms); typescript `literal_type` true, false, null, undefined (value arms); python `import_from_statement`
wildcard_import (value arm), `parenthesized_import_list` (under both import statements), `yield.from_clause`; regex
`count_quantifier.arm`, `character_class_escape.arm`, `term_group` start_assertion, end_assertion,
boundary_assertion, non_boundary_assertion, any_character (value arms). Each owner's site, and every other arm with
a route, is in `outputs/<grammar>.md`.

## What each reader of a label would do without automatic labels

- `sub-factories.ts::armValuesOf` / `isLabelled`: arm sub-factories exist only for labelled values, so every group-2
  route goes (rust 5, typescript 9, python 16, regex 23 builders such as `ir.term_group.*`, `ir.type.*`), and so do
  the value-arm builders listed above.
- `node-map.ts::armFactsOf`: a literal arm's name comes from its label, else from the literal; value-arm names change
  to the literal's own name.
- `AssembledSupertype.variantSubtypes` (needs every subtype labelled): a supertype whose members carry only
  automatic labels stops being variant-bearing. That removes its default arm (`defaultVariantSubtype`, read by
  trivia's sibling leads, from.ts's default arm and the interior emitter), its namespace-arm status and its flattening
  (`deriveFlattenedVariantParents`): the `ir` namespaces of rust `comment`, `_declaration_statement`; typescript
  `declaration`, `pattern`, `statement`, `_class_body_member`, `_enum_body_element`; python `_simple_statement`,
  `_compound_statement`, `parameter`; scm `definition`, `_list_element` (109 routes; a parent with any automatic member
  is lost whole).
- `site-preferences.ts` (`armValue`, `variantChoiceCandidate`): an `options:` entry that names an automatic arm stops
  resolving.
- `ir-surface.ts::ownerRoutesOf` (declaring owner on the builder-path branch): arms lose their declared owner and fall
  back to containment or their flat key.
- link `deriveVariantChildren` → `variantChildKinds`: `polymorphVariants` loses its `enrich` entries, and
  `markUserFacing` stops marking a surface-hidden kind user-facing because it is a variant child.
- `render-module.ts`: its enum variants are named from type names (`rustTypeIdent`, `rustTransportVariantName`), not
  labels, so transports move only where arms or options above disappear.
- `hydrateValues`' owner check, `collapseRenamedRules`, wire's `withoutAutomaticVariants` / `relabelledArm`: no output
  of their own.

**Regeneration footprint, estimated:** node-model.json5, types.ts, factories overlays, coerce.ts, ir.ts, the emitted
tests and the generated examples for every grammar, plus the native render crates wherever an options arm or a
seated arm disappears. That is 53 arm builders and 109 namespace routes, plus defaults and options to be counted
when a change is attempted.
