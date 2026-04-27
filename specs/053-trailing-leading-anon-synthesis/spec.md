# Feature Specification: Trailing / Leading Anon Synthesis

**Feature Branch**: `053-trailing-leading-anon-synthesis`
**Created**: 2026-04-26
**Status**: Draft
**Motivation**: Native parity break introduced by commit `5eb15d07` — the
TS-side `detectTrailingAnonForField` logic cannot cross the JSON serialisation
boundary into the native (Rust/napi) render path, causing `(0,)` and similar
trailing-separator forms to render correctly under TS but silently drop the
trailing separator under native.

---

## Problem Statement

### The parity break (commit `5eb15d07`)

Rust's `tuple_expression` grammar rule has the shape:

```
field('elements', repeat($.expression, separator: ',', trailing: true))
```

The tree-sitter parse of `(0,)` produces a child list like:

```
( [anon]
  0 [named, elements[0]]
  , [anon]   ← trailing separator
) [anon]
```

The trailing `,` is an anonymous token AFTER the last `elements[*]` child.
It is NOT a named field — it lives in `$children` alongside the structural
delimiters.

#### TS render path (works)

`buildNunjucksTemplateContext` (render.ts:1038–1052) runs
`detectTrailingAnonForField(node, 'elements', effective)`, which:

1. Finds the span-end of the last named `elements` item.
2. Scans `$fields` (other keys) and `$children` for anonymous tokens whose
   `$span.start >= boundary`.
3. Returns the first candidate's `$text` (`,`).
4. Attaches it as `rendered._trailing_anon = ','` — a non-enumerable array
   property on the rendered `string[]`.
5. The Nunjucks `joinWithTrailing(",")` filter reads `value._trailing_anon`
   and emits the trailing `,` iff it matches the `sep` argument.

Result: `(0,)` roundtrips correctly.

#### Native render path (broken)

The native render entry point is `boundary.ts:73`:

```ts
return engine.render(JSON.stringify(node));
```

`JSON.stringify(node)` serialises `NodeData` — but `_trailing_anon` is
attached as a property on a `string[]` (a rendered intermediate), not on
the `NodeData` itself. It is invisible to `JSON.stringify`. The Rust side
receives a clean `NodeData` with no trailing-anon signal.

Inside `build_template_context` (`sittir-core/src/prepare.rs:232–273`),
the Rust code scans `$children` for the immediately-adjacent anon token
BEFORE/AFTER the first/last NAMED child in `$children`. This works for
`children`-slot templates (e.g. `arguments.jinja`, `parameters.jinja`)
because those kinds store everything in `$children`. It FAILS for
`tuple_expression` because its elements are in `$fields['elements']`, not
in `$children` — so the Rust `trailing_anon` scan sees no named children
and sets `trailing_anon = None`.

The `TupleExpressionTemplate.elements_list` is populated from
`ctx.fields_list["elements"]`, which is correctly filled. But
`joinWithTrailing(",")` on that list calls `flank_match(values, "trailing_anon", ",")`,
which returns `false` (the values bag only carries `ctx.trailing_anon`, which
is `None`). The trailing `,` is dropped.

#### Why this is architectural

The current detection is not a bug in a narrow function — it is a symptom of
a design mismatch:

- The trailing separator is a **fact about the parsed source** (did the
  author write a trailing comma?).
- That fact is currently derived at **render time** via a span-scan of the
  live NodeData — a second derivation of information that the parse already
  captured.
- The derivation runs only in the TS render path; the native path has no
  access to `$span` on field children (it only exposes `$text` and `$type`
  on `FieldValue` entries through the NodeData JSON contract).
- As a result, two render backends share the same template but can only agree
  on trailing-separator behavior if the fact is **in the NodeData** — not
  derived from it.

The fix is to make the trailing-separator presence a **first-class field on
the parent NodeData**, not a render-time side-channel property on a rendered
intermediate.

---

## The Architectural Fix: Synthesized Fields

### Core principle

