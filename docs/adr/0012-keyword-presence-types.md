# ADR 0012 — Keyword-presence types: boolean keywords and bitflag modifier sets

**Status**: Proposed
**Date**: 2026-04-21
**Related**: ADR-0008 (declarative transforms + `$`-prefix NodeData), ADR-0010 (auto-stamp single-literal fields; `refine()`), ADR-0011 (per-value multiplicity). Reference spec: `sittir-bitflag-spec.md`.

## Context

Several grammar positions encode **keyword presence** — the lexical intent is a
boolean (is this keyword present?) or a set (which of these keywords are
present?), but the grammar models both as node-producing fields. Two shapes
show up repeatedly across all three grammars sittir generates:

- **`optional(string)`** — `optional('mut')`, `optional('export')`, etc. The
  field is structurally either "the keyword node exists" or "absent." There
  is only ever one possible value.

- **`repeat(choice-of-strings)`** / `repeat1(choice-of-strings)` — Rust's
  `function_modifiers: repeat1(choice('async','unsafe','const','extern','default'))`,
  TypeScript's class/member modifier lists, Python's single-value `async` head
  (a degenerate case). Order within the source text is conventional, not
  syntactic; duplicates are invalid. The language intent is a set.

Today, sittir faithfully reflects the grammar: a boolean keyword becomes a
field accepting a keyword node, a bitflag becomes a container with child
nodes. The factory surface forces consumers to re-express lexical noise as
structural node construction:

```ts
// Boolean keyword today — caller must construct a node to say "mutable"
ir.selfParameter({ mutableSpecifier: mutableSpecifier() });

// Bitflag today — caller constructs individual keyword nodes, passes as
// array; the container factory forwards them; the render engine
// concatenates. Duplicates slip through, order is the caller's problem.
ir.functionModifiers(externModifier());
```

Post-ADR-0010, the single-literal auto-stamp rule already removes the
ceremony for `'break'` / `'return'` when the parent factory knows the
constant. It doesn't fire for `optional(string)` (because the field is
optional — user controls presence) nor for `repeat(choice-of-strings)`
(because each child node in the array is still independently
constructable). Both remaining patterns need their own factory-surface
treatment.

A three-row taxonomy captures what the factory surface should accept:

| Pattern                          | Values | Factory type          | Example                              |
| -------------------------------- | ------ | --------------------- | ------------------------------------ |
| `optional(string)`               | 1      | `boolean`             | `mut?: true`                         |
| `optional(enum)` / `enum`        | 2+     | string literal union  | `visibility?: 'pub' \| 'pub(crate)'` |
| `repeat(enum)` / `repeat1(enum)` | 2+     | `number` (bitwise OR) | `modifiers: Mod.Async \| Mod.Unsafe` |

The middle row (string literal union) is already emitted correctly today —
that's the existing `enum` classification flowing through auto-stamp when
narrowed to one value, or through `fieldTypeComponents` as a union. This
ADR adds the top row (boolean) and the bottom row (bitflag).

## Forcing Constraint

> Generated factory APIs should match the language's lexical intent, not
> tree-sitter's parse shape. A caller writes `mut: true` because the
> language calls it "mutable"; they should not construct a node to say so.

## Alternatives Considered

- **Boolean/bitflag as authorable overrides, not auto-detected.** Require
  the grammar author to annotate every position that should surface as a
  boolean or bitflag. Rejected: the structural signature is unambiguous
  (`optional(string)` means boolean; `repeat(pure-string-choice)` means
  bitflag — no false positives observed across all three grammars). Link
  already runs enum/supertype promotion from structural signatures without
  author annotation; this extends that same pattern.

- **Singleton-bitflag stays a bitflag.** Python's `repeat1(choice('async'))` —
  a repeat with exactly one value — would emit a one-bit bitflag. Consistent
  but overkill. Rejected: the degenerate case is semantically identical to
  `optional('async')` (duplicate `async` is invalid; the repeat count is
  either 0 or 1). Promote to `boolean_keyword` instead.

