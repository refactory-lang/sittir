# Separated-List Options Struct — One Home for List Facts

**Status:** Realized (2026-08-21) — all slices landed on
`separated-list-options`: delimiter vocabulary + `_delimiter` bitflag +
`_separator`, spread + leading-options factories, realification of every
field-embedded delimiter-bearing list into its own separatedList kind
(rust `tuple_type`/`tuple_expression` extractions, python print-group
extractions, group-wrapped classification for `enum_body_elements` /
`expression_statement_tuple` / `print_chevron_arguments`), the
terminated-list single-element invariant, and deletion of the per-field
flank machinery (emitters, sittir-core anon matching, validator suffix
discovery).

A separated list's slot is its identity: kinds like `enum_body_elements`
exist to hold one element list, and every fact about that list (does a
trailing separator render? which separator token did this instance use?)
is a property of the list itself. Today those facts are stored as
name-mangled flat siblings in TWO spellings — kind-level
`_trailing_sep` / `_leading_sep` / `_separator_kind` on classified
separated lists, field-prefixed `_content_trailing_sep` on merged-union
lists and the per-field residual kinds — and the render side reassembles
them into a struct anyway (`ListNonterminalView { items, separator,
leading, trailing }` in sittir-core). Two wire spellings, one render
shape: the wire should store the struct.

## End state

Every separated-list slot carries at most one options value beside its
elements:

```
{ separator?: <kind id>, delimiter?: none | leading | trailing | both }
```

- **`separator` is stored only when dynamic.** A fixed literal separator
  is statically known and lives in template text (the same knowability
  ownership cut as the static-seam-resolution spec) — only a
  grammar-dynamic separator (`choice(',', ';')`) stores the captured
  kind id, replacing today's `_separator_kind` key.
- **`delimiter` covers only OPTIONAL flanks, as a bitflag**
  (`none = 0`, `leading = 1`, `trailing = 2`, `both = 3`). A mandatory
  flank is template text, never storage. The per-kind TYPE presents
  exactly the grammar-permitted subset: a trailing-only list types
  `none | trailing`; a list permitting neither flank omits the field
  entirely. Absent means `none` — the canonical minimal render — so the
  common factory call (`from({ content: [...] })`) stays exactly as
  ergonomic as today, and flank opt-in is explicit.
- **One spelling.** The struct replaces kind-level `_trailing_sep` /
  `_leading_sep` / `_separator_kind` AND the field-prefixed
  `_<field>_trailing_sep` / `_<field>_leading_sep` family — merged-union
  lists store the same struct as classified separated lists. Flanks can
  no longer be orphaned from their list by a consumer that reads only
  the elements key.
- **The delimiter belongs in the kind itself.** A delimiter-bearing
  separated list embedded in a field is realized as its own top-level
  separatedList rule (hidden rule + visible alias — the existing
  `*_elements` pattern), so the field holds a list NODE carrying the
  kind-level struct and no field-prefixed storage exists anywhere.
  Delimiter-less repeated fields stay bare arrays — there is nothing
  to store.
- **Wire shape = view shape.** `ListNonterminalView` is constructed
  from the struct directly; the flat-key reassembly and the validator's
  suffix discovery are deleted (`separatedListFactoryOptions` survives
  as a plain reader of the kind-level keys).

## Vocabulary

`delimiter` is the surface name and therefore the model name: the
existing `trailingMode` / `leadingMode` "flank" vocabulary renames with
it (one fact, one name). The grammar-side derivation is unchanged —
enrich/link still stamp which flanks the grammar permits; only the
stamped fact's spelling and storage shape move.

## What it absorbs

- `ki-perfield-flank-residual` retires as a distinct representation:
  the five per-field kinds realify into (or reclassify as) their own
  separatedList kinds carrying the kind-level struct. The rust tuple family
  (`(1,)`) is `delimiter: trailing` with one element — the
  single-element-requires-trailing rule is a validity invariant the
  factory asserts, not a storage shape (a conditional requirement is
  not expressible in the type).
- The trailing-sep honesty machinery from the merged-union fix
  (per-field capture and the render-side flank-mode threading) reduces
  to populating and reading one struct.

## Factory surface

Separated-list factories (and `from`) are **spread-based with leading
options**:

```
enumBodyElements(...elements)                          // delimiter: none
enumBodyElements({ delimiter: trailing }, ...elements) // opts lead
```

The options position is the FIRST argument, present only when opting
in — the common case stays a bare spread. A leading argument is
recognized as options by shape: a plain object with no `$type` whose
keys are a subset of the kind's permitted option keys (`separator`,
`delimiter`); anything else is the first element. Kinds whose elements
can themselves be plain config objects must still disambiguate through
that rule — an element config always carries `$type` or an
element-shaped key, so the subset test is decisive.

**Single-slot hoisting.** When the separated list is its parent's
single slot (the helper kind exists only to hold the list —
`enum_body` → `_enum_body_elements`), the spread-plus-leading-options
surface hoists to the parent factory: `enumBody({ delimiter: trailing },
...elements)`, with no helper-kind call in user code — the same
single-slot inlining rule the factory surface already applies to
hoisted groups, composing through chains of single-slot wrappers. The
options ride wherever the elements surface does; multi-slot parents
keep the list kind's own factory as the options home.

## Blast radius (why this is its own PR series)

The list-slot wire contract changes for every list slot in all three
grammars: wrap emission and `$with` setters, transport structs and
`FromNapiValue` decoders, the factory signatures above, the
render-module flank-mode maps, and the validator comparison metadata.
Gate per slice with the standard battery; floors move only where a
corpus row pins an intentional fidelity change.

## Non-goals

- Per-element separator possession (a list where EACH element records
  its own separator token) — nothing today needs it; the S3 family's
  needs are covered by `delimiter` + the length invariant.
- Changing which flanks a grammar permits — the struct stores state the
  grammar already allows; permission derivation is untouched.