A trailing (or leading) separator token observed in the parsed source becomes
a **synthesized sibling field** on the parent kind's `$fields`, derived at
parse time (or at enrich/override time, before codegen) rather than at render
time.

For `tuple_expression` the synthesized field would be named `elements_trailing`
(following the convention `<fieldname>_trailing`). When the source `(0,)` is
read:

```ts
// Before fix — NodeData from readTreeNode:
{
  $type: 'tuple_expression',
  $fields: {
    elements: [{ $type: 'integer_literal', $text: '0', ... }]
  },
  $children: [/* anon (, 0, ,, ) */]
}

// After fix — NodeData from readTreeNode:
{
  $type: 'tuple_expression',
  $fields: {
    elements:           [{ $type: 'integer_literal', $text: '0', ... }],
    elements_trailing:  { $type: ',', $named: false, $text: ',', $source: 'ts' }
  },
  $children: [/* unchanged */]
}
```

The synthesized field is:

- **Optional** — absent when the source has no trailing separator.
- **Typed as a leaf NodeData** — `$type` is the anonymous token kind (e.g.
  `','`), `$text` is the actual character, `$named: false`, `$source: 'ts'`.
- **Carried through JSON serialisation** — it is a normal `$fields` entry, so
  `JSON.stringify(node)` includes it. The native path reads it from
  `ctx.fields["elements_trailing"]`.

Templates reference the synthesized field with the standard `isPresent`
conditional — no special filter machinery:

```jinja
({% if attributes | isPresent %}{{ attributes | join("\n") }}{% endif %}{% if elements | isPresent %} {{ elements | join(",") }}{% if elements_trailing | isPresent %}{{ elements_trailing }}{% endif %}{% endif %})
```

Both TS (Nunjucks) and Rust (Askama) evaluate this template identically,
because `elements_trailing` is a plain field name in both contexts.

### Why not keep `joinWithTrailing` + fix the native path?

Option A (current state extended): pass `elements_trailing` through the
`values` bag on the Rust side, similar to how `trailing_anon` works today.

Rejections:

1. **Still two derivation paths.** The TS side would compute
   `detectTrailingAnonForField` and stuff it into `NodeData.$fields`; the
   Rust side reads from `fields_list`. Any consumer of the NodeData (factory,
   from.ts, wrap getter, test) would still need the special values-bag path to
   know whether a trailing separator was present.

2. **Not factored into the data model.** Factory and wrap surfaces can't
   express "this node has a trailing comma" as a typed field getter/setter if
   the information lives in a render side-channel.

3. **Violates DRY — one source, one derivation.** Two derivations (TS render
   scan + Rust values bag) of the same fact (trailing separator presence)
   will drift. They have already drifted (commit `5eb15d07` added the TS
   scan; the Rust side was left unchanged).

---

## Synthesis Paths

There are three places in the pipeline where the synthesized field can be
introduced. They are not mutually exclusive; the recommended approach is a
hybrid.

### Path 1 — Override DSL (`trailing()` / `leading()` helpers)

The override DSL (`packages/<lang>/overrides.ts`) patches grammar rules before
`tree-sitter generate` (per memory `feedback_enrich_post_evaluation_only.md`).
A new DSL helper declares the synthesized field explicitly:

```ts
// packages/rust/overrides.ts
overrideKind("tuple_expression", (rule) =>
	rule.patch(
		seq(
			"(",
			field("attributes", repeat($.attribute)),
			field(
				"elements",
				repeat($.expression, { sep: ",", trailing: trailing("elements_trailing") }),
			),
			")",
		),
	),
);
```

The `trailing('elements_trailing')` call:

1. Records a `TrailingMeta` annotation on the repeat: `{ synthesizedField: 'elements_trailing', sep: ',' }`.
2. When codegen emits the override into `grammar.js`, it replaces the
   anonymous trailing `,` token with a named hidden rule
   `_elements_trailing` aliased to the actual `,` literal — so tree-sitter
   generates a parse table that exposes the trailing token as a named field.
3. `readTreeNode` / `readNode` populates `$fields['elements_trailing']` from
   the named field — no span-scan needed.