- **Render-time bitflag expansion.** Keep `repeat(enum)` as a container at
  the Rule / AssembledNode level, expand bits to child nodes only in the
  render engine. Rejected: the factory surface would still accept an array
  of keyword nodes — duplicates + ordering still on the caller. The whole
  point of the bitflag is to shift that responsibility to the library.

- **Symbol-safe bitflag.** Accept choices where some arms are symbol refs
  (not string literals) as bitflags-with-escape-hatches. Rejected: once an
  arm is a structured child, the set has mixed shapes; the boolean-OR
  abstraction stops holding. Detection correctly excludes these (see
  "What stays as-is" in the spec); they stay as container kinds.

## Decision

**Classification is derived, not stored.** No new Rule variants. Both
patterns are already unambiguously represented in `AssembledField.values`
(from ADR-0011) + per-value multiplicity:

- **Boolean keyword** — `values` has exactly one entry, the entry is a
  terminal (direct `TerminalValue` with a single string, OR a `NodeRef`
  to a hidden `_kw_*` kind that `resolveHiddenKeywordLiteral` maps to a
  single literal — the same helper that powers ADR-0010's auto-stamp
  inlining), and the multiplicity is `'optional'`.

- **Bitflag** — every entry in `values` is a literal-resolvable terminal
  (same terminal / hidden-`_kw_*` treatment), and the multiplicity is
  `'array'` or `'nonEmptyArray'`. Any non-literal NodeRef (a symbol
  pointing at a structural kind) disqualifies — that's a container, not
  a modifier set.

A shared helper in `emitters/shared.ts` exposes these as predicates +
accessors — `keywordPresenceKind(field, nodeMap)` returning
`'boolean' | 'bitflag' | null`, plus `boolean`-specific `keywordValue`
and `bitflag`-specific `keywordValues`. Placement in `shared.ts` mirrors
the existing `resolveEffectiveLiteral` / `resolveHiddenKeywordLiteral` /
`resolveHoistedForm` helpers — derivations on `AssembledField` that every
emitter consumes uniformly (per the ADR-0011 "one derivation" rule).

**Degenerate repeat-of-one-string** → classify as boolean, not one-bit
bitflag. Structural predicate falls out of the shared helper: if the
set of distinct literals has size 1 and the multiplicity is
`array`/`nonEmptyArray`, treat identically to `optional(single-literal)`.
The language can't say `async async fn`; a one-bit bitflag is ceremony.

**Emitters consume the classification, not new Rule shapes**:

- **Types emitter**: `mut?: boolean` for boolean-keyword fields;
  `modifiers?: FunctionMod` for bitflag fields, where `FunctionMod` is a
  **`const enum`** with power-of-two values and PascalCased members.

  Typed-bitflag representation choice rationale: TypeScript has no native
  bitflag type, and three candidate representations each fall short in
  different ways:
  - **Regular `enum`** — `Mod.Async | Mod.Unsafe` widens to `number`,
    losing type information at the aggregate site.
  - **`as const` object + `typeof Obj[keyof typeof Obj]` union** — the
    type is the literal-value union (`1 | 2 | 4 | …`); the OR result
    (`3`) isn't in the union, so the combination doesn't type-check.
  - **`const enum`** — TypeScript special-cases bitwise OR on `const
enum` members so `Mod.Async | Mod.Unsafe` stays typed as `Mod`.
    Keeps intellisense, preserves the brand through arbitrary OR
    combinations, no casts required.

  Sittir already emits `const enum` elsewhere (`SyntaxKind`), so the
  downstream tsconfig supports it. `FunctionMod` plugs into
  `fieldTypeComponents` ahead of the standard kind/literal union path.

- **Factory emitter**: boolean-keyword fields emit a construct/omit branch
  under the field's existing fluent setter. Bitflag fields emit a
  per-bit-`if` spread into the parent's children. Uses the existing
  `_fs`/`_fsm` fluent-setter helpers.

- **From emitter**: two new polymorphic helpers — `_resolveBooleanKeyword`
  (accepts `true`/`false`/`'mut'`/NodeData) and `_resolveBitflag` (accepts
  `number`/`'async'`/`['async','unsafe']`/NodeData).

