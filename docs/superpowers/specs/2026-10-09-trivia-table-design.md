# Trivia table

Status: draft for the maintainer's review. Nothing here is built.

## 1. The model

Trivia is every extra the grammar declares: comments, whitespace runs and line breaks. It lives in one native table per tree, keyed by where it sits. It is not a field of the node it happens to be next to.

- **Address.** An entry's address is the gap it sits in: gap *k* lies between leaf token *k* and leaf token *k + 1*, and gap −1 and gap *n* are the file's two edges. A gap has exactly one address. "The leading side of a node" is not an address: a parent and its first child share one leading gap, so a key such as (node, side) would give the same gap several names.
- **Owner.** An entry's owner follows tree-sitter's convention for extras. An extra is a child of the smallest node that contains tokens on both sides of it, and a child of the root at the file edges. The parser does this itself: a reduce pops trailing extras back out of the node it builds, and leading extras are never popped into it, so a node never starts or ends with an extra. The owner is derived from the address and the tree. It is never stored.
- **Values.** An entry is a comment or whitespace node of the grammar, held as a value: its kind and its fields. Comments are built with the grammar's own builders (`ir.lineComment(…)`, `ir.comment.lineComment.docOuter(…)`, `ir.blockComment(…)`), the same factories, coercion and sibling-lead refusals as today. A write stores the built node's value. A read returns comment nodes rebuilt from the stored value, as built nodes with the same surface as any other. Two reads of a gap return equal nodes, not the same object, and nothing depends on an entry's identity.
- **One table.** Parsed trees and built nodes both keep their trivia in native tables. A parsed tree's table is filled by the reader from the source. A built node's table lives with its native storage and is filled by its factory and by writes. The renderer reads trivia from the table and from nowhere else.

## 2. The surface

`node.$trivia` is a view over the table.

- `leading`, `trailing`: the gap before the node's first token and the gap after its last. Reading either from any node that shares that gap returns the same entries. A write through any of them changes the one gap.
- `inner`: the gaps strictly inside the node's token range whose owner is the node. These are its own extras, in tree-sitter's sense.
- **Writes** take comment nodes built by the grammar's builders, as today (`fn.$trivia.leading(ir.lineComment(' note'))`), plus text and whitespace kinds where the writer admits them today. Each write is one native call that replaces the gap's entries. The written gap is marked edited.
- **Reads** are one native call that returns the gap's entries as data. The client turns each one into a comment or whitespace node of the grammar.

The wrapper holds no trivia. The wrapper registry is an identity cache only: dropping a wrapper, or reaching a node by a different route, changes nothing that renders.

## 3. Moving a node

When a parsed node is placed in a new parent, a `$with`, or a built holder, it carries the gaps it owns, i.e. its inner gaps. Its leading and trailing gaps belong to its old owner, under tree-sitter's convention, so they stay in the old tree. The new holder's own gaps around the node come from the new holder's table. A comment moves with a node exactly when tree-sitter would have made that comment a descendant of the node.

## 4. Rendering and folding

- **Copying source text.** A node renders as its source bytes when no edited gap lies between its first token and its last. Edits outside it don't stop the copy: its leading and trailing gaps are rendered by its owner, around the copied bytes.
- **Edited ranges.** A node with an edited gap inside its range renders from its children. Its children are read from the tree as needed, and each gap between them is printed from the table by the node that owns it. A comment between two children is printed by their parent, from the table, whether or not either child is materialized.
- **Indentation of copied text.** Copied bytes keep their content. The leading whitespace of a copied line that starts between tokens is layout, and it is shifted by the difference between the writer's column for the node and the node's source column. A line that starts inside a token (a multi-line string or block comment) is never shifted. The shared token-span function decides which lines are which.
- **Crossing.** Nothing crosses from the client at render time except the transport being rendered. Parsed trivia and edits are already native.

## 5. What this retires

- the reader's attachment step (`place()`) with `$sameLine` and `$tokensBetween`, and owner seats for trivia;
- trivia stored on wrappers (`$_layout.trivia`, the written-sides map, the composed-trivia cache) and the client-side line-gap composition (`lineGapsOf`);
- `carryPlacement`, `carryElementTrivia` and the ir lane's edge-carrier rule. A projection copies no trivia from node to node; the ir lane spells a source's comments by writing comment nodes, built with the grammar's builders, to the gaps the table names;
- the client edited set, `markIndexEdited` and the refusal of writes through a query;
- the framed coordinate's trivia payload (`OutsideTrivia` on `SlotValue::Coord`). The renderer reads the gap from the table.

## 6. Order

The table lands in the shared arena's step 3, ahead of the record wire, in its own plan (`docs/superpowers/plans/2026-10-10-arena-tables.md`). The typed reader's steps 1 and 2 land first, with the refusal of writes through a query in place until the table.

## 7. Rulings on the open questions

1. **Built gaps follow the same convention as parsed ones.** A built node's gaps are numbered by its children: gap *i* lies between child *i* and child *i + 1*. Its leading and trailing edges belong to its holder, as tree-sitter would place them, because a node never starts or ends with an extra. A built node's own table holds only its inner gaps. A parsed node placed in a built holder keeps its inner gaps in its tree's table, and the holder's table holds the gaps around it.
2. **Ownership after a reparse follows the convention.** If a comment is written through one node but tree-sitter's convention gives it to another, a reparse reports it on that other node. The convention, not the call that wrote it, decides ownership.
3. **Whitespace is measured first.** The plan measures the table's size on the corpora with every whitespace extra stored, and with layout-bearing entries only (line breaks, blank lines, indentation), where spaces between tokens on a line are derived rather than stored. The measurement picks between the two.
