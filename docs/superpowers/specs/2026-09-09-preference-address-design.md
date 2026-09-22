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
  body:       { before: preference('indent'), after: preference('dedent') },
  assignment: { before: preference('space') },

  keyword_argument: { '"="/before': preference('tight') },

  _bindings: {
    'block/"{"/after':                  'body/before',
    'block/"}"/before':                 'body/after',
    'object_type/opening:/after':       'body/before',
    'field_declaration_list/"{"/after': 'body/before',
    'lexical_declaration/"="/before':   'assignment/before',
    'keyword_argument/"="/before':      'assignment/before',
  }
}
```

**The top level is kind-keyed, as `patches:` is** — a bare identifier, whose
value is a map of paths relative to it. One block's structure teaches the
other's.

**A label's first segment is a virtual kind.** `body/before` is `before` under
`body`, and `body` is a kind the grammar does not have. So the top level needs
no discrimination by shape: every key is a kind, some real and some virtual,
and every value is a map of relative paths. `block_body_before` — a path
encoded as an underscore string — becomes a path under a kind that names the
concept.

Virtual kinds share the namespace with real ones, which is what makes the
collision rule necessary and also what makes it easy to state: a virtual kind
may not take a real kind's name.

**Declared labels win**: a virtual kind taking a real kind's name is rejected at
load time. Real kinds are derived from the grammar and virtual ones are
written, so the collision is always the author's to resolve and the error can
name the kind that was shadowed.

**Membership and default are declared separately, in the two halves.**
`_bindings` says an address belongs to a label; a declaration under the
address's kind says what its arm is. `keyword_argument`'s assignment gap is
bound to `assignment/before` and declared `tight`, so a consumer setting
`assignment/before` still moves it while its own default differs — which is
exactly today's behaviour, where that override keeps the `eq_before` label and
changes only its default id. Today the two facts are welded into one
`preference(label, arm)` call repeated at every site; here each is written
once, in the half that owns it.

An address that belongs to no label needs no binding: it is a declaration under
its kind and nothing else, and subset specificity already ranks it above any
broader path that also reaches it.

### The generated surface

`_bindings` is the single source for both faces of the TypeScript `Options`
type. A binding's value becomes a flat named key; its key becomes a nested
path:

```ts
export type Options = {
  body?:                   { before?: Spacing; after?: Spacing };   // virtual
  assignment?:             { before?: Spacing };
  block?:                  { '{': { after?: Spacing } };            // real
  keyword_argument?:       { '=': { before?: Spacing } };
  token_tree_punctuation?: { ',': { after?: Spacing } };
};
```

One map, not two intersected halves, because a label is a path under a virtual
kind and needs no separate face. A consumer sets a virtual kind's path to move
every address bound to it, or a real kind's path to move one site. The site-set
rule adjudicates without a second mechanism: an address matches a subset of
what its label matches, so the address wins. This is today's `eq_before` versus
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

## Resolved: the binding value

A `_bindings` value is a label path. Nothing else: an address with a differing
default declares it under its kind, and an address in no group is only a
declaration. The union of value shapes an earlier draft carried was the
membership and the default fighting for one slot.

## Amendments (2026-09-21)

Reviewed against what landed. Both surfaces materialized the site set once
per site — as generated type tables on the TypeScript side and as named
fields on the Rust side — where this design derives it. Four corrections,
each a conformance to a section above rather than a new mechanism.

### Kind edges live in the transport base

Every transport carries `before` and `after` once, in the shared base beside
its trivia field. They are the kind's own edges (`<kind>/before`,
`<kind>/after`), so a per-kind field named after the kind is the same fact
spelled 400 times.

### A sibling gap is the preceding element's own `after` edge

"A sibling gap belongs to the child before it" is a statement about
storage as much as addressing. With edges in every transport's base, a
seated site (`arguments/arguments/as_expression/after`) fills the element's
own base `after`; the element carrier gains nothing. What the generated
`prepare` does today by matching on each element's kind and descending into
nested polymorph content becomes one loop over the elements and a generated
per-slot table from element kind id to seated site index. The reader's
classifier keeps stamping one majority class per list into the list
transport's two separator fields, which stay: they are list facts, not
token seams.

### A token seam has no per-node carrier

`arguments/lparen/after` is a site — the only owner of the gap between `(`
and the first element, which is why the flanks were retired in its favour —
but nothing writes it per node: the classifier does not, and the TypeScript
surface never exposed the key. The field, its `prepare` fill and the
`fill_options` walk go, as "What this retires" already said; render reads
the resolved vector at the site, which is what it does today whenever the
field is `None`. A token that is its kind's first or last member has no
outward seam; that gap is the kind edge.

Reading is the accessor newtype over the dense vector described under
"Reading", not the nested `Option<u16>` structs that were generated instead.

### The TypeScript `Options` type is derived, not tabulated

The generated `options.ts` is a site table (`AddressRoot`, `AddressBranch`,
`AddressLeaf`) with a mapped tail. Under this design the table does not
exist. The addresses need three facts per kind: its tokens in order, which
slots repeat and with what separator, and each slot's element kinds. The
node interfaces already carry the third. The first two are render-rule
facts, so the generator emits one **template type** per kind beside its
interface — the rule's members in order, one line —

```ts
export type ArgumentsTemplate = readonly [Tok<'lparen'>, Repeat<'arguments', Sep<'comma'>>, Tok<'rparen'>];
```

and `Options` is one generic in `packages/types`, mapped over the existing
kind-to-interface map:

```ts
type Sides = { readonly before?: Whitespace; readonly after?: Whitespace };
type TokSites<M> = M extends Tok<infer N> ? { readonly [K in N]?: Sides } : {};
type ElementSites<E> = { readonly [K in KindNameOf<E>]?: { readonly after?: Whitespace } };
type RepeatSites<Node, M> = M extends Repeat<infer N, infer S>
	? { readonly [K in N]?: { readonly separator?: Sides & SepValue<S> } & ElementSites<ElementOf<Node[`_${N}`]>> }
	: {};
type Sites<Node, Tpl extends readonly unknown[]> =
	Sides & UnionToIntersection<TokSites<Tpl[number]> | RepeatSites<Node, Tpl[number]>>;
export type Options = { readonly [K in Kind]?: Sites<NodeOf<K>, TemplateOf<K>> } & { readonly indent?: string };
```

Labels keep their place as virtual kinds at the top level. The template is
the only fact emitted for the type that is not already in the interface,
and it is emitted from the same render rule the site vector is numbered
from: one source, two projections. The grammar type in `grammar.ts` was
considered as the source instead — a field's `types` already list a
separator that sits inside the field — and set aside: node-types omits
every unfielded token and lists a separator only when the field wraps the
repeat, so it would need the same additions the template carries, in a
file that mirrors tree-sitter's output rather than sittir's model.

Instantiation cost was measured on the typescript grammar before planning
(2026-09-21): a spike deriving `Options` from 146 generated template types
and the real `types.ts` interfaces compiled at 3,058,924 instantiations
against 3,054,405 for today's tabulated `options.ts`, a difference under
0.2% on a total dominated by the transitive import of `types.ts`; check
time was within noise (1.65 s against 2.11 s). There is no cliff, and the
usage `arguments: { lparen: { after }, _arguments: { separator, spread_element: { after } } }`
type-checks against the derived type.
