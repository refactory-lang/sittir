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
source_file/statements:/separator
```

Segments are the existing `parsePath` vocabulary — index (`0`, `-1`),
wildcard (`_`), kind match (`(name)`), field traversal (`name:`) — plus one
addition, the **literal segment** `"text"`, which names an anonymous token or
an enum arm by its text. The first segment is the kind. `/` separates.

**Sides are segments, not sigils.** `before`, `after` and `separator` are
ordinary terminal segments. There is no `+`/`-` suffix vocabulary, so a path and
the nested TypeScript object are the same address in two layouts rather than two
conventions needing a projection rule.

`start` and `end` are a list's own edges and stay distinct from indices,
because they address different spaces. An index names a **static** member of a
rule — a seq's second member, a choice's last — resolved against the grammar
shape at compile time. `start` and `end` name **dynamic** positions in a
rendered list: the gap before its first actual element and after its last,
whose count is unknown until render. No index can express those, which is why
`ListView` carries `head` and `tail` separately from anything the path grammar
reaches.

Named positions on a slot:

| segment | position |
| --- | --- |
| `separator` | the gap between elements, or the separator token where the grammar offers a choice |
| `separator/before`, `separator/after` | the gaps flanking a separator token |
| `start`, `end` | the gaps inside the list's first and last rendered elements |
| `before`, `after` | on a kind, its own leading and trailing edges |

`separator` is the exception that proves the rule: it is not a position but the
thing between positions, which is why it cannot be spelled `_/after` — that
would include the last element, where the gap belongs to the list's edge rather
than to a separator. It names a position in the addressing sense, and what it
admits is whatever that position varies: whitespace arms where the separator is fixed or empty, token kinds
where the grammar offers a choice. A slot never has both, and the site's
declared arm set rejects a value from the wrong family.

**Addresses are model-addressed, not tree-addressed.** A literal segment names
an arm of the model's enum, which is well defined even where the parse tree
shows only an aliased parent — rust's token-tree punctuation is one node whose
text is the literal, with the anonymous token aliased away. Preference paths
borrow scm's segment syntax; they do not share its semantics, and no
preference path is required to match a tree query. This is the write-side half
of the boundary the role-interfaces design draws: scm addresses visible nodes,
sub-visible facts stay in `grammar.sittir.ts`, and whitespace is sub-visible —
a seam has no node.

**Structural beats token.** Where a position can be named either by the
delimiter beside it or by the slot it opens, the slot wins:
`block/body:/start`, not `block/"{"/after`. The delimiter is not the invariant — `object_type`
opens with `opening`, and a python body opens with nothing.

## Declaring: `options:`

Preferences leave `patches:` for their own block. `patches:` keeps structural
rewriting — `field()`, `variant()`, `alias()`, positional patches — and
`options:` takes every `preference()`.

`options:` has two halves, following the `_`-prefix convention: bare keys are
the public surface, `_`-prefixed keys are storage.

```ts
options: {
  block_body_before: preference('indent'),
  block_body_after:  preference('dedent'),
  eq_before:         preference('space'),

  _bindings: {
    'block/body:/start':                      'block_body_before',
    'block/body:/end':                        'block_body_after',
    'object_type/content:/start':             'block_body_before',
    'field_declaration_list/elements:/start': 'block_body_before',

    'lexical_declaration/"="/before':      'eq_before',
    'keyword_argument/"="/before':        ['eq_before', 'tight'],
  }
}
```

A bare key declares a **named preference** and its default arm, once. A
`_bindings` entry binds an **address** to that name.

Membership and default are separate. `['eq_before', 'tight']` binds the address
to `eq_before` — so a consumer setting `eq_before` still moves it — while
declaring a different default there. That is exactly today's behaviour: python's
`keyword_argument` override keeps the `eq_before` label and changes only its
default id. A binding may also name a bare arm, for a position that belongs to
no group and therefore moves only by its own address.

The generated TypeScript `Options` type is `options` minus `_bindings`: the
named keys a consumer sets, with the addresses each reaches resolved at
codegen. `LABELS` stops being a table derived by scanning repeated label
strings and becomes what was written.

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
and `delim_token_tree_paren/delim_tokens:/end` both name the gap after a
trailing comma — and neither is a prefix of the other. Two declarations whose
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
| `<slot>_separator_space[_<side>]` | `<slot>:/separator[/<side>]` |
| `<kind>_start` / `_end` flanks | `<slot>:/start` / `/end` |
| `<kind>_before` / `_after` kind edges | `<kind>/before` / `/after` |
| flank-supertype fan-out, `SUPERTYPE_MEMBERS` | a `(supertype)` segment expanding to its members |
| `LABELS` as a derived scan | `options._bindings` as written |
| `FillOptions`, per-node option fields | the render context |

`DEPTH_SITES` validation is unchanged: indent/dedent balance is checked against
the resolved vector and does not care how addresses are spelled.

Labels survive, renamed and made explicit. A preference has two independent
questions and paths answer only the first; collapsing them would force
`block_body_before` to be restated at every braced kind, which is the
duplication this design exists to remove. The grouping is role-shaped — the
role-interfaces design already captures `@body` — so when roles land, a bound
preference becomes a role-scoped path and the binding retires into the role
spec.

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

A `_bindings` value is a **preference name**, a **name with a local default**
(`['eq_before', 'tight']`), or a **bare arm** for a position in no group.

The alternative — every binding naming only an arm — keeps the block
self-contained but restates `indent` at all ten body sites, which is the
duplication the block exists to remove, and it loses group membership: a
consumer setting `eq_before` would no longer reach an address that had declared
its own default. The three-form value preserves both, at the cost of a value
union rather than a plain string.
