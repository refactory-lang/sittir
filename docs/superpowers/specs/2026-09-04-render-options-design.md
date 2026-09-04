# Render options — user defaults for real and virtual choices

**Status**: Approved design.
**Scope**: the three grammar packages, codegen, the native reader and renderer, the engine API.

## Problem

Every place output can legitimately vary is fixed today, in one of two ways.

- **Real choices** — alternatives the grammar itself distinguishes, such as a
  statement ending in `;` or an automatic semicolon, or a string delimited by
  double or single quotes — are forms. A caller either names the form or gets
  the arm the grammar config declares as default. There is no way to say "in
  this engine, bare statements get semicolons".
- **Virtual choices** — spellings the grammar cannot see because whitespace
  is an extra: `,` against `, `, statements on one line against one per line,
  the indentation unit — are literals baked into the emitted render code
  (`separator: ","`) and the templates (`join("")`).

Neither is addressable by a user. The engine's existing `format` record was
reserved for this (`slots`, `literals`) but never filled, and what it does
carry is applied as a post-process on the canonical string, which cannot
tell a separator comma from one inside a string literal.

## Decision

One `options` block, keyed by slot, valued by kind, covering both families.

```ts
const engine = createEngine({
  options: {
    // real choices — key: kind_slot, value: the form or literal kind
    expression_statement_terminator: 'semi',
    string_quote: 'single',
    impl_item_trait_clause: 'positive',

    // separated lists — key: the list kind
    arguments_elements: { separator: 'space', trailing: 'never' },

    // unseparated repeats — key: kind_slot
    statement_block_statements: { separator: 'newline' },

    // layout
    indent: '\t',
  },
});

engine.ir.expressionStatement({ expression });          // builds the `semi` form
engine.render(node);                                    // stamps, else options
engine.render(node, { options, reformat: true });       // per-call override
```

### The rules that generate the catalog

The `Options` interface is derived per grammar. Nothing is annotated by hand;
the grammar config only supplies names where a position has none.

1. **Every key names a slot.** A separated-list kind is its own key because
   the list *is* the slot's value. Every other key is `<kind>_<slot>`. A
   choice with no field at its position gets one in the grammar config
   (`terminator` on the statement kinds; a discriminating `quote` on both
   arms of `string`). Codegen refuses a root-level form split whose arms
   share no named discriminating slot; it never falls back to a kind-only
   key.
2. **Every value is a kind, spelled for the reader.** Form names for real
   choices (`'semi'`, `'automatic_semicolon'`, `'single'`) and the literal's
   kind for a pure-literal enum slot. For the render family the value is
   the whitespace class — `'tight'`, `'space'`, `'newline'` — because the
   separator token is fixed by the list; the catalog records which kind
   each class denotes (`comma` + `space` is `comma_space`). The public
   object uses names for ergonomics; the boundary maps each once to its
   `KindId`.
3. **Whitespace-bearing variants are kinds.** `comma_space`,
   `comma_newline`, `space`, `newline` (and `semicolon_space`,
   `semicolon_newline` where a grammar has `;`-separated lists) are
   registered as external tokens the scanner never emits, with their render
   text declared through `visibleExternals`. They receive parser-issued
   symbol ids, satisfy the every-kind-has-a-kindId invariant, appear in no
   rule, and are therefore never valid in any parse state. Python reuses
   its real `_newline`.
4. **`trailing` exists only where it is a choice.** A separated list gets
   `trailing: 'never' | 'always' | 'preserve'` only when the grammar's
   trailing flank is optional. Where the grammar forbids or mandates a
   trailing separator the key has no `trailing` member, so the type states
   what is choosable.
5. **Layout is one key.** `indent` is the indentation unit; it is the only
   tree-level fact that survives from the old format record besides
   `boundary`.
6. **Lexically required spaces are not options.** The space in `fn name` is
   the SpacingWriter's, decided by the word matcher, never by a user.

Internally each key has a generated dense index (`OPT_ARGUMENTS_ELEMENTS`,
`OPT_STATEMENT_BLOCK_STATEMENTS`); the emitted render function for a kind
names its indices statically. Field ids are not used.

## Where each tier takes effect

A real choice is in the catalog only when the grammar declares a default
for it (`arm.default` on the arm). A closed choice with no declared default
— an operator slot, say — is semantics, not preference, and gets no key.

### Construction tier

