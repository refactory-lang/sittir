# 024 — AssembledGroup synthesis via `groups:` overrides

**Date:** 2026-05-15
**Branch:** `024-rust-slot-surface-contract`
**Scope:** Add a `groups:` block to per-grammar `overrides.ts` that lifts nested sub-rules into hidden synthesized kinds materialized as `AssembledGroup` instances. Subsumes bug #3 (rust `visibility_modifier_pub` rendering `pub()` when it should render `pub`) and removes the field/children walker asymmetry that motivated the reverted commit `07fde12f`.

## Background

### Today's pain

Rust `visibility_modifier`'s polymorph variant `_visibility_modifier_pub` is structurally:

```text
seq(
  field('pub', 'pub'),                  ← position 1/0
  optional(seq(                         ← position 1/1 — co-optional group
    '(',                                ← 1/1/0/0
    choice(self, super, crate,          ← 1/1/0/1
           seq('in', _path)),
    ')',                                ← 1/1/0/2
  )),
)
```

The template walker emits `_visibility_modifier_pub.jinja` as `{{ pub }}({{ children }})` — parens unconditional. When a corpus entry uses bare `pub` (no inner choice), rendering produces `pub()`, and the re-parse fails because rust's grammar rejects `pub()`. Today this affects 5+ rust read-render-parse first-failing entries (`Modules`, `Extern crate declarations`, `Extern function declarations`, `Use declarations`, plus more downstream).

The bug is that today's walker, hitting `optional(seq(literal, structural, literal))`, bails through `extractClauseBranch` (template-walker.ts:1252) because the structural member is a non-field (it's a `choice` of `symbol` refs). It falls through to a path that walks the inner seq directly, emitting the literals unconditionally. The prior fix attempt (`07fde12f`, reverted as `d7f060c2`) extended the walker to map symbol/supertype refs to a `children` anchor, but conflated cases — typescript `_for_header_var_kind.jinja` lost its `={{ value }}` literal+field emission. The user correction: "there's not supposed to be a distance between children and fields" — meaning the walker should treat fields and unnamed structural members uniformly as slot-bearing positions, not extend its existing field/symbol asymmetry.

### Why this design instead of a walker tweak

Two reasons.

