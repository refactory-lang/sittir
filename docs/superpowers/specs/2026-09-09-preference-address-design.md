# Preferences have one address

> **Status:** Design (brainstormed 2026-09-09). Supersedes the six-namespace
> option surface described across the punctuation seam spacing and choice
> separator spacing designs — those mechanisms survive; their spellings do
> not. Builds on the path vocabulary already in
> `packages/codegen/src/dsl/transform/transform-path.ts` and on the render
> context left open in the render-views-display plan.

## Problem

A preference answers two questions — *where does it apply* and *what does it
mean* — and today the surface answers them together, six different ways.

A grammar declares one with a bare label (`eq_before`), a kind-scoped address
(`named_imports: { lbrace_after: … }`), a slot-scoped separator
(`<slot>_separator_space_after`), a flank (`<kind>_start`), a delimiter
(`<slot>_delimiter`) or a choice separator (`preference('separator', <kind>)`).
The native side resolves those against six parallel flat tables — `LABELS`,
`FLANK_SITES`, flank-supertypes, `SUPERTYPE_MEMBERS`, `SPACING_SITES`,
`DELIMITER_SITES` — with a special case and an error path each. The generated
TypeScript surface is a seventh spelling: a flat mapped type whose keys are
`<slot>_<label>` strings.

Three consequences, all observed rather than predicted:

- **Scope is all-or-nothing.** A label is grammar-wide and a site is one kind;
  nothing sits between. rust's `colon_after: 'space'`, declared for ordinary
  code, reaches macro metavariable patterns and renders `$a:ident` as
  `$a: ident`, while `#[bar(contexts: $)]` genuinely wants the space.
- **A fact gets restated per site.** `block_body_before`/`block_body_after` is
  written twenty times across rust and typescript — five kinds each, two sides
  — every one repeating both the label and the arm.
- **Position and token are conflated.** `lbrace_after` names a body's opening
  gap by its delimiter, so typescript's `object_type` (whose delimiters are
  `opening`/`closing`) needs a different address for the same concept, and
  python — whose bodies have no delimiter token at all — cannot use that
  spelling.

## The address

**One path grammar, shared with `patches:`.** A preference is keyed by a path
from a kind to a position:

```
block/body:/before
token_tree_punctuation/","/after
token_repetition_pattern/(token_tree_punctuation)/":"/after
source_file/statements:/(_)/after
```

Segments are the existing `parsePath` vocabulary — index (`0`, `-1`),
wildcard (`_`), kind match (`(name)`), field traversal (`name:`) — plus one
addition, the **literal segment** `"text"`, which names an anonymous token or
an enum arm by its text. The first segment is the kind. `/` separates.

**Sides are segments, not sigils.** `before`, `after` and `separator` are
ordinary terminal segments. There is no `+`/`-` suffix vocabulary, so a path and
the nested TypeScript object are the same address in two layouts rather than two
conventions needing a projection rule.

There are three terminals — `before`, `after`, `separator` — and no separate
flank vocabulary. A list's inside edges are the seams of whatever delimits it.

That works because the writer, not a conditional address, keeps an empty body
bare: an indent immediately followed by a dedent cancels, so `lbrace_after:
indent` with `rbrace_before: dedent` renders `{}` for an empty block and an
indented body for a full one, from the same unconditional pair. Flanks were a
second address for a gap the seams already reach, and `block` declares both
today.

Where a non-indent arm would otherwise emit whitespace into an empty list —
`space` after an opening paren rendering `f( )` — that is a property of the
arm, not a second address: whitespace that should not survive having nothing
beside it. It belongs as a writer rule, the same shape as the indent/dedent
cancel.

An index stays what it is today: a **static** member of a rule, a seq's second
or a choice's last, resolved against the grammar shape at compile time. It
never names a rendered element, whose count is unknown until render.

Named positions on a slot:

| segment | position |
| --- | --- |
| `separator` | the separator token, where the grammar offers a choice of them |
| `separator/before`, `separator/after` | the gaps flanking a separator token |
| `before`, `after` | on a kind, its own leading and trailing edges |

**A sibling gap belongs to the child before it.** The gap between two elements
is the preceding child's `after` edge, scoped to where that child sits:
`(source_file)/statements:/(_)/after` is the slot's default gap and
`(source_file)/statements:/(attribute_item)/after` is an exception to it,
matching a strict subset. `(_)` matches any kind and `_` any segment, as in
scm.

That retires the empty separator. A repeat with no separator token has nothing
between its elements but that gap, so `<slot>_separator_space` was naming an
absence — and naming it as a property of the list meant every element got the
same gap, which is what made a blank line between an attribute item and the
item it decorates undeclarable. Nothing it could say is lost, and the
child-scoped form says more.

`separator` therefore names only the token, where a grammar offers a choice of
them, with `separator/before` and `separator/after` for the gaps flanking it.
Those two cannot become child edges: a kind edge is part of a child's own
render body and fires on every occurrence, so a child's `before` cannot tell
the head of a list from the position after a separator. Only the separator
knows which gaps sit beside a token.

