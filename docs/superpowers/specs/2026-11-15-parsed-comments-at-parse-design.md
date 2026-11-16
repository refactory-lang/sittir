# A parse places comments and nothing else

**Status:** approved in direction by the maintainer, 2026-11-15. The output examples, the deletion list and the order below were proposed by the peer that owns the arena work, from the engine's code. Entries marked "to verify" are checked on a probe before they are built. This supersedes lazy whitespace placement and the tree-owned placed-sides design that followed from it.

## Decided by the maintainer

- **"Lazy placement means we're storing a side channel for extra data we don't need... We are giving too much up just to preserve whitespace.... I don't think it's worth it"** (2026-11-15). This returns to the 2026-11-05 rulings "comments (nontrivial trivia) is important, but whitespace really isn't" and "addition by subtraction — simply remove the logic that creates the gaps table".
- **A parsed node does not behave differently from a built node** (2026-11-15, said while reading the render numbers).
- **Comments are placed "during parse for sure"** (2026-11-15).
- **How a placed side is stored: "it would be whatever matches built nodes"** (2026-11-16). Where this design leaves a form open, the form a built node already uses decides it.
- **Blank lines: "Yes, on list items only"** (2026-11-15). One fact, kept only for items of a list slot.
- **A list broken across lines: "Accept: options decide"** (2026-11-15).
- **Indentation: "We need a generic way to enforce this"**, with nothing specific to one grammar (2026-11-15).
- **"there should be no 'parse' side channel of data not captured within the materialized nodes"** (2026-11-12) stands, and this design applies it to placement.

## The end state

- An untouched parsed node is written as its source bytes, as today.
- A gap that a rebuilt parent writes comes from the render options. The source's whitespace there is not consulted.
- Comments and other extras are placed onto their owners during parse and kept. A parsed node's sides are read the same way a built node's are.
- No whitespace run, excess or baseline is computed for a parsed tree, in either storage. No per-tree placement state exists, and no render places anything.

## Comments at parse

