# Punctuation seam spacing — whitespace around non-separator tokens

Extends [Render options](2026-09-04-render-options-design.md), which
limited spacing preferences to list separators and array flanks, to the
seams around punctuation tokens: the space before an opening bracket, after
a closing one, around an operator. The mechanism is the one separators
already use; what is new is where the sites are, who owns them, and how two
sites that meet on one seam resolve.

## Problem

A render rule such as `seq('fn', name, '(', parameters, ')', body)` has
seams between its members that today get exactly the whitespace the lexer
requires and nothing else: `fn name(` always, never `fn name (`. The
bracket is a literal of the parent's rule, not a kind of its own, so a
kind-level preference cannot own it, and the separator sites do not reach
it because it separates nothing.

## Decision

### Sites

Every seam in a render rule whose left or right member is a punctuation
token gets a site on the token's side: `<token>_before` for the seam to the
token's left, `<token>_after` for the seam to its right. A punctuation
token is a literal whose text is not word-class under the grammar's
link-pinned word matcher; keywords are word-class and get no site, their
seams stay lexically decided. A token in a separator position keeps its
separator sites (`<token>_separator_space_before` / `_after`) and gets no
token seam site there. When two punctuation tokens are adjacent, both
sites exist on the one seam and the writer resolves them (see Coalescing).

A slot that is a choice of literals, or a single fielded literal, is a
token whose text varies per node: a binary expression's `operator`. Such a
slot takes part in a seam like a literal member does when at least one of
its arms is punctuation, named by the slot instead of the token:
`operator_before` and `operator_after` on the kind that holds it, one value
for every arm. A slot whose arms are all keywords (`let` / `const`, a
`readonly` marker) stays lexical, as keywords do everywhere. Its default is `tight`, and a
tight seam writes nothing, so the lexical rule still decides the seam
until a key is set. A slot that renders a kind is not a token and gets no
site.

The site's owner is the token's kind, named as the catalog names it
(`lparen`, `rbrace`, `plus`): the label is the kind's own preference and
applies at every seam where the token sits. A parent kind overrides it at
its own seams.

### Injection and defaults

A second render-rule pass (`seamRenderRules`), run after the pass that
writes separator spacing into the separator and after the template
emitter's seam-stamping dry run, injects `choice(_tight, _space, _newline)`
at each token seam, its arms carrying the label and the default arm,
exactly as a separator's before and after choices do. The default arm is
read from the stamp the dry run left on the member, so it reproduces the
current output: `space` where the static seam analysis already bakes a
space into the body text, `tight` everywhere else. A seam the analysis
leaves to the writer (runtime-varying) defaults to `tight`; the writer's
lexical check still applies on top.

Each site is one `Option<u16>` slot on the owning transport, keyed by the
site, materialized from the resolved table by the fill walk at the dispatch
point, and printed by the kind's render function as the seam's whitespace
text. Nothing else in the render path changes.

### Kind edges

The bracket that opens a kind is the first member of that kind's rule, so
no seq boundary holds it: `fn name(` puts `(` first in `parameters`, and
`) {` puts `{` first in `block`. Those seams are the kind's own edges, and
the kind names them. Every compound kind whose rule is a seq gets
`choice(_tight, _space, _newline)` as its first and last members, labelled
`<kind>_before` and `<kind>_after` (the public kind name), owned by that
kind, default `tight`. A kind whose rule is not a seq holds no literal of
its own, so its edges are its members' edges and it gets none; a hidden
kind whose public name a visible kind also bears leaves the key to the
visible one. They are token seams in every other respect:
one slot each on the kind's transport, printed at the start and end of its
body, coalesced with whatever sits on the other side of the seam, so
`parameters_after` and `block_before` on the seam between a parameter list
and its body yield one space when either is set. Naming the edge by the kind rather than the
token reaches keyword edges too (`else_clause_before` turns `}else` into
`} else`) and keeps the count at two sites per kind. The inner flanks
`<kind>_start` / `<kind>_end` around a kind's array are a different pair
and keep their name.

### Options surface

Top level: `<token>_before` and `<token>_after` per punctuation kind, typed
as the whitespace kind ids `Tight | Space | Newline`. Kind override:
`<kind>.<token>_before` applies to every seam of that token in the kind; a
kind holding the token at several positions may address one with the
existing path form. Precedence is the existing order: kind over the label
over the grammar's declared default.

### Grammar declaration

In `patches:`, the same `preference(label, arm)` spelling as the spacing
labels: `lparen_before: preference('lparen_before', 'space')` at the top
level, or under a kind. A default naming an arm that is not `tight`,
`space` or `newline` fails at build naming the key. `indent` and `dedent`
are not token arms: depth belongs to blocks, and a bracket that opens an
indented region gets that from the flank site of the list inside it.

### Declared defaults

Each grammar declares idiomatic defaults for its seams in `patches:`,
following its formatter: rustfmt for rust, prettier for typescript, black
for python. Space before a body (`block_before`, `statement_block_before`),
around `=`, `->`, `=>` and the binary operators, after a type or pair
colon, inside object and struct-literal braces where the formatter puts
them; tight where it does not (a unary or range operator, a keyword
argument's `=`, a slice's colons). Match arms and comma-separated bodies
stay on one line for now: a separated list gets no indent flanks, and the
arms array leaves its last arm outside its flanks. These
are defaults, not fixed spellings: every one is a site a user's options can
override, and the render is byte-identical to the previous output only
when no default names `space`, which after this declaration none of the
three grammars satisfies on purpose.

### Coalescing

Seam whitespace is written into the stream with an in-band mark, the
mechanism the adjacency and indent marks use, so the root `SpacingWriter`
can tell it from literal text. Consecutive marked whitespace writes
collapse to the wider of them on the order

```
tight < space < newline < indent, dedent
```

so `rparen_after: tight` beside `lbrace_before: space` gives one
space, `space` beside `newline` gives one line break, and a `space` beside
a block's `indent` flank gives the indent, never losing the depth move. The
lexical seam check is unchanged: when both sides chose `tight` across a
word hazard the writer still inserts the required space. Literal text,
including whitespace inside a string literal, is never coalesced. A seam
lies between two things: a payload held before anything has been written,
or still held when the render ends, is dropped, so a node rendered on its
own carries no leading or trailing seam whitespace.

## Out of scope

- Spacing around keywords, which stays lexically decided.
- Preserving a parsed node's seam whitespace (reader stamps); a parsed
  node re-renders with the engine's options, as separators do today.
- Blank lines between sibling statements or items: that is the separator
  gap of the parent, already a site.
- Per-token values within one literal slot (`+` spaced, `::` tight in the
  same `operator` slot); the slot's seam has one value for all its arms.
- Addressing one occurrence of a token in a kind that holds it at several
  positions; one site per kind, token and side.
- Seams inside a rule that another rule inlines: the inlined body prints
  into the referencing kind's transport, which holds no field for it.

## Verification

- Byte gate: the six dogfood renders and every validator count are
  identical before and after, since every default arm reproduces the
  current seam.
- Unit: the pass injects sites at the right seams and skips keywords and
  separator positions; the default arm is `space` exactly where the body
  text had a baked space; the writer coalesces marked whitespace to the
  wider and leaves literal whitespace alone; the `options.ts` snapshot
  gains the token keys with the right types; a token arm of `indent`
  fails at build.
- One dogfood case declaring `lparen_before: space` on rust, recorded in
  the PR, to show the feature moving bytes on purpose.
