# Trivia ownership: leading, trailing and inner comments

## Goal

Every comment (every grammar `extras` node that is not whitespace) has exactly
one owner and one position:

- the same position when it is read from source and when it is built with a factory;
- rendered back to the same place;
- held in one entry shape.

Authors attach comments through `$trivia`, including inside an otherwise empty
body, which cannot be expressed today.

## How tree-sitter places a comment

Sittir's placement rule restates tree-sitter's own tree, so the facts it rests
on come first:

1. **Extras are ordinary children.** A comment can appear between any two
   tokens. It is kept in the tree as a named child, in source order, among its
   parent's other children.
2. **Extras never carry a field.** A comment between two field-tagged children
   has no field id. Field lookups skip it; plain child iteration includes it.
3. **An extra belongs to the smallest node whose own tokens surround it.** When
   the parser reduces a rule, extras at the top of the stack are left out of the
   new node and re-pushed after it. Extras before a node's first token sit at the
   parent's level. So:
   - `{ // TODO }` is `(block (line_comment))`;
   - a comment between two statements is a child of the block, between them;
   - a comment after a file's last statement is a child of `source_file`.

A comment's position in the tree is therefore **(parent, index among the
parent's children)**. It is never inside a field.

## Model

### Owners and positions

A comment is attached to one node, in one of three positions:

| position | meaning | when |
| --- | --- | --- |
| `leading` | before the owner | the comment has a following named sibling and is not on the previous sibling's line |
| `trailing` | after the owner | the comment starts on the line where its previous named sibling ends, or it has no following named sibling |
| `inner` | inside the owner, which has no named children around the comment | the comment's parent has no named non-extra sibling on either side of it |

`inner` exists only for a node whose optional and repeat slots are all empty
(see "Empty kinds"). In every other case a comment has a neighbour, and leading
or trailing on that neighbour expresses it.

### Placement rule (read)

For an extra child `c` of parent `P`:

- `prev` is the nearest preceding named sibling that is not an extra;
- `next` is the nearest following named sibling that is not an extra;
- anonymous tokens (`{`, `,`, `;`) are skipped.

The rule, first match wins:

1. `prev` exists and `c` starts on the row where `prev` ends: trailing of `prev`,
   same line. Further extras on that row chain onto `prev`'s trailing list in
   order.
2. `next` exists: leading of `next`.
3. `prev` exists: trailing of `prev`, own line.
4. Otherwise: inner of `P`, in the gap `c` occupies (see "Gaps").

Rule 1 differs from today's reader. Today every comment between two siblings
becomes leading of `next`, so `a; // note` re-renders on the following line in a
detached render. Rule 4 is new: today a comment with no named sibling is not
recorded anywhere, and it is lost.

### Entry shape

Every trivia entry, read or built, is the node data of its extra kind:

- the same shape a slot child of that kind has;
- read, wrapped and transported by the same code as slot children, so a comment
  kind's token-interior slot is populated (`_content`, not a bare `$text`);
- the only metadata trivia adds is `$sameLine?: true`, which records a comment
  on its anchor's line. Read stamps it from rule 1. A builder may pass it.

This closes the current mismatch: read trivia entries carry `$text`, while the
transport expects the comment kind's `_content`. That mismatch is what leaves
the two rust "Comments degenerate cases" fixtures out today.

### Storage

```ts
interface NodeTrivia {
	readonly leading?: readonly TriviaEntry[];
	readonly trailing?: readonly TriviaEntry[];
	readonly inner?: Readonly<Partial<Record<GapKey, readonly TriviaEntry[]>>>;
}
```

`TriviaEntry` is the node data of one of the grammar's comment kinds (its
`trivia` role). The bare-string form that `TriviaEntry` allows today is replaced
by the builder surface below. `$_trivia` stays the storage key.

### Empty kinds and gaps

A kind is **inner-capable** when its render body has at least one optional or
repeat slot, or when it has no slots but its render body has at least two tokens
(the unit `()`).

A node of an inner-capable kind is **empty** when none of its optional or repeat
slots holds a value. Required slots cannot be empty, and a node with any required
slot filled has a neighbour for every comment. So only kinds whose slots are all
optional or repeat can be empty.

A **gap** is where an inner comment sits:

- `GapKey` is the name of the empty optional or repeat slot whose position (the
  span between the tokens around it) contains the comment;
- a slotless kind has exactly one gap, keyed `interior`, between its first and
  last token.

When one span between two tokens holds several empty slots, the comment belongs
to the first of them in render order. A comment the reader finds in a gap it
cannot key raises a read diagnostic, and the entry counts in the trivia
validation row. One example is a slotless kind with more than two tokens.

## Factory and type surface

### Leading and trailing

Leading and trailing are unchanged in use and gain getters:

```ts
node.$trivia(...items);              // leading
node.$trivia.leading(...items);      // returns the node
node.$trivia.trailing(...items);     // returns the node
node.$trivia.leading();              // readonly TriviaEntry[]
node.$trivia.trailing();             // readonly TriviaEntry[]
```

### Inner, behind a type guard

`inner` is on the type only where it can hold something. Slot accessors are
unchanged: `block.statements()` is `readonly Statement[]`, `[]` when the block is
empty, whether or not the block holds an inner comment.

```ts
interface Block { statements(): readonly Statement[]; $trivia: TriviaSetter<Block> }
interface EmptyBlock extends Block { $trivia: TriviaSetter<EmptyBlock> & InnerTrivia<EmptyBlock, 'statements'> }

export function isEmpty(node: Block): node is EmptyBlock;

ir.block().$trivia.inner(ir.lineComment('// TODO'));   // a factory call with no children returns EmptyBlock
if (isEmpty(parsed)) parsed.$trivia.inner();           // readonly TriviaEntry[]: the default gap's entries
```

