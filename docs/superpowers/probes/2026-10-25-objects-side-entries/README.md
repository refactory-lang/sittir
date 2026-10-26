# Objects side entries, read where they live

A design note for the objects storage: a side entry's own sides are read where they live, at render, as records read them. Measured at `632077301` (master `c551239cf` with the side nesting bound) and `5501e5697` (the records stack). `run.sh <checkout> [construction...]` reruns the probe; `results/` holds each construction's output.

## 1. What renders

The rust grammar, one case per row. `x; /* parsed */` is a parsed comment read from another tree; `/* c */` and the comments written on an entry are built.

| case | master objects | stack objects, arena objects | stack records |
| --- | --- | --- | --- |
| A. parsed holder, built entry, side written on the entry after placing | `g(); /* c */` | `g(); /* c */` | `g(); /* later */ /* c */` |
| B1. built holder, parsed entry with a written side | `y; /* parsed */` | `y; /* 0 */ /* parsed */` | `y; /* 0 */ /* parsed */` |
| B2. built holder, parsed entry, side written on it after placing | `y; /* parsed */` | `y; /* 0 */ /* parsed */` | `y; /* 0 */ /* parsed */` |
| B3. parsed holder, another tree's parsed entry, side written on it after placing | `g(); /* parsed */` | `g(); /* 0 */ /* parsed */` | `g(); /* 0 */ /* parsed */` |
| control: parsed holder, built entry written on before placing | `g(); /* later */ /* c */` | same | same |
| control: built holder, built entry, side written on it after placing | `y; /* later */ /* c */` | same | same |
| control: parsed holder, another tree's parsed entry with a written side | `g(); /* 0 */ /* parsed */` | same | same |

Records render every case with the entry's current sides. Master objects loses them in all four, and the stack's objects storages lose them in case A.

## 2. What the specs say

- Trivia table § 3: "A node's trivia is keyed by the node, so it travels with the node. A parsed node placed in a new parent, a `$with` or a built holder carries its own sides and its descendants'."
- Trivia table § 7.1: "A parsed node placed in a built holder keeps its sides where they are: assigned in its tree's table, written under its tree and row."
- Trivia table § 1: "A write stores the built node's value." The entry's value, its kind and fields, is stored; its sides are keyed by the entry (§ 3). Records do exactly this: a side holds the record, which is immutable, and the record's sides are keyed by its address in the written-sides store.
- Shared arena § Trivia: until the record step "a built node keeps its trivia on the node, and `$trivia` reads the same on parsed and built nodes". On objects, a built entry's sides live on its JavaScript node.
- Shared arena § Render: "A parsed node crosses as its coordinate."

So every case in § 1 should render the entry's sides as they are at render, on every storage.

## 3. Why objects lag

**B: a parsed entry is not held by reference.**

- In a parsed holder, the write (`triviaWriter` → `entrySnapshotOf`) stores the parsed entry's snapshot, its sides as they were at the write (B3).
- In a built holder, the holder keeps the read entry by reference in its own trivia, but `entryData` crosses it to native as data. A read node is not a bare coordinate (its coordinate is `$_layout.at`, so `isCoordinate` is false). Its `$text` and keys cross, while the sides its tree's table holds for it stay behind (B1, B2).

The stack fixed both with two mechanisms, neither on master:

- `dc4279ff1`: a live read entry of the holder's language crosses into any native table as its coordinate (`sideEntryOf`). The table holds that tree's token, so the tree lives while a side names it. Reads stamp each coordinate with its own tree's token, a snapshot detaches a coordinate entry when it is taken, and another language's entry refuses by name.
- `3a96b8c73`: an untouched read node crosses render as its coordinate. Native prepare collapses it to `SlotValue::Coord` (`SourceTable::renders_as_source`, `NodeLayout::source_coordinate`), so a built holder's read entry renders from its tree, its table sides included.

**A: a built entry in a parsed table is its snapshot.** The write stores the entry's snapshot, its own sides included, and a later write on the entry changes only its JavaScript node. The stack has the same gap. `dc4279ff1` says: "Object-node entries in native tables are still snapshotted; they move to reference reads with the objects port."

## 4. Design

### B: port the stack's two mechanisms

Port them, not a third rule, so master and the stack keep one derivation:

- the objects half of `dc4279ff1`: `sideEntryOf`'s read-entry arm (`readCoordinateOf`) for the parsed-table write, the table's tree holds, the reads' coordinate stamps, the snapshot's detach, and the foreign-language refusal. Not its record entries.
- the core half of `3a96b8c73`: the prepare collapse of an untouched read node, `renders_as_source` and `source_coordinate`. Not its arena parts.

A read entry with a write inside its own range (on its content's sides, say) is not untouched. It keeps rendering from its data, as it does on the stack. The port starts by checking what `3a96b8c73` needs from the stack commits before it (the flanks stamped at read, the one native source-text call). If that closure is large, the fallback is the same rule at the JavaScript crossing: `entryData` crosses an untouched live read entry as its coordinate, as `toNodeValue` crosses a tree-backed node.

### A: a parsed table's written side holds JavaScript entries by reference

The one copy of a built objects entry is its JavaScript node. Options:

1. **Client-held written sides, projected per call (recommended).** A parsed tree's written side that holds a built objects entry is held in JavaScript, keyed by (tree, row, side), as the side's entries. Native keeps the side's edited mark. Each native call that reads written sides gets the projection of the JavaScript entries for that call, the way a built root's data is projected for its render (`entryData`, at the side's nesting). Native holds no copy, and nothing re-writes a table when an entry changes. The call sites are the tree handle's (`packages/common/src/engine.ts`):
   - `render` and `renderToFile`, through the render's source table (`SourceTable::sides` reads the call's projection before the tree's table);
   - `snapshot`, which reads the same projection;
   - `triviaSide` and `unitSides`, which answer from the JavaScript side directly;
   - `writeTriviaSide`, which records the entries and marks the side edited.

   A render can reach a tree other than its root's, through a coordinate entry or a parsed child. Each call therefore carries the projections of every tree in its engine that holds such a side. The cost is one projection per client-held side per call.
2. **Re-write the table when an entry changes.** Ruled out: it is a second copy kept in step.
3. **Give a built objects node a place in a native written-sides store.** This is the record step's store (`2e0fde9eb` on the stack), applied to objects nodes once placed. The node's sides would move out of JavaScript, so every reader of an objects node's trivia (`toNodeValue`, `snapshotOf`, `sidesOf`, `$trivia`) would consult the store for a placed node. That is the record step's work, for a storage the record step replaces.
4. **Refuse a write on a placed entry.** Honest, but objects would then disagree with records on case A, and the paths must agree byte for byte.

## 5. Tests and gates

- Case A and B1–B3 as red tests on master, each expecting the records column's bytes on every construction the checkout has. The controls stay as they are.
- The side nesting and cycle tests stay green. The bound counts a client-held side's entries at its side's nesting.
- The usual three-way verification: the targeted probes, `validate history` rows compared, and the full suite.
