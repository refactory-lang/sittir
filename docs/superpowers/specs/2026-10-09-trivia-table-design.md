# Trivia table

Status: draft for the maintainer's review. Nothing here is built.

## 1. The model

Trivia fills the seams between tokens. A gap is the seam between two adjacent tokens, and trivia is what fills it: the comments the grammar declares as extras, and line breaks and indentation where they differ from the seam's default. In-line spaces are not stored. They derive from the seam defaults, a space unless the grammar declares the seam tight ([token seam defaults](2026-09-14-token-seam-defaults-design.md), over the sites of [punctuation seam spacing](2026-09-06-punctuation-seam-spacing-design.md)), so the whitespace stored is layout only. Each gap's entries are assigned once, at read, to one side of one node, and trivia is stored natively, keyed by node and side. It is never a field of a wrapper.

- **Address.** A gap's address is its place in the token walk: gap *k* lies between token *k* and token *k + 1*, and gap −1 and gap *n* are the file's two edges.
- **Owner.** A gap's owner is tree-sitter's for extras: the smallest node that contains tokens on both sides of the gap, and the root at the file edges. The parser does this itself: a reduce pops trailing extras back out of the node it builds, and leading extras are never popped into it, so a node never starts or ends with an extra. The owner is derived from the address and the tree. It is never stored.
- **Assignment.** A gap's entries go only to its owner's two children beside it: the left one, the owner's child that ends at token *k*, and the right one, the owner's child that starts at token *k + 1*. In `s1(); // x`, `// x` goes to the statement, not to the call inside it.
  - Entries on the left token's line are the left child's `trailing`. The rest are the right child's `leading`.
  - With no left child, every entry leads the right one. With no right child, every entry trails the left one.
  - If the owner has no children, the entries are the owner's `inner`.
  - If the owner has children but neither beside the gap, the gap lies between two of the owner's own tokens (`for /*c*/ (`, `[a, b, // c⏎]`), and no side takes its entries (§ 2).
- **One value per side.** A side's value is its entries in source order. A comment entry is a comment node of the grammar, held as a value: its kind and its fields. Comments are built with the grammar's own builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`, `ir.blockComment(…)`), the same factories, coercion and sibling-lead refusals as today. A layout entry is a line break or an indentation run. An `ERROR` node is an entry: a value of its kind and source text, rendered verbatim and never rebuilt by a builder. A write stores the built node's value. A read returns comment nodes rebuilt from the stored value, as built nodes with the same surface as any other. Two reads of a side return equal nodes, not the same object, and nothing depends on an entry's identity.
- **Storage.** A parsed tree's trivia is one native table on the tree, keyed by (node, side), stamped by one walk at read and changed only by writes. A built node keeps its trivia in its own record, by side (§ 7.1). The renderer reads trivia from these and from nowhere else.
- **Why this is not the old placement.** The reader's placement also gave each comment to a node, and that is where the trivia defects came from. Placement seated trivia on the owner's transport, and the client carried it from there on wrappers: owner seats, the written-sides map, the composed-trivia cache, the client edited set and the projection's carriers each copied it from node to node, and each copy could drop or duplicate it. Here the assignment is a native fact, stamped once at read and keyed by node, never by wrapper. A write replaces a side in native storage, and the render reads native storage and nothing else.

## 2. The surface

`node.$trivia` is a view over the node's sides.

- `leading`, `trailing`: the node's entries before its first token and after its last, those the assignment gave it or a write put there. A parent and its first child have a leading side each. The assignment fills the outer one, the gap owner's child, and a write to either leaves the other.
- `inner`: a node with no children (`()`, `{}`) has `inner`, the entries between its own tokens. It is the only side a parent addresses, because there it is unambiguous. No side is addressed from a parent by index.
- **A gap no side takes** (§ 1) has no view and no guarantee. Its entries render while the owner copies its source bytes (§ 4). When the owner renders from its template, the template's tokens and the seam defaults decide that seam, and its entries may go.
- **Writes** take comment nodes built by the grammar's builders, as today (`fn.$trivia.leading(ir.lineComment(' note'))`), plus text and the layout kinds where the writer admits them today. A write replaces one node's side, in one native call, and marks that side edited. A writer that keeps a side's entries reads them and writes them back with its addition.
- **Reads** are one native call that returns a side's entries as data. The client turns each entry into a comment or whitespace node of the grammar.

The wrapper holds no trivia. The wrapper registry is an identity cache only: dropping a wrapper, or reaching a node by a different route, changes nothing that renders.

## 3. Moving a node

A node's trivia is keyed by the node, so it travels with the node. A parsed node placed in a new parent, a `$with` or a built holder carries its own sides and its descendants'. A `$with` draft carries its children's: an untouched child keeps its sides, and a replaced child's go with it. A built node carries its sides in its record (§ 7.1).

## 4. Rendering and folding

- **Copying source text.** A node renders as its source bytes when no side within its range is edited: its descendants' sides and its own `inner`. Its own `leading` and `trailing` lie outside its bytes, and its holder prints them around the copy.
- **Edited ranges.** A node with an edited side within its range renders from its template and its children, read from the tree as needed. Each child's `leading` prints before its first token and its `trailing` after its last, between the template's tokens, with the seam's default spacing where no layout entry stands. A gap no side takes is not printed (§ 2). An in-line run the source spaced otherwise is re-spaced to the seam's default.
- **Indentation of copied text.** Copied bytes keep their content. The leading whitespace of a copied line that starts between tokens is layout, and it is shifted by the difference between the writer's column for the node and the node's source column. A line that starts inside a token (a multi-line string or block comment) is never shifted. The shared token-span function decides which lines are which.
- **Crossing.** Nothing crosses from the client at render time except the transport being rendered. Parsed trivia and edits are already native.

## 5. What this retires

- the reader's placement (`place()`) and its seating on transports, with `$sameLine` and `$tokensBetween` and owner seats for trivia: the table's one assignment walk replaces them;
- trivia stored on wrappers (`$_layout.trivia`, the written-sides map, the composed-trivia cache) and the client-side line-gap composition (`lineGapsOf`);
- `carryPlacement`, `carryElementTrivia` and the ir lane's edge-carrier rule. A projection carries no trivia through wrappers; the ir lane writes each source node's sides onto the node built from it, as comment nodes built with the grammar's builders;
- the client edited set, `markIndexEdited` and the refusal of writes through a query;
- sides named from a parent: `innerAt`, `INNER_GAPS` and the named inner gaps. `inner` stays, on a node with no children;
- the framed coordinate's trivia payload (`OutsideTrivia` on `SlotValue::Coord`). The renderer reads the sides from native storage.

## 6. Order

The table lands in the shared arena's step 3, ahead of the record wire, in its own plan (`docs/superpowers/plans/2026-10-10-arena-tables.md`). The typed reader's steps 1 and 2 land first, with the refusal of writes through a query in place until the table.

## 7. Rulings on the open questions

1. **A built node keeps its own trivia.** Its sides are in its record, from the shared arena's record step, and they travel with it when it is placed. A built holder keeps nothing for its children: each child's sides are the child's. A parsed node placed in a built holder keeps its sides in its tree's table.
2. **After a reparse, the assignment decides.** If a comment is written to one node's side but the assignment gives its gap to another, a reparse reports it on that other node. The assignment, not the call that wrote it, decides.
3. **Whitespace is layout only.** Trivia stores line breaks, blank lines and indentation where they differ from their seam's default, and spaces between tokens on a line derive from the seam defaults (§ 1). The plan measures the stored size on the corpora under this rule, beside the size with every whitespace extra stored, to confirm it.