The generated coercer module is a factory over the real-choice half of
`Options`. Every tie-break that today reads the `arm.default` annotation
reads the configured arm instead. Module-level `ir` is the factory applied
to the grammar's declared defaults, which remain the grammar's own statement
of preference; `engine.ir` is the factory applied to the engine's options
over them. Two engines with different options coexist; nothing is global.
Strict factories are untouched: a strict call names its form.

A parsed node carries its form as its kind and its enum slots as literal
kinds, so it is never re-formed by options, and `reformat` does not touch
this tier: changing a parsed statement's terminator is a transform, not
formatting.

### Read side

The native reader stamps, per occurrence, which separator kind sat between
two list elements and which join sat between two repeat elements, by
classifying the bytes in the gap: no bytes is tight, spaces or tabs are the
`_space` kind, anything containing a line break is the `_newline` kind.
Comments in the gap are trivia already and do not affect the class. The
stamps live in the list's existing `_separator_kind` slot, which becomes a
per-occurrence array, and in a parallel slot on repeats. Mixed spellings in
one list are kept as they are; the stamps are facts, not a consensus.

`extract_format` keeps producing `indent` by consensus over line starts.
Its reserved `slots` and `literals` members are removed; this design is
what they were reserved for.

### Render side

`render_transport_dispatch` and every emitted `render_<kind>` take
`&Options`. At the view construction that today writes `separator: ","` the
value becomes the occurrence's stamp unless `reformat` is set, else
`options[OPT_*]`, mapped to the kind's render text. `trailing` applies the
same way: `preserve` reads the occurrence's flank stamp, `always` and
`never` override it. Unseparated repeats stop being `join("")` in templates
and become the same list view with an options-driven separator, so every
list renders through one path. Templates change nowhere else; the askama
pipeline stays.

A `newline` join writes the line break and then the current indentation
unit repeated to the nesting depth the writer tracks from the block kinds it
has entered.

### Precedence

For any slot the render tier owns:

```
per-call options with reformat  >  the occurrence's stamp  >  engine options  >  grammar default
```

Without `reformat`, per-call options behave like engine options: they fill
unstamped slots only, which is what splicing a built node into a parsed file
needs. A tree handle offers `options()` returning the majority stamp per
key, so a caller who wants new nodes to follow the file passes that as the
per-call options.

This inverts one existing behaviour: the engine-level format record used to
outrank a tree's inferred format. Under this design the node's own stamps
outrank engine options, and only an explicit `reformat` overrides them.

## Engine and boundary API

- `EngineOptions.options?: Options` — the generated per-grammar interface,
  every key optional, every value a closed literal union.
- `EngineOptions.format` narrows to `boundary`.
- `engine.ir` — the coercer surface with the engine's real-choice defaults.
- `render(node, { options?, reformat? })` on engines and tree handles.
- `tree.options()` — majority stamps per key for a parsed tree.
- Native: `SittirEngine` takes the resolved option table once at
  construction as a flat id array indexed by the generated key order, plus
  `indent`; per-call options travel the same way. No strings cross napi.

## Verification

- **Whitespace round-trip inside lists and repeats**: read then render with
  no options and no `reformat` reproduces every separated-list and repeat
  region byte-for-byte. A validator metric beside the existing fifteen, with
  a per-grammar floor that only rises.
- **Scanner inertness**: parsing the corpus with the extended externals
  table yields byte-identical CSTs to the unextended parser.
- **Catalog snapshots**: per grammar, the key table (name, kind, index,
  allowed values), and a type-level test assigning one valid and one invalid
  literal per key.
- **Behaviour**: a built node takes engine options; a parsed node keeps its
  stamps; `reformat` rewrites separators and never a parsed form;
  `engine.ir` picks the configured form while module `ir` picks the
  grammar's default; per-call options without `reformat` fill only unstamped
  slots; `trailing` is present exactly where the flank is optional.
- Every existing gate stays identical: validator history compared
  numerically, the codegen suite at its baseline, package suites green,
  examples rendering the same bytes.

## Out of scope

- Retiring askama in favour of emitted Rust render bodies. Separators are
  already built in emitted Rust, so this design does not depend on it; the
  static-spacing plan remains the reason to do it.
- Any change to lexically required spacing.
- Transforming a parsed node's form. That is an edit, expressed through
  `$with` or a rebuild, not an option.