A trailing gap needs no special case. The writer drops a seam payload with
nothing after it, so the last element's `after` at the end of a render
disappears rather than trailing whitespace onto the output.

**Addresses are model-addressed, not tree-addressed.** A literal segment names
an arm of the model's enum, which is well defined even where the parse tree
shows only an aliased parent — rust's token-tree punctuation is one node whose
text is the literal, with the anonymous token aliased away. Preference paths
borrow scm's segment syntax; they do not share its semantics, and no
preference path is required to match a tree query. This is the write-side half
of the boundary the role-interfaces design draws: scm addresses visible nodes,
sub-visible facts stay in `grammar.sittir.ts`, and whitespace is sub-visible —
a seam has no node.

**A body's edges are its delimiter's seams.** With flanks retired there is one
address for the gap inside an opening delimiter, and it names the delimiter.
That the delimiter differs per grammar — `"{"` in rust, `opening:` in
typescript's `object_type`, nothing at all in python — is what the binding
layer is for: unlike addresses bind to one label, so `body/before` is declared
once and reaches all three.

## Declaring: `options:`

Preferences leave `patches:` for their own block. `patches:` keeps structural
rewriting — `field()`, `variant()`, `alias()`, positional patches — and
`options:` takes every `preference()`.

`options:` has two halves, following the `_`-prefix convention: bare keys are
the public surface, `_`-prefixed keys are storage.

```ts
options: {
  'body/before':       preference('indent'),
  'body/after':        preference('dedent'),
  'assignment/before': preference('space'),

  _bindings: {
    'block/"{"/after':                  'body/before',
    'block/"}"/before':                 'body/after',
    'object_type/opening:/after':       'body/before',
    'field_declaration_list/"{"/after': 'body/before',

    'lexical_declaration/"="/before': 'assignment/before',
    'keyword_argument/"="/before':   ['assignment/before', 'tight'],
  }
}
```

A bare key declares a **label** and its default arm, once. A `_bindings` entry
binds an **address** to that label.

**Labels are paths too.** A label is written in the same path syntax as an
address, so it nests in the generated surface exactly as an address does and no
flat identifier survives anywhere in the design. `body/before` replaces
`block_body_before`, which was a path encoded as an underscore string.

A label path names a concept, not a kind, so its root shares a namespace with
the grammar's kinds. **Declared labels win**: a label whose root collides with a
kind name is rejected at load time. Kinds are derived and labels are written, so
the collision is always the author's to resolve and the error can say which
kind was shadowed.

Membership and default are separate. `['assignment/before', 'tight']` binds the
address to `assignment/before` — so a consumer setting that label still moves it
— while declaring a different default there. That is exactly today's behaviour:
python's `keyword_argument` override keeps the `eq_before` label and changes
only its default id. A binding may also name a bare arm, for a position that
belongs to no group and therefore moves only by its own address.

### The generated surface

`_bindings` is the single source for both faces of the TypeScript `Options`
type. A binding's value becomes a flat named key; its key becomes a nested
path:

```ts
export type Options = {
  body?:       { before?: Spacing; after?: Spacing };   // labels
  assignment?: { before?: Spacing };
} & {
  block?:                  { '{': { after?: Spacing } };   // addresses
  keyword_argument?:       { '=': { before?: Spacing } };
  token_tree_punctuation?: { ',': { after?: Spacing } };
};
```

Both faces nest, because both are paths. A consumer sets the label to move
every address bound to it, or the address to move one site. The site-set rule
adjudicates without a second mechanism: an address matches a subset of what its
label matches, so the address wins. This is today's `eq_before` versus
`keyword_argument: { eq_before }`, with nesting mirroring the path rather than
flattening it into a `<slot>_<label>` string.

`LABELS` stops being a table derived by scanning repeated label strings and
becomes what was written.

`_bindings` keys are full paths, so the block is flat and its keys are distinct
by construction. Both blocks reject a duplicate key at load time rather than
letting the object literal silently keep the last one.

## Resolving: scope by site set

A declaration applies to its address and everything beneath it. Where two
declarations reach the same site, **the one matching a strict subset of the
other's sites wins**:

```
token_tree_punctuation/","/after                                → space
token_repetition_pattern/(token_tree_punctuation)/":"/after      → tight
```

That single rule replaces the site → label → fallback ladder. A grammar-wide
fact matches many sites; an exception matches few; nothing sits outside the
ordering.

Specificity is defined on the site set rather than on path length, because two
paths can reach one site from different roots — `token_tree_punctuation/","/after`
and `delim_token_tree_paren/delim_tokens:/separator/after` can both reach one
gap — and neither is a prefix of the other. Two declarations whose
site sets overlap without either containing the other are a conflict, reported
at load time. Within a single root the rule degenerates to the longer path
winning.

Runtime options are the same addresses in nested form, and resolve the same
way — shallow paths applied before deep ones, last write wins.

An address naming no site is an error, at load time and at runtime. A typo must
not resolve to a silent no-op.

## Storing: sorted numbering, runs, one dense vector