First, the structural truth is that `seq('(', choice, ')')` IS a unit — its members fire together. Distributing those members across the parent's slots and then trying to gate them in the template is a workaround for the slot model not capturing the grouping. The AssembledGroup class exists exactly to represent such groupings (it's how polymorph forms are materialized today). Synthesizing one for this nested seq pulls the fix into the structural layer (link / assemble) instead of the rendering layer (walker), which is the correct level per §E1 (wrap is the sole grammar-aware normalization layer; slot model is wrap's input).

Second, the user has stated the broader goal multiple times across the session: *"It applies to more than just rendering — something we should control for factories too"*, and *"we can update the override suggestions to emit this actually."* Walker-level gating fixes only rendering. AssembledGroup synthesis affects factories, from, wrap, and render symmetrically because all of them consume the same slot model.

## Design

### Override surface: new `groups:` block

Polymorph-symmetric syntax. Path keys root at the post-evaluate rule map — typically the polymorph variant kind after aliasing. Value is the discriminator string:

```ts
// packages/rust/overrides.ts
groups: {
  _visibility_modifier_pub: {
    '1': 'parens'
  }
}
```

Synthesized kind name is `_<parent>_<discriminator>` with `__` → `_` collapse when the parent already starts with `_`. For the example above, parent `_visibility_modifier_pub` + discriminator `parens` = **`_visibility_modifier_pub_parens`**.

Note: because keys address the post-polymorph variant kind (`_visibility_modifier_pub`), the path `'1'` directly indexes position 1 of its seq body, where the optional parens group lives. This is simpler than the pre-polymorph keying scheme and produces the same synthesized name via a more direct path.

### Synthesis stage: pre-polymorph in link

Group synthesis runs as a new sub-stage of `link`, **before** the polymorph alias pass. The deep-paths-first invariant from polymorphs (a deeper polymorph path can't be specified once an outer alias rewrites that arm) extends naturally: a `groups:` lift on a path is also unreachable if an outer polymorph alias has already replaced it. Running group synthesis first means lifts happen against the original rule body, then polymorph aliases naturally encapsulate the now-lifted symbol ref inside each variant.

Per group entry:

1. Resolve `<kind, path>` to the target sub-rule via the existing path walker (shared with `transforms:` / `polymorphs:`).
2. Compute synthesized kind name using the polymorph-context naming rule above.
3. Wrapper handling: when the lifted target is itself a wrapper (`optional` / `repeat` / `repeat1`), lift only the wrapper's content into the synthesized kind, leaving the wrapper at the original position with the synthesized symbol ref inside. This preserves cardinality semantics in the parent. For visibility_modifier: `optional(seq('(', choice, ')'))` at `1/1` becomes `optional(SymbolRule('_visibility_modifier_pub_parens', source: 'group-lift'))` at `1/1`, with `rules['_visibility_modifier_pub_parens'] = seq('(', choice, ')')`.
4. Register the lifted body under the synthesized name in the rule map.

The `source: 'group-lift'` discriminant on the new SymbolRule lets downstream stages distinguish synthesized refs from author-written ones, mirroring existing `source: 'inferred' | 'override' | 'grammar'` discriminants.

### Downstream materialization: reuse hidden-symbol classification

The synthesized `_<...>` rule registers as a hidden-prefixed kind in the rule map. The existing classifier in `node-map.ts` picks it up as a hidden symbol and materializes an `AssembledGroup` via the same path as today's inlined-hidden-seq groups — no new materialization code. From `link`'s output forward, the synthesized kind is structurally indistinguishable from an author-written hidden helper.

This means:

- **Factories.** `_visibility_modifier_pub_parens` gets its own factory taking the inner-choice slot. `_visibility_modifier_pub`'s factory takes `pub` plus `parens?` (optional ref to the group).
- **Wrap.** Drill-in produces a nested view for the group — `_visibility_modifier_pub`'s children include the synthesized symbol, which wraps through `_visibility_modifier_pub_parens`'s wrap function.
- **Render.** The template walker has a special case for `source === 'group-lift'` symbols (see `template-walker.ts`): instead of inline-expanding the symbol's body (as with other hidden symbols), it emits a bare slot reference. The render template for `_visibility_modifier_pub` is `{{ pub }}{{ children }}` — no explicit `{% if isPresent %}` gate. Askama's `OptionalNonterminalView<'a>` type handles absent slots at the type level, rendering as empty string when the optional parens group is not present. The group's own template (`_visibility_modifier_pub_parens.jinja`) is `({{ children }})` — literals live there only.
- **From.** Reads the parent's CST, recognizes `_visibility_modifier_pub_parens` at the synthesized symbol position, and recursively delegates to that kind's from. Mirrors today's behavior for hidden helpers.

### Suggested overrides emitter: `suggestedGroups:` block

Codegen adds a `suggestedGroups:` block to `overrides.suggested.ts` for each grammar. The detector walks post-evaluate rule bodies and emits one held suggestion per nested seq matching:

- Parent type ∈ {`optional`, `choice`, `repeat`, `repeat1`, outer `seq`, `field`}.
- Seq has ≥1 structural member (field, symbol, supertype, or a wrapper around one of those).

Emitted entry shape: `<kind>: { '<path>': '<discriminator_guess>' }`. Discriminator guess: first structural member's kind name normalized, or a position-based hint (`g<path>` like `g1_1`) when no clear name exists. Author renames on copy-out.

Filter: don't suggest a group whose target is already a `source: 'group-lift'` symbol (the user already opted in for that lift).

## Error handling

All errors caught at config-validate time (when overrides.ts is loaded), before any synthesis runs.

**E1. Overlap with polymorphs.** Path keys now root in the post-evaluate rule map (often a polymorph variant kind). Cross-kind overlap (groups path keyed off `_visibility_modifier_pub`, polymorphs path keyed off `visibility_modifier`) is impossible by construction. Same-kind conflicts are caught by checking the rule map directly. Exact path matches on the same kind → reject. Author picks one.

**E2. Unresolvable path.** Group path doesn't address a sub-rule in the kind's body:
```text
groups['<kind>']['<path>'] does not resolve in <kind>'s rule body.
Available paths under <kind>: <enumeration>.
```

**E3. Overlap with another group.** Two `groups:` lifts where one is an ancestor of the other on the same kind throws the same overlap error shape as E1, with the second group's path replacing the polymorph path.

**E4. Naming collision.** Computed synthesized name already exists in the rule map:
```text
groups['<kind>']['<path>'] would synthesize <name>, but a rule with
that name already exists. Pick a different discriminator.
```

No silent overwrite, no auto-suffixing.

**E5. Invalid discriminator.** Empty string or non-identifier characters → reject with the same shape as polymorphs' discriminator validation (reuse the existing validator).

**E6. Empty-body lift.** Target resolves to a sub-rule with no structural members (purely literal/punctuation content). Emit a console warning, don't throw — the author may intend to add structural members later, and lifting a literal-only sub-rule is legal (just useless until populated).

**E7. Runtime safety.** No new failure modes. The synthesized kind goes through the same hidden-symbol path as today's group classification; existing assertions in parse / wrap / render catch any structural surprises.

## Testing

**T1. Unit tests for group synthesis** — `packages/codegen/src/__tests__/group-synthesis.test.ts` (new):
- Lift a nested seq from a synthetic two-level rule tree → verify parent body has SymbolRule ref at lift point, rule map has lifted body under synthesized name.
- Naming derivation: lift inside a polymorph-aliased ancestor → verify name includes the polymorph variant segment.
- Wrapper handling: lift target is `optional(seq(...))` → wrapper stays at parent position, only content moves to synthesized kind.
- All seven error cases (E1, E2, E3, E4, E5, E6 warning, E7 negative) → verify correct error message or warning.

**T2. Integration test: visibility_modifier round-trip** (the load-bearing test):
- Add `groups: { _visibility_modifier_pub: { '1': 'parens' } }` to `packages/rust/overrides.ts`.
- Regen rust per cleanup-rules §B3 → manifest sync verified.
- Run `pnpm exec tsx packages/validator/src/cli.ts counts --backend native rust`.
- Verify `_visibility_modifier_pub.jinja` now contains `{{ pub }}{{ children }}` (bare slot reference, no `{% if isPresent %}` gate). Verify `_visibility_modifier_pub_parens.jinja` contains `({{ children }})`.
- Verify rust read-render-parse pass count rises by at least 5 (the 5 first-failing entries that show `pub()` in their re-parse error today).
- Per §D3, AST-match must move with pass count — single-metric jumps trigger scrutiny.

**T3. Suggested-overrides emit smoke test**:
- Run codegen on rust → verify `packages/rust/overrides.suggested.ts` contains a `suggestedGroups:` block.
- Verify the visibility_modifier entry exists with path `'1/1'`.
- Check at least one detected case from typescript or python to verify cross-grammar detector parity.

**T4. Regression coverage across all three grammars** (per §B3):
- Regen all 3 grammars after the codegen change.
- Compare cov + RT + factory + from per §D3.
- Expected: rust passes ↑ (the only grammar with a `groups:` entry); ts/python pass counts unchanged but they receive the suggested.ts emit.
- AST-match deltas correlate with pass-count deltas — no masking detected.

## Principles applied

- **P-001 (External contract first).** No grammar.js changes — `groups:` is a sittir-side rewrite. Parser.wasm output stays raw per §E2.
- **P-003 (Reuse existing structure).** Group lift produces SymbolRule refs and registers hidden kinds; existing hidden-symbol classifier materializes AssembledGroup. No new AssembledNode subclass, no new DSL function, no new walker path.
- **P-005 (Single source of truth).** One path resolver shared across `transforms:` / `polymorphs:` / `groups:`. One naming convention. One materialization path.
- **P-007 (Cut speculative scope).** No `pathOf()` utility in this spec — that's a separate ergonomic improvement for all three blocks, tracked elsewhere. No support for nested group lifts in v1 (deferred until a real second case appears).
- **P-008 (Composition over configuration).** Adding a group lift means adding one entry; no flag, no toggle. The presence of an entry is the activation signal.

## Out of scope

- The `pathOf()` rule-id-to-path utility discussed during brainstorming. To be filed as a separate ergonomic improvement that benefits `transforms:` / `polymorphs:` / `groups:` symmetrically. Not blocking this design.
- Auto-apply of suggestions (vs held-by-default). Held-by-default matches the existing `[held]` pattern for transforms and polymorphs in `overrides.suggested.ts`.
- Cross-grammar opt-ins. Each grammar's overrides.ts gets entries independently. Codegen detects synthesis candidates per-grammar.
- Walker generalization (the previous 07fde12f attempt). Subsumed by the synthesis approach; not pursued.

## Open questions

None remaining after Section 3 review. The inner-polymorph-path overlap question was resolved as option (a): reject overlap at config-validate, force the author to re-root the inner polymorph relative to the lifted kind.

## Migration impact

After this lands, three things change observably:

1. `packages/<grammar>/overrides.suggested.ts` grows a `suggestedGroups:` block on next codegen run.
2. Adding a `groups:` entry to `packages/<grammar>/overrides.ts` regen-changes the affected polymorph variant's `.jinja` template and factory/from/wrap shape.
3. Bug #3 (`pub()` → `pub`) closes once `groups: { _visibility_modifier_pub: { '1': 'parens' } }` is added to `packages/rust/overrides.ts`.

No breaking change to existing overrides — `groups:` is additive. Empty `groups:` block (or missing entirely) preserves today's behavior exactly.

## Implementation notes (post-landing)

Two design points landed differently from the pre-implementation spec, both approved in final code review:

1. **Post-evaluate rule map keying.** Path keys root at the post-evaluate rule map, not the pre-polymorph-alias original rule. After polymorph aliasing, this is often the variant kind itself (e.g., `_visibility_modifier_pub`). The naming algorithm simplifies to `_<parent>_<discriminator>` with `__` → `_` collapse, producing the same outcome as the pre-polymorph walking algorithm via a more direct path.

2. **Walker special-case for group-lift symbols.** The template walker checks `source === 'group-lift'` and skips inline expansion of the symbol's body, instead emitting a bare slot reference (e.g., `{{ children }}`). Askama's `OptionalNonterminalView<'a>` type handles absent optional slots at the type level, rendering as empty string. The explicit `{% if isPresent %}` Jinja conditional is unnecessary; the group's own template contains the literals.