**Pros:** explicit, under user control, zero-heuristic at read time.

**Cons:** requires grammar.js patching via the override DSL (adds boilerplate
per kind). Cannot be auto-applied — each kind must opt in.

### Path 2 — Enrich pass auto-detection (suggest only)

The enrich pass operates on post-evaluation Rule-objects (per
`feedback_enrich_post_evaluation_only.md`). It can detect
`repeat(..., trailing: true)` shapes and:

1. Emit a warning/suggestion in `overrides.suggested.ts`:
   ```ts
   // SUGGESTED: field 'elements' has trailing:true repeat — declare
   // trailing('elements_trailing') in overrides.ts to synthesize the field.
   ```
2. NOT auto-promote (because enrich's mutations don't reach the parser).

This is a hint that drives Path 1 adoption, not a standalone fix.

### Path 3 — Hybrid (recommended)

- **Enrich** auto-detects `repeat({ trailing: true })` shapes and emits
  suggestions into `overrides.suggested.ts`.
- **Override DSL** is extended with `trailing()` / `leading()` helpers; users
  opt in per kind.
- **Codegen** emits the synthesized field name into the `JinjaTranslateMeta`
  so the template emitter references `elements_trailing` explicitly — no
  `joinWithTrailing` filter needed.

---

## NodeData Shape Change

### Synthesized field shape

```ts
interface SynthesizedAnonField {
	$type: string; // the anon token kind, e.g. ',' or ';'
	$named: false; // always false — it's an anonymous token
	$text: string; // actual text, e.g. ',' or ';'
	$source: "ts"; // set by readTreeNode
	$span?: ByteRange; // present when readTreeNode captures it
}
```

The field lives in `$fields` under the synthesized name (`elements_trailing`)
alongside the normal named fields. `isPresent` returns `true` iff the field
exists and is non-null.

### Factory surface

Factory input accepts the synthesized field as an optional key:

```ts
ir.tupleExpression({
	elements: [ir.integerLiteral({ value: "0" })],
	elements_trailing: ",", // string shorthand, resolved to leaf NodeData by from()
});
```