Sites are **numbered by canonical sorted path order**, which makes the flat
site vector and an ordered map the same structure viewed two ways: every
descendant of a prefix occupies a contiguous index range, found by binary
search. Sorting compares parsed segments, not the raw string, because a literal
segment may contain the separator — rust's token-tree punctuation includes `/`
and `/=` as arms.

Sites are derived from the model, never from declarations, so declaring a
preference cannot mint one and a site-count ratchet stays meaningful. Site
granularity is per (owning kind, path), which for an enum arm reached through a
slot means per (parent kind, slot, arm, side). That granularity costs vector
slots addressed as `base + ordinal`, not named struct fields, so it is a few
kilobytes rather than a thousand generated fields.

Resolution works on **runs** — `(start, end, arm)` over the index space — because
the value set is sparse and prefix-shaped: one run for the fallback, one per
declaration. Applying a user's declaration splits at most two runs.

Rendering reads a **dense vector**, expanded from the runs once per options
change. The expansion is the cache: it costs one linear pass over a few
thousand `u16`, it happens where the values stop changing, and it keeps the
table genuinely immutable — a lazily populated cache would need interior
mutability under the `&` that every render holds, and pay an atomic on each of
the tens of thousands of lookups a large document makes.

Three forms, three lifetimes, each conversion happening once: nested object
while authoring, runs while resolving, dense vector while rendering.

## Reading: accessor structs and a render context

Generated per-kind accessor structs mirror the transports, so no site index
appears in a render body:

```rust
pub struct DelimTokenTreeParenOptions<'a>(&'a [u16]);
impl<'a> DelimTokenTreeParenOptions<'a> {
    #[inline] pub fn lparen_after(&self) -> u16 { self.0[SITE_DELIM_TOKEN_TREE_PAREN_LPAREN_AFTER] }
}
```

The accessor is the transport-mirroring shape; the vector is an implementation
detail behind it, so storage layout and reading shape are no longer forced to
be the same thing.

Options reach a render function through a **render context**:
`impl Display for XTransport` becomes `impl Render for XTransport { fn render(&self, ctx, f) }`,
`View::new` gains a `ctx`, and `Display` stays as the bridge. This is the
extension the render-views-display plan left open for exactly this case.

With options delivered by context, the adapter that existed only because
`Display::fmt` has nowhere to put a second parameter is deleted:

- every `Option<u16>` spacing field on every transport
- the `fill_options` walk, which runs once per render over every node
- `FillOptions` and its blanket impls in `sittir-core`

Per-node spacing overrides go with them. The wire could carry one — the fields
carry `napi(js_name = "_lparen_after")` — but the generated TypeScript surface
never exposes them, so no caller can set one and none does.

## What this retires

| retired | replaced by |
| --- | --- |
| `<tok>_<side>` seam labels | a literal or structural segment in the path |
| `<slot>_separator_space` (empty separator) | `<slot>:/(_)/after` — the gap belongs to the child |
| `<slot>_<tok>_separator_space_<side>` | `<slot>:/separator/<side>` |
| `<kind>_start` / `_end` flanks | retired — the delimiter's seams reach the same gap |
| `<kind>_before` / `_after` kind edges | `<kind>/before` / `/after` |
| flank-supertype fan-out, `SUPERTYPE_MEMBERS` | a `(supertype)` segment expanding to its members |
| `LABELS` as a derived scan | `options._bindings` as written |
| `FillOptions`, per-node option fields | the render context |

`DEPTH_SITES` validation is unchanged: indent/dedent balance is checked against
the resolved vector and does not care how addresses are spelled.

Labels survive, written as paths and declared rather than inferred. A
preference has two independent questions and an address answers only the first;
collapsing them would force `body/before` to be restated at every braced kind,
which is the duplication this design exists to remove.

Writing labels as paths also dates the binding block. `body/before` is already
shaped like a role-scoped address and simply cannot be resolved as one yet, so
`_bindings` enumerates its members by hand. The role-interfaces design already
captures `@body`; when roles land, the same label path becomes a query and the
enumeration deletes itself. `_bindings` is scaffolding with a known removal
date, not a permanent namespace.

## Non-goals

- **Formatting decisions.** Line width, wrapping and whether a body is inline
  are not preferences; this design addresses the gaps a rendered form already
  has.
- **Reshaping the writer.** Seam coalescing keeps its current rule. Where a
  declared `tight` loses to a declared `space` today, the fix is that the two
  are now distinct addresses with an ordering, not a change to how marks merge.
- **Implementing roles.** Role-scoped addresses are named as the destination
  for bound preferences; nothing here depends on `roles.scm` existing.

## Open decision

A `_bindings` value is a **label path**, a **label with a local default**
(`['assignment/before', 'tight']`), or a **bare arm** for a position in no
group.

The alternative — every binding naming only an arm — keeps the block
self-contained but restates `indent` at all ten body sites, which is the
duplication the block exists to remove, and it loses group membership: a
consumer setting the label would no longer reach an address that had declared
its own default. The three-form value preserves both, at the cost of a value
union rather than a plain string.