- **The rule is unchanged.** An extra's owner is the smallest node holding both tokens round its gap. An entry that starts on the previous token's row trails the child before it; the rest lead the child after; with neither beside it, it is the owner's `inner`; a list passes it to the item.
- **Nothing under an ERROR or an extra is placed.** An ERROR is an entry written as its source text, so an ERROR or comment inside it is part of that text and lands in no side. `case *x,:` parses to an outer ERROR holding an inner ERROR for `:`; only the outer one is placed.
- **A source that is wholly an ERROR.** The root is the ERROR and nothing is above it, so the rule above does not apply: its text is one entry on the root's own `inner`, with no in-line run either side. Without it such a source would render empty once a render reads only the store.
- **When.** In the hydration walk. The walk meets each extra between its siblings in document order with their rows in hand, so it needs no rank, no token walk and no navigation. This assumes the parser attaches an extra as a child of its gap's owner (an extra never begins or ends a node). The parity test of step 1 proves it on every fixture; where one disagrees, the walk hands the extra up or down to the owner by the two tokens' spans, which it holds.
- **Where.** In the held-sides store, under the key a parsed node's written side already uses. A parse-placed side and a caller-written side of the same node are then one entry in one store, read by one path, and a write replaces the entry. The store's contract changes with it: written trivia was an overlay over what placement assigned, and with no placement there is nothing underneath.
- **The entry's form is the built one.** A placed comment or ERROR is stored as a pointer to its own record, the entry a built node's side holds when a parsed comment is written onto it, and the render writes that record's source text. No coordinate is stored in a side. This follows the arena design: "A parsed node uses the built node's address-keyed paths where one exists: written sides, the render entry, cell and side-record reads, counts." Two consequences, both making a parsed node match a built one:
  - An ERROR does not keep the in-line whitespace beside it; the options write that gap, as they do for a built node holding a parsed ERROR.
  - A line continuation (python's `\`) is placed (the maintainer, 2026-11-16: "it should be placed"). In the grammar it is a named extra, `line_continuation_newline` and `line_continuation_nul`, declared beside `comment`, so it has a record of its own and is not the whitespace pattern this design stops keeping. Its entry is a record pointer, as a built node's side holds one. The space before the backslash is a gap, so the options write it: one space before a line continuation, for built and parsed nodes alike (the maintainer, 2026-11-16: "Record pointer, fix the gap"). `total = a + \` then renders with its space under a rebuilt parent, and a built node that renders `a +\` today renders `a + \`. Its text holds its own line break, so a rebuilt parent neither joins nor splits the statement. It stays an extra: it may sit between any two tokens, so no rule can hold it in a slot.
- **Line breaks beside a comment.** Today a comment carries no line fact of its own: whether it sits on its own line is held by the whitespace runs beside it, which this design deletes. Parse therefore writes the side as a caller writes one on a built node: the comment's entry, with a line-break member before or after it where the source has a break there, and nothing where it doesn't. One representation serves parsed and built nodes and no field is added. Without it `// own line\nlet y` could render as `// own line let y`; this is not style. To verify on the probe: what the options write after a built node's line comment that has no member beside it. A line comment must never be followed on its line by code, whatever the side holds.
- **Release.** A parse-placed side is node data with the lifetime of its record. A read's records are freed with the engine's arena, and the store with them; neither is released earlier today. When read records become individually releasable, their entries are dropped in the same callback that drops a built record's sides. To measure on the probe: retained bytes per parse on a comment-heavy file, since they stay as long as the records do. The maintainer has since ruled that this is not the end state: "parsed node release vs. built node release really ought to be no different" (2026-11-16). One release behaviour for both is designed separately, proposal before code; this design only requires that a parsed node's store entries go in the same callback that releases its record.
- **Cost.** Extras are about 0.1% of record words on the paired corpora (46, 9 and 43 extras in the python, typescript and rust corpora). Parse time and retained bytes on a comment-heavy file are measured on the probe.

## The blank-line fact

A list item after the first that follows a blank line in the source carries that fact, and a rebuilt list writes exactly one blank line before such an item, whatever the run's length was.

**Form (maintainer's direction, 2026-11-15: "layout entries can be added to $trivia maybe we ought to use the trivia table here as well").** The fact is a blank-line layout entry, the first entry of the item's leading side, in the same store as its comments: the entry a caller already writes through `$trivia` on a built node. A built item can then carry it too, and one read path serves both. A flag on a parsed record's run entry was the earlier form; it costs no storage but only a parsed node could hold it. The cost of the entry form (a store entry per blank-line gap between list items) is measured on the probe before step 2 is built: gaps per corpus, parse time, retained bytes. The points below on the flag's storage apply only if the measurement sends this back to the flag.

- It is set only between items of a list slot (statements, members, arguments). The gap after an opening token and the gap before a closing one belong to the tokens and come from the options, so a list's first item never carries the flag (maintainer, 2026-11-15: "Between items only").
- With leading comments, the flag is measured from the previous item's end to the start of the item's first leading entry, so `a();\n\n// c\nb();` keeps the blank line above the comment. A blank line between a leading comment and its own item (`// d\n\nc();`) is not kept: the comment's line fact puts it on its own line directly above (maintainer, 2026-11-15: "Above the comment only").
- It adds no stored word: a record child's run entry has spare bits, and a slot-held row uses a spare bit of an existing count.
- Parse does one comparison per gap between list items, of two row numbers the walk already holds. Nothing reads the flag unless the list is rebuilt.

## Indentation

One rule, for every grammar:

- A line a rebuilt parent writes is indented with the source's inferred indentation unit. The unit is inferred once per source, for every grammar, and kept when it differs from the engine's. To verify on the probe: that every line a rebuilt parent writes uses the inferred unit, with no deviation in play.
- An untouched slice moved to another depth is re-indented from its first line: each later line that starts with the first line's source indentation has that prefix replaced by the unit times the new depth. A later line indented less than the first, a line that begins inside a token, and a blank line keep their bytes.
- In a grammar that has depth tokens, the slice's net depth move is applied to the writer. Whether a grammar has depth tokens is a fact of the grammar, never its name.

The second and third exist in the engine today and stay.

What goes is the writer's excess: extra indentation levels the source opened beyond the template's depth, restored per frame. It is a stored whitespace deviation. It matters only when the over-indented thing is itself a child the rebuilt parent places: that child is re-indented to unit times depth. An over-indented continuation inside an untouched statement (`x = g(\n            1,\n            2)`) is part of a slice and keeps its bytes. To verify on the probe: a measured example of the first case, and that no depth-token grammar relies on excess for correctness.

## What the output looks like

Only gaps a rebuilt parent writes change.

| case | source | today | after |
|---|---|---|---|
| rebuilt root, blank lines between untouched statements | `const   x  =  1;\n\n\nfoo( a,b );   // trail\n// own line\nlet y = [1,2,\n   3];\n` | `const   x  =  1;\n\n\nfoo( a,b ); // trail\n// own line\nlet y = [1,2,\n   3];\n` | `const   x  =  1;\n\nfoo( a,b ); // trail\n// own line\nlet y = [1,2,\n   3];\n` |
| rebuilt statement over untouched children | `const   x  =  1;` | `const x  =  1;` | the same |
| rebuilt block | `{\n\n    a();\n\n\n    b();  // why\n}` | `{\n\n    a();\n\n\n    b(); // why\n}` | `{\n    a();\n\n    b(); // why\n}` |
| rebuilt function over a body indented by eight spaces | `def f():\n        x = 1\n\n        return x  # done\n` | the function's bytes, unchanged (the file's final `\n` is the root's) | the same |
| a call rebuilt over an untouched broken argument list | `f(\n  a,\n  b,\n)` | `f(\n  a,\n  b,\n)` (the list is a slice) | the same |
| a broken argument list rebuilt (one argument edited) | `f(\n  a,\n  b,\n)` | `f(\n  a,\n  b,)` (the break before `)` is already lost) | as the options write that list; the trailing comma is kept if the separator preference keeps it (to verify) |
| comments between list items, parent rebuilt | `a();\n\n// c\nb();\n// d\n\nc();` | byte-identical | `a();\n\n// c\nb();\n// d\nc();` |
| trailing comment on the same row | `b();  // why` | `b(); // why` | the same |

## What is deleted

All of it is shared engine code, so both storages change together and no difference between them is introduced.

- The baseline measure, whole: the recorder and its tallies, the recorded render of a region, the gap and depth lookups behind it, and the recording render path of each storage. It exists only to say what the options would write at a gap, so that a deviation can be stored.
- Layout runs, run excess and the deviation lookup; whitespace a parse derives as a deviation from the options. A whitespace member a caller can write on a built node stays, and is the form parse uses for a line break beside a comment.
- The whitespace half of list slots (the per-side class). The separator half is a preference choice and stays, compared with the options directly.
- Per-tree placement state, its lock and its published tables in object storage, and the per-call placement table in arena storage.
- The placer.
- To trace before deleting: the depth anchors and level lookups, to separate what served whitespace deviations from what the indentation rule above still needs.

The JavaScript surface that carries layout (the snapshot and slot layouts of a read) shrinks or goes. Those are API rows, listed for the maintainer once the deletion is drafted.

## What the gates will show

- **Untouched trees.** Read then render is still the source bytes, so byte round-trip rows do not move.
- **Rebuilt trees.** Read-render-parse rows compare trees, not bytes, and hold if a comment keeps its side and its line fact.
- **Tests that pin preserved whitespace under a rebuilt parent** change by design. They are counted and listed with the deletion; each is shown to pin the superseded behaviour before its expectation changes.
- **Benchmarks.** Expected, not measured: a first render loses the placement share in both storages; arena storage stops re-placing on every render; a render of an edit result loses the baseline's recording render. Parse gains a comparison per list gap and work proportional to the number of extras.

## Order

1. The parse-time comment placement, with the lazy placer still present and still the only thing a render reads. A side the store holds masks the placer's side, whitespace runs included, so a parse-placed side is not read by a render until step 3; this step changes no output. A parity test compares, per fixture, node and side, the extras and ERRORs the placer assigns (kind and span, in order) with what parse stored, and each extra's line breaks in the source with the members written beside it.
2. The blank-line flag.
3. Switch a render to the parse-placed sides, delete the baseline, deviations and runs, and retake the expectations the ruling changes, in one change.
4. Delete the placer and per-tree placement.
5. A census of what still reads the plain token rows (6% to 17% of record words). Whether they can go is a separate decision.

Each step is measured on a paired run against master's arena on the pinned toolchain.

## What this does to work in flight

- The fix that stops an edit copying a parsed node's sides eagerly is unaffected.
- The hand-off of sides from a render gets smaller (comment sides only) and is re-measured.
- The cached-position navigation change was measured on placement, and is re-measured against the readers that remain before it lands.
- The walk-order stamp on records is dropped.
- The per-call scratch allocator spec still applies to per-call navigation tables. Its allocation count is taken after step 4, since the placer was the largest per-call allocator.
- A full per-call reformat and style inference from sources stay parked.