`InnerTrivia<N, Gap>`:

- `inner(...items): N` attaches to the kind's first gap in render order;
- `inner(): readonly TriviaEntry[]` reads the first gap;
- `innerAt(gap: Gap, ...items): N` and `innerAt(gap: Gap)` address a named gap.
  They are typed only for kinds with more than one gap.

Emission:

- Each inner-capable kind emits `Empty<Kind>` and an `isEmpty` guard overload for
  it.
- A factory whose call supplies no optional or repeat value is typed to return
  `Empty<Kind>`, so building doesn't need a guard.
- `isEmpty` at runtime tests that every optional and repeat slot is empty. The
  guard is a type-level gate over storage that exists on every node of the kind.

### Refusals

The runtime refuses what the types forbid, so loose input and casts can't place
a comment where it can't render:

- `inner(...)` / `innerAt(...)` on a node that is not empty throws. The message
  names the neighbour positions to use instead (`leading` / `trailing` on a slot
  child).
- `innerAt` with a gap key the kind does not have throws.
- Once a node has inner entries, adding a slot value to it throws: the comment
  would gain a neighbour. The message says to move the entries to leading or
  trailing on the new child.

### Strict and loose items

This follows the existing bare-text rules:

- **Strict:** items are comment nodes built with the grammar's comment factories
  (`ir.lineComment(…)`, `ir.blockComment(…)`).
- **Loose:** items may also be strings. A string is classified against the
  grammar's comment kinds by the anchored-pattern test in lexical-rank order
  (the rule loose bare text already uses for text slots). A string no comment
  kind accepts throws.

## Render

Trivia is written through the same spacing writer as everything else. Placement
decides the break:

- **leading:** each entry, then a line break (or a space when `$sameLine`), then
  the owner;
- **trailing:** the owner, then a space when `$sameLine`, otherwise a line break
  at the owner's indentation, then each entry;
- **inner:** inside the gap, the gap's entries between the gap's surrounding
  tokens:
  - at one indentation level deeper when the gap is a block body (the owner
    kind's block-body seams already declare indent/dedent);
  - separated by a space otherwise;
  - separators of an empty list are not written.
- **line-terminated comments:** a comment kind whose token cannot contain a line
  break forces a line break after it, whatever follows. A line comment otherwise
  swallows the next token. The fact is stamped once per comment kind (see "Model
  additions") and never re-derived from text at render.

Read → render keeps using source coordinates and stays byte-exact. These rules
govern detached and built trees.

## Model additions

These are additions to the node model or to runtime data. They are listed here
for design review:

1. `NodeTrivia.inner` (runtime data), keyed by `GapKey`.
2. `$sameLine?: true` on trivia entries (runtime data).
3. **`lineTerminated`** on comment kinds (node model, a stamped fact):
   - computed at link from the kind's token rule: can the token's pattern match
     a line break;
   - consumed only by render emission.
4. **`innerGaps`** on inner-capable kinds (node model, a derived getter):
   - the ordered gap keys, from the kind's optional/repeat slots, or `interior`
     for a slotless kind;
   - consumed by type emission (`Empty<Kind>`, `innerAt`), the factory, wrap and
     render.

No annotation is read by the compiler for any of this. Trivia stays outside the
rule model.

## Reader and wrap

- The sittir-core reader (`compute_trivia` and its caller) implements the
  placement rule. A comment is recorded once, on its owner.
  - Today a node collects its own leading/trailing from its siblings. That
    changes to the parent assigning each extra child to an owner. A comment then
    can't be recorded twice or not at all.
  - Inner entries are collected on the parent, keyed by gap. The gap comes from
    the comment's byte position against the slot spans the reader already
    tracks.
- Trivia entries go through the same read → wrap path as slot children of their
  kind (the token-interior drill included).
- The wrap layer exposes `$trivia` getters over `$_trivia`. It exposes `inner`
  under the `Empty` type only.

## Validation

- The trivia row (entries whose only difference is trivia) keeps its own ceiling.
  This work must tighten it in all three grammars.
- rust "Comments degenerate cases" (`source_file`, `let_declaration`) must pass
  and leave the left-out list.
- Every other validate row holds or tightens.
- Targeted probes, each read → wrap → render and built → render, byte-exact:
  - rust `fn f() { // TODO\n}`, `foo(/* none */)`, `struct S { /* empty */ }`,
    `a; // note`, and a file containing only comments;
  - ts `function f() { /* empty */ }`, `for (/*a*/;;) {}`;
  - python `def f():\n    # only a comment\n    pass` (leading of `pass`) and a
    comment after the last statement of an indented block (see Risks).

## Risks

- **Python indentation.** tree-sitter-python can place a comment that follows a
  block's last statement outside the block, depending on its indentation and the
  dedent the scanner emits. The placement rule takes the tree as it is. The probe
  measures what it does, and any mismatch with the author's intent is reported,
  not patched in the reader.
- **Multi-token gaps.** Slotless kinds with more than two tokens produce a read
  diagnostic instead of an entry. The census in the first implementation task
  counts them per grammar. If any exists, the gap-key rule comes back for a
  decision before code.

## Out of scope

- Blank lines between a comment and its owner. Whitespace stays with the
  whitespace vocabulary and render options; read → render keeps them through
  source coordinates.
- Reflowing or re-indenting comment text.
- Doc-comment semantics (rust `///` as attributes, python docstrings, which are
  expression statements, not extras).
