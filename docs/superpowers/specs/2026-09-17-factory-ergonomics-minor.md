# Factory ergonomics — minor enhancements

**Status:** Design. Collects the small construction-surface items that the
loose-surface contract (`docs/factory-surface-issues.md`, "The contract")
pushed outside itself: each is a declaration or a signature convention on
both surfaces, not a coercion. Each item stands alone; they share this page
because none is large enough for its own.

---

## 1. A visible wrapper seats on its parent

### Problem

`match_arm.pattern` holds `match_pattern`, a wrapper whose own `pattern`
slot admits the nineteen members of `_pattern` and whose `condition` is
optional. A caller who already knows the inner kind spells the wrapper by
hand on both surfaces:

```ts
ir.matchArm({ pattern: { pattern: { kind: 'struct_pattern', … } }, value })   // today
ir.matchArm({ pattern: { kind: 'struct_pattern', … }, value })                 // rejected
```

This is not a coercion gap. The value is already kind-identified and the
slot has one kind, so no rule of the loose contract applies; and the wrapper
is not `forwarded` — it has two slots, and its required one targets a hidden
supertype with no factory — so the strict factory's target overload does not
reach it either.

### Decision

The wrapper is **spliced onto its parent**: `match_pattern`'s keys become
`match_arm`'s keys, exactly as a hoisted group's do (group seating, shape 2),
and the mount route builds the wrapper.

```ts
ir.matchArm({ pattern: { kind: 'struct_pattern', … }, condition, value })
ir.matchArm.strict({ pattern: ir.structPattern.strict(…), value })
```

With the seat in place every rule of the loose contract applies at the
parent: `pattern: { kind: … }` is rule 3 against `_pattern`; a bare string
there hoists into `_pattern`'s declared default arm (rule 6); `condition`
rides along as an optional key. `last_match_arm` seats the same wrapper the
same way.

The seat is declared, never inferred: the grammar file names the wrapper
as spliced at that slot with `splice()`, which stamps `annotations.spliced` on
the reference the way `group()` stamps `annotations.hoisted` on a hidden group.
The stamp is on the reference, not the kind, so the kind stays visible and
keeps its own factory. What
this admits for the first time is a splice seat on a **visible** child
that is not a choice arm — today a visible child is merge-seated only
through `variant()` on a choice position (`ir.closureExpression.block`),
and every spliced group is sittir-minted and hidden. The node stays in the
tree and in the wrap; only the surface flattens. The read side's
projection (`nodeToConfig`) follows the seat as it does for a group.

### Verification