- **Consts emitter**: per bitflag field, a `FunctionMod` / `ClassMod` /
  etc. const block with power-of-two values, member names from the
  ordered-unique keyword list.

NodeData output shape is unchanged. `{ mut: true }` still produces
`$fields.mutable_specifier = { $type: 'mutable_specifier', … }` — readNode
round-trip is byte-identical.

**Post-detection cleanup**: for modifier-container kinds (a kind whose
top-level rule's values all resolve to a single bitflag field — rust's
`function_modifiers`), skip factory/from/interface emission. The kind
still exists in SyntaxKind + KindMap for parse-tree compatibility
(readNode needs to dispatch on the parse-produced kind string), but no
authoring surface — callers use the bitflag field on the parent.

## Principles Applied

- **DRY (ADR-0011 first rule)** — one Link pass detects both patterns from
  the normalized Rule tree; no second derivation in emitters. Eliminates
  the existing `functionModifiers()` container factory + from resolver +
  `FunctionModifiers` interface (three parallel derivations of one fact).

- **Factory input matches language intent.** The factory surface is the
  authored-code API; it should read like the target language reads, not
  like tree-sitter's parse tree parses.

- **Detection is structural, not authorial.** Both patterns are
  unambiguous from the normalized Rule shape. The author doesn't have
  to annotate modifier positions in the override layer.

## Consequences

- **Enables**:
  - `ir.selfParameter({ mut: true })` and similar ergonomic boolean
    constructions across all grammars.
  - `ir.functionItem({ functionModifiers: FunctionMod.Async | FunctionMod.Unsafe })`
    — no array construction, no duplicate risk, no ordering responsibility.
  - Polymorphic input: `functionModifiers: ['async', 'unsafe']` /
    `'async'` / numeric-bitflag all resolve identically via `from`.
  - Removing container-kind codegen (`functionModifiers()` factory,
    `FunctionModifiers` interface, `functionModifiersFrom()` resolver) for
    every modifier-like kind — the container exists in the parse tree but
    doesn't need an authoring surface.

- **Costs**:
  - Two new Rule variants (`boolean_keyword`, `bitflag`) — every
    discriminated-union switch must handle them (required by ADR-0011's
    exhaustiveness rule).
  - Per-grammar `Mod` const tables in `consts.ts` (one per bitflag field
    or standalone bitflag kind). Small; order follows enum declaration.
  - Render-order question: bitflag unpacking emits keywords in
    enum-declaration order. For most grammars (Rust, TypeScript) modifier
    order is conventional but not syntactic. Must verify per grammar; at
    worst, surface a `modifierOrder` override knob.

- **Follow-ups**:
  - `role()` annotations on keyword values for non-obvious names — most
    modifier strings already ARE their canonical names so this is cosmetic.
  - Optional readNode integration: when readNode encounters a bitflag
    kind's parse output, pack the keyword children back into a `number`
    so round-trip `readNode → factory` skips intermediate NodeData
    reconstruction. Purely an optimization; correctness works today.

## Verification

- Codegen test suite passes (stability guard).
- Roundtrip corpus preserves baseline (rust rt 123/0, ts 81/27, py 98/16).
  Bitflag unpacking must produce the same children sequence as the
  original grammar expects.
- Per-grammar snapshot of `ir.functionItem({ functionModifiers: Mod.Async
| Mod.Unsafe })` → serialized source — must equal the hand-written
  `async unsafe fn …`. If the child-order is wrong, either the render
  template is wrong or enum-declaration order is the wrong canonical
  order; at that point, revisit "costs" above.

If the bitflag pattern shows up in a non-modifier context (e.g., a
choice-of-strings repeated in a value-position rather than a declaration
head) and the bit-OR abstraction doesn't fit the language's intent there,
this decision would need a scope narrowing — perhaps gating detection on
position (only top-of-rule modifier stacks) or requiring author opt-in.
No such case observed today; revisit if one appears.