If `elements_trailing` is absent, the factory produces a NodeData without the
field. Render emits no trailing separator (correct: factory-constructed nodes
represent the author's intent explicitly).

### Wrap getter

```ts
node.elements_trailing; // → NodeData | undefined (drills into $fields)
```

### Wrap setter (post Task #43)

```ts
node.elements_trailing(","); // → new wrapped node with trailing comma
node.elements_trailing(undefined); // → new wrapped node without trailing comma
```

---

## Template Emission

### Option A — Explicit `isPresent` conditional (recommended)

```jinja
{{ elements | join(",") }}{% if elements_trailing | isPresent %}{{ elements_trailing }}{% endif %}
```

**Pros:**

- Uses only the intersection-safe `isPresent` primitive (parity-verified on
  both Nunjucks and Askama — per `project_jinja_intersection_safe_primitives.md`).
- Template intent is self-documenting.
- No special filter knowledge required.
- Identical rendering on both backends by construction.

**Cons:**

- Slightly more template verbosity.

### Option B — New `joinWith(sep, trailing_field)` filter

```jinja
{{ elements | joinWith(",", elements_trailing) }}
```

A filter that receives the trailing field value directly as an argument:
`joinWith(sep, trailingValue)` = `elements.join(sep) + (trailingValue ?? '')`.

**Pros:** compact.

**Cons:**

- Requires registering a new filter in both Nunjucks (TS) and Askama (Rust).
- Filter receives a rendered `string` value, not a boolean — the filter must
  define how `''` vs non-empty string is treated.
- Adds one more divergence point between engines to maintain.
- Not meaningfully more readable than Option A once `isPresent` is familiar.

**Decision: use Option A.** Favours zero-new-filter surface over compactness.

---

## Render-Side Simplification (Deletion Plan)

After synthesis lands and all affected kinds are opted in, the following
machinery becomes dead code and should be deleted:

### `packages/core/src/render.ts`

| Symbol                                                  | Line range               | Reason for deletion                                    |
| ------------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| `FlankedChildArray` interface                           | ~160                     | Side-channel no longer needed                          |
| `MutableFlankedChildArray` type                         | ~171                     | Side-channel no longer needed                          |
| `detectTrailingAnonForField()`                          | 748–796                  | Replaced by synthesized field                          |
| `flankSepForField()`                                    | 682–734                  | No longer called (was for `joinByTrailing` rules path) |
| `flankSep()`                                            | 798–809                  | No longer called (was for `$children`-slot trailing)   |
| `_trailing_anon` / `_leading_anon` property assignments | ~1005, ~1011, ~1051–1052 | Side-channel no longer populated                       |
| `joinByTrailing` / `joinByLeading` rule-object checks   | ~328–329, ~391–392       | Path superseded                                        |

Note: `flankSepForField` and `flankSep` are kept until **all** templates
using `joinByTrailing` / `joinByLeading` rule-object keys are migrated to
synthesized fields (some existing Jinja templates that use `children`-slot
trailing may still need them during transition — see Migration Plan).

### `rust/crates/sittir-core/src/filters.rs`

| Symbol               | Reason for deletion                   |
| -------------------- | ------------------------------------- |
| `joinWithTrailing()` | Replaced by Option-A template pattern |
| `joinWithLeading()`  | Replaced by Option-A template pattern |
| `joinWithFlanks()`   | Replaced by Option-A template pattern |
| `flank_match()`      | No longer needed                      |

### `rust/crates/sittir-core/src/prepare.rs`

| Symbol / field                   | Reason for deletion                                              |
| -------------------------------- | ---------------------------------------------------------------- |
| `TemplateContext::trailing_anon` | Synthesized field in NodeData replaces it                        |
| `TemplateContext::leading_anon`  | Symmetric                                                        |
| `TemplateContext::trailing_sep`  | Legacy positional — can go after template migration              |
| `TemplateContext::leading_sep`   | Symmetric                                                        |
| `FlankValues` newtype            | Bridges `trailing_anon` / `leading_anon` to askama Values — gone |
| `TemplateContext::as_values()`   | Returns `FlankValues` — gone                                     |
| `flank capture logic`            | Lines 240–270 in prepare.rs — gone                               |

### `packages/codegen/src/compiler/node-map.ts`

| Symbol                              | Reason for deletion                                                 |
| ----------------------------------- | ------------------------------------------------------------------- |
| `JinjaTranslateMeta.joinByTrailing` | Rule-level flag replaced by per-field synthesized field             |
| `JinjaTranslateMeta.joinByLeading`  | Symmetric                                                           |
| `JinjaTranslateMeta.trailingFields` | Set replaced by synthesized field name emitted directly             |
| `JinjaTranslateMeta.leadingFields`  | Symmetric                                                           |
| `filterForFlanks()`                 | Filter-selection logic replaced by explicit `isPresent` conditional |

### `packages/codegen/src/compiler/template-walker.ts`

| Symbol                                  | Reason for deletion                                 |
| --------------------------------------- | --------------------------------------------------- |
| `findRepeatFlag()`                      | No longer drives template filter selection          |
| `findFieldsWithRepeatFlag()`            | No longer drives `trailingFields` / `leadingFields` |
| `collectFieldsWithRepeatFlag()`         | Private helper — goes with the above                |
| Imports of the above from `node-map.ts` | Three imports at lines ~40–41                       |

### Templates (all grammars)

Any `.jinja` template using `joinWithTrailing` / `joinWithLeading` /
`joinWithFlanks` is regenerated by the codegen pipeline once the emitter
switches to the Option-A pattern. Do NOT hand-edit templates.

---

## Factory + Wrap Surface

### Factory (construction path)

Factory input (`Config`) gains an optional key for each synthesized field:

```ts
// Before
interface TupleExpressionConfig {
	attributes?: readonly AttributeItem[];
	elements?: readonly Expression[];
}

// After
interface TupleExpressionConfig {
	attributes?: readonly AttributeItem[];
	elements?: readonly Expression[];
	elements_trailing?: string | LeafNodeData; // synthesized
}
```

The factory maps the synthesized key to `$fields['elements_trailing']`:

- If the input is a string, it is resolved to a minimal leaf `{ $type: ',', $named: false, $text: ',', $source: 'factory' }`.
- If absent, the field is omitted from `$fields`.

### `from.ts` (loose resolution)

`.from()` passes `elements_trailing` through like any optional leaf field —
no special branch needed. String → leaf resolution is handled by the standard
leaf-resolution path.

### `wrap.ts` (read path)

`readTreeNode` is driven by the grammar's field table. For kinds where the
override DSL declares `trailing('elements_trailing')`, the grammar emits the
trailing token as a named field; `readNode` populates
`$fields['elements_trailing']`. The per-kind `wrapTupleExpression()` function
exposes:

```ts
get elements_trailing() { return drillIn(data.$fields?.['elements_trailing'], tree); }
```

---

## Migration Plan

### Phase 1 — Override DSL helper + proof of concept (scope: `tuple_expression`)

1. Add `trailing()` / `leading()` DSL helpers to the override DSL
   (`packages/codegen/src/dsl/`).
2. Declare `trailing('elements_trailing')` in
   `packages/rust/overrides.ts` for `tuple_expression`.
3. Regenerate rust grammar package.
4. Update `tuple_expression.jinja` template (via codegen emitter, not hand-edit)
   to use Option-A pattern instead of `joinWithTrailing`.
5. Validate: `(0,)`, `(0, 1,)`, `(a, b, c,)` all roundtrip correctly on BOTH
   TS and native backends. Regression-checker must show no count drops.
6. Leave `joinWithTrailing` and all other side-channel machinery in place —
   the remaining 20+ templates that use it still need it.

**Acceptance signal:** parity tests show `tuple_expression` passing on native
with trailing comma; no TS regression.

### Phase 2 — Enrich auto-detection + suggested overrides

1. Extend the enrich pass to detect `repeat({ trailing: true })` shapes in any
   grammar's assembled Rule tree.
2. Emit synthesized-field suggestions into `overrides.suggested.ts` for each
   detected site.
3. Regenerate all three grammars. Review `overrides.suggested.ts` diffs.
4. Manually audit suggestions; opt in for each kind that the regression-checker
   confirms improves counts (prioritise rust > python > typescript by volume of
   failing fixtures).

**Acceptance signal:** `overrides.suggested.ts` for all three grammars contains
synthesized-field entries for every `repeat({ trailing: true })` site; no
existing tests regress.

### Phase 3 — Bulk opt-in + side-channel deletion

1. For every kind flagged in Phase 2 suggestions, add the `trailing()` /
   `leading()` override entry in the appropriate `overrides.ts`.
2. Regenerate all grammars.
3. Confirm the regression-checker shows net positive (or flat) counts across
   all validators.
4. Delete the render-side machinery listed in the Deletion Plan above (one
   diff for `render.ts`, one for `filters.rs`, one for `prepare.rs`, one for
   `node-map.ts` + `template-walker.ts`).
5. Run the full test suite. Any template still using `joinWithTrailing` at this
   point indicates a kind that was not opted in — surface as a generator
   warning, do not break the build.

**Acceptance signal:** `grep -r joinWithTrailing packages/*/templates/` returns
zero hits; all three grammar packages compile and pass the parity suite.

---

## Open Questions

The following require author decision before implementation begins:

### OQ-1 — Naming convention

Candidates:

| Convention             | Example                 | Notes                                                                                                                                 |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `<field>_trailing`     | `elements_trailing`     | Short; consistent with `_marker` suffix style; risk of collision with a grammar kind named `elements_trailing` (unlikely in practice) |
| `<field>_trailing_sep` | `elements_trailing_sep` | More explicit; longer                                                                                                                 |
| `trailing_<field>`     | `trailing_elements`     | Prefix form; harder to grep for all synthesized fields                                                                                |
| `<field>__trailing`    | `elements__trailing`    | Double-underscore as namespace separator; novel for the codebase                                                                      |

**Recommendation**: `<field>_trailing` — shortest, consistent with `_marker`.
User to confirm.

### OQ-2 — Synthesized field value: NodeData leaf vs bare string

Two choices for what `$fields['elements_trailing']` contains:

A. **Leaf NodeData** `{ $type: ',', $named: false, $text: ',', $source: 'ts' }`.

- Consistent with the existing NodeData data model — every `$fields` entry
  is a NodeData or array of NodeData.
- Template `{{ elements_trailing }}` passes through `renderChild()` which
  calls `$text` — emits `,`.
- Wrap getter returns a drillable NodeData.

B. **Bare string** `','`.

- Simpler; no wrapping.
- Inconsistent — `$fields` values would have mixed types (NodeData vs string).
- Template would need special handling for string values.

**Recommendation**: Leaf NodeData (Option A). Consistent with existing model.
User to confirm.

### OQ-3 — Leading separator: real grammar usage or YAGNI?

The spec covers leading separator symmetrically for completeness. But none of
the three grammars currently targeted (rust, python, typescript) appear to have
`repeat({ leading: true })` grammar rules at the tree-sitter level. Leading
separator patterns are more common in Haskell/Elm-style grammars (e.g., leading
commas in record syntax).

**Options:**

- Implement `leading()` DSL helper in Phase 1 alongside `trailing()` (small
  additional scope — symmetric code).
- Defer `leading()` to Phase 4 when a concrete grammar needs it (YAGNI).

**Recommendation**: Implement `leading()` in Phase 1 (the DSL helper is
symmetric; cost is low; the spec is written for it). User to confirm.

### OQ-4 — Interaction with `joinByField` / `joinBy` separator config

The existing `joinByField: { elements: ',' }` rule-object key and the
`joinBy: ','` key drive separator selection for the join filter. After the
synthesized-field migration, the per-element separator remains governed by
`joinByField` / `joinBy` (or by the template's explicit `join(",")` literal).
The synthesized field only carries the **trailing/leading occurrence** — the
separator character itself is already embedded in the template literal.

There is no overlap in responsibility. However, the codegen emitter currently
uses `joinByTrailing: true` (a boolean flag on the rule object) to indicate
"this kind's children have a trailing separator" — it then calls `flankSepForField`
at render time to determine the actual separator character. After migration, the
codegen emitter should no longer emit `joinByTrailing`; instead it emits the
synthesized field name into the template directly. The `joinBy` separator config
(for inter-element separators) is unchanged.

User to confirm that `joinBy`-driven separator inference is not expected to
drive synthesized-field naming (i.e., the synthesized field name is declared
explicitly in the override DSL, not inferred from `joinBy`).

---

## Touch Surface Summary

Every file / function that interacts with the trailing/leading mechanism
today, grouped by action required:

### Delete (Phase 3)

- `packages/core/src/render.ts` — `detectTrailingAnonForField`, `flankSepForField`, `flankSep`, `FlankedChildArray`, `MutableFlankedChildArray`, `_trailing_anon` / `_leading_anon` assignments, `joinByTrailing` / `joinByLeading` rule-object checks
- `rust/crates/sittir-core/src/filters.rs` — `joinWithTrailing`, `joinWithLeading`, `joinWithFlanks`, `flank_match`
- `rust/crates/sittir-core/src/prepare.rs` — `TemplateContext::trailing_anon`, `TemplateContext::leading_anon`, `TemplateContext::trailing_sep`, `TemplateContext::leading_sep`, `FlankValues`, `TemplateContext::as_values()`, flank-capture logic
- `packages/codegen/src/compiler/node-map.ts` — `JinjaTranslateMeta.joinByTrailing`, `JinjaTranslateMeta.joinByLeading`, `JinjaTranslateMeta.trailingFields`, `JinjaTranslateMeta.leadingFields`, `filterForFlanks()`
- `packages/codegen/src/compiler/template-walker.ts` — `findRepeatFlag`, `findFieldsWithRepeatFlag`, `collectFieldsWithRepeatFlag`
- `packages/rust/rust-render/src/templates.rs` — `TemplateContext.trailing_sep`, `TemplateContext.leading_sep` fields on every per-kind struct (codegen regenerates this file)
- `packages/rust/src/boundary.ts` — no change, but the TS render path no longer populates `_trailing_anon` side-channel

### Modify (Phase 1 + 2)

- `packages/codegen/src/dsl/` — add `trailing()` / `leading()` DSL helpers
- `packages/codegen/src/compiler/enrich.ts` — detect `repeat({ trailing: true })` and emit suggestions
- `packages/codegen/src/emitters/templates.ts` — emit `{% if <field>_trailing | isPresent %}{{ <field>_trailing }}{% endif %}` instead of `joinWithTrailing` filter
- `packages/rust/overrides.ts` — opt in for each `tuple_expression` (Phase 1) and bulk (Phase 3)
- Generated grammar packages (`factories.ts`, `types.ts`, `wrap.ts`, `templates/*.jinja`) — regenerated output; never hand-edited

### Unchanged

- `packages/core/src/readNode.ts` — reads `$fields` by name; synthesized field arrives as a normal named field from the grammar
- `packages/core/src/templates/nunjucks-env.ts` — `joinWithTrailing` registration can be removed in Phase 3; `isPresent` is already registered and sufficient
- `packages/<lang>/src/from.ts` — synthesized field is an optional leaf; standard leaf-resolution path covers it
- Factory test fixtures — synthesized field adds an optional slot; existing passing tests continue to pass because the field is optional

---

## Requirements

### Functional Requirements

- **FR-001**: After Phase 1 lands, `tuple_expression` with a trailing comma MUST render identically (`(0,)`, `(0, 1, 2,)`) on both `SITTIR_BACKEND=typescript` and `SITTIR_BACKEND=native`. Verified by parity test suite.
- **FR-002**: The synthesized field MUST be present in `$fields` on NodeData produced by `readTreeNode` when the source contains a trailing separator, and MUST be absent when the source does not. Verified by a unit test in `packages/rust/src/wrap.test.ts` (or equivalent per grammar).
- **FR-003**: Factory-constructed `tupleExpression({elements: [...], elements_trailing: ','})` MUST render the trailing comma. Factory-constructed `tupleExpression({elements: [...]})` (no trailing key) MUST NOT render a trailing comma.
- **FR-004**: No existing passing test MAY regress at any phase boundary. The regression-checker (`specs/016-parity-regressions/baselines/`) is the ground truth.
- **FR-005**: The side-channel machinery (`detectTrailingAnonForField`, `_trailing_anon`, `MutableFlankedChildArray`, `joinWithTrailing` / `joinWithLeading` / `joinWithFlanks` on both backends, `flank_match`, `FlankValues`, `TemplateContext::trailing_anon` / `leading_anon`) MUST be deleted in Phase 3. No new callers of these symbols may be introduced after Phase 1 begins.
- **FR-006**: The `trailing()` / `leading()` DSL helpers MUST be the ONLY mechanism for declaring synthesized trailing/leading fields. No render-time span-scanning or heuristic detection is permitted as a substitute.
- **FR-007**: Templates for kinds with synthesized trailing fields MUST use the Option-A `isPresent` conditional pattern. The `joinWithTrailing` filter MUST NOT be used for those kinds.

### Non-Functional Requirements

- **NF-001**: The synthesized field name MUST follow the `<field>_trailing` / `<field>_leading` convention (pending OQ-1 answer).
- **NF-002**: Synthesized field values MUST be leaf NodeData (pending OQ-2 answer), consistent with the existing NodeData data model.
- **NF-003**: The fix-the-generator principle applies — no hand-edits to generated files in `packages/<lang>/src/` or `packages/<lang>/templates/`.
- **NF-004**: No type-escape hatches (`as any`, `@ts-ignore`) may be introduced.
- **NF-005**: Every switch on the `Rule` discriminated union that is modified during this work MUST end with `assertNever(x)`.