- `ir.matchArm({ pattern: { kind: 'struct_pattern', … }, value })` and its
  strict spelling build and render `T{a}=>{}`; the hand-spelled wrapper
  form still builds (the wrapper's own factory is untouched).
- `ir-render-parse` stays clean on rust; `factory-render-parse` unchanged.
- The generated rebuild of `examples/17-dogfood-rust.ts` spells its arms
  without the inner `pattern:` key.
- `node-model.json5` records the seat as `splice` on both parents.

---

## 2. A list slot takes its elements bare, one or many

### Problem

A separated-list wrapper is called `(options?, ...elements)`: the options
object first, the elements a spread. On the loose surface that shape does
not reach a parent's config: a list-envelope slot wants the built envelope,
and an array given there was, until the loose contract's rule 4, stored as
its first text. A single element still has to be wrapped in an array or
built by hand:

```ts
ir.genericType({ type: 'Vec', typeArguments: ['Edit'] })     // rule 4: builds the envelope
ir.genericType({ type: 'Vec', typeArguments: 'Edit' })       // rejected
ir.enumVariant({ name: 'V', body: ir.fieldDeclaration(…) })  // rejected
```

### Decision

**The options object stays first, and it is optional.** First, so the
elements remain a rest parameter and a spread; optional, because every
default a list needs — delimiter, separator — is declared in the grammar's
`options:` block and stamped by the factory when the caller gives none
(`declaredDelimiterDefault`). A trailing options object is not a spelling:
it would end the spread, and the position would carry no information the
grammar does not already hold.

**Because the options object is optional, a list slot's elements hoist to
the parent's config as `T | T[]`.** In a loose config, the value at a
list-envelope slot is one of:

- an **array** — the elements, one envelope entry per item, each coerced
  recursively (rule 4 as it stands);
- a **single non-array value** — one element, the same as `[value]`;
- the **built envelope** — passes through.

An object at a list slot is one element's config, never the envelope's:
an envelope has no config form (strict row S1), so there is nothing to
confuse it with. The runtime is the existing `_wrapArray`; the single case
is `_wrapArray(kind, [value])`. The loose `Config` type's slot admits the
union, and the strict wrapper's signature is unchanged.

### Verification

- `typeArguments: 'Edit'`, `typeArguments: ['Edit']` and
  `typeArguments: ir.typeArguments.strict(…)` build the same node and
  render `<Edit>`; `body: ir.fieldDeclaration(…)` builds the field list.
- A type-level test pins the loose slot type as `T | T[] | Envelope` for a
  list-envelope slot and rejects a trailing options object on the wrapper.
- `examples/17-dogfood-rust.ts` spells its single-element lists bare.
- `factory-render-parse` counts unchanged.

---

## 3. A delimited leaf takes its content; the delimiters are its render rule

> Generalized by `2026-09-17-token-interior-slots.md`: a token's interior is
> its slot structure, named groups are fields inside a regex, and `renderAs`
> keeps to external symbols. This item is that design's first application;
> the text below is its original statement.

### Problem

A text leaf's factory takes the token's whole text. Where the token always
carries a fixed affix, the caller supplies it and the factory at most tests
the result against the pattern — under `SITTIR_DEBUG` only, and not at all
for a `token(seq(…))` kind:

```ts
ir.charLiteral("'a'")   // → 'a'
ir.charLiteral('a')     // → a — no guard, invalid output
ir.shebang('#!/usr/bin/env rust-script\n')
```

The delimiter is not information the caller holds; it is the kind. Rust
already models it that way where the grammar does: `lifetime` is
`seq("'", identifier)`, so `ir.lifetime('a')` takes the name, and a line
comment's `//` marker is a `renderAs` external beside a content leaf.

### Decision

**A leaf whose token carries a fixed affix takes its content, and the affix
is the kind's render rule.** The kind's sittir-side body is declared through
`renderAs`, today keyed to external symbols and extended here to any token or
pattern kind whose sittir-side shape differs from the parser's:

```ts
renderAs: ($) => ({
	char_literal: seq("'", /(?:[^\\']|\\.)+/, "'"),
	shebang: seq('#!', /[^\n]*/, '\n'),
	metavariable: seq('$', /[a-zA-Z_]\w*/),
})
```

The parser keeps its token; the model sees one text slot between literal
affixes, so every consumer follows: the factory takes the content
(`ir.charLiteral('a')`), the render writes the affixes around it, the guard
tests the content pattern, and the reader strips the affixes by the same
rule so `$text` of a read node is its content. The round trip is
byte-identical; what changes is the value a caller gives and gets.

Content is the body as written in source: an escape stays escaped (`\n` is
two characters). Formatting is the affixes and nothing else.

**Two transports, one fact.** A read node of a delimited leaf is a
coordinate until it is edited: untouched, it renders by folding its span,
affixes and all (`VerbatimTransport`); a factory-built or edited node renders
through the kind's typed transport, which holds content and writes the
affixes from the rule. The two agree only if the reader strips exactly the
literals the render rule writes — the one `renderAs` declaration, read by
both. What follows from that:

- `$text` of a read node is content. The wrap accessor, `nodeToConfig`,
  `materializeWrappedNodeData` and the strict-rebuild emitter all see
  content and never hand an affixed string to the typed transport, where the
  affixes would double.
- A `$with` setter or `markEdited` detaches the coordinate; from then on
  the typed transport renders the node from its content.
- The Verbatim arm is never built from a factory node (it has no
  coordinate), and the typed arm is never fed a read node's whole text.
  Slot transport enums already carry a Verbatim arm beside the typed leaf
  arm for text kinds; a delimited leaf is that same pair, with the strip
  on the read side.
- The reader's text-capture classification gains one case beside
  verbatim-whole (an identifier) and structured: content-with-affixes,
  stripped on read from the same affix literals.

**Where it applies, and where not.**

| shape | example | what it is |
| --- | --- | --- |
| fixed prefix and/or suffix | rust `char_literal` `'…'`, `shebang` `#!…`, `metavariable` `$…`; typescript `hash_bang_line`, `private_property_identifier` `#…`; python `comment` `#…`; every `escape_sequence` `\…` | a render rule, this item |
| optional prefix | rust `char_literal`'s `b'…'` | a presence flag beside the content (`{ byte: true }`), as any optional keyword |
| a choice of delimiters | typescript `comment` (`//…` or `/*…*/`), python string prefixes | forms — `ir.comment.line(text)` / `.block(text)` — or left as text |
| no affix | identifiers, numbers, string fragments | content is the text; unchanged |

The census is `.sittir/src/grammar.json`: a `token(seq(…))` whose first or
last member is a string, or a pattern whose regex opens on a literal. Nine
kinds across the three grammars today.

### Verification

- `ir.charLiteral('a')` renders `'a'`; a read `'a'` has `$text` `a`; the
  rebuild of a char literal is byte-identical. Same for each kind in the
  table's first row.
- The content guard rejects `ir.charLiteral("'a'")` by name.
- `read-render-parse` and `factory-render-parse` counts unchanged; the byte
  axis stays green.
- `renderAs` has one glossary entry describing both uses, external symbols
  and delimited leaves.
