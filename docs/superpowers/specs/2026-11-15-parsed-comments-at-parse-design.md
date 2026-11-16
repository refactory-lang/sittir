# A parse places comments and nothing else

**Status:** approved in direction by the maintainer, 2026-11-15. The output examples, the deletion list and the order below were proposed by the peer that owns the arena work, from the engine's code. Entries marked "to verify" are checked on a probe before they are built. This supersedes lazy whitespace placement and the tree-owned placed-sides design that followed from it.

## Decided by the maintainer

- **"Lazy placement means we're storing a side channel for extra data we don't need... We are giving too much up just to preserve whitespace.... I don't think it's worth it"** (2026-11-15). This returns to the 2026-11-05 rulings "comments (nontrivial trivia) is important, but whitespace really isn't" and "addition by subtraction — simply remove the logic that creates the gaps table".
- **A parsed node does not behave differently from a built node** (2026-11-15, said while reading the render numbers).
- **Comments are placed "during parse for sure"** (2026-11-15).
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
- **When.** In the hydration walk. The walk meets each extra between its siblings in document order with their rows in hand, so it needs no rank, no token walk and no navigation.
- **Where.** In the held-sides store, under the key a parsed node's written side already uses. A parse-placed side and a caller-written side of the same node are then one entry in one store, read by one path, and a write replaces the entry. The store's contract changes with it: written trivia was an overlay over what placement assigned, and with no placement there is nothing underneath.
- **The line fact stays.** Each entry keeps whether a line break sits before and after it. Without it `// own line\nlet y` could render as `// own line let y`. This is not style.
- **Release.** A source's entries go when its records are released. To verify on the probe: parse a comment-heavy file, release it, and the store is back to its size before.
- **Cost.** Extras are about 0.1% of record words on the paired corpora (46, 9 and 43 extras in the python, typescript and rust corpora). Parse time and retained bytes on a comment-heavy file are measured on the probe.

## The blank-line fact

A list item that follows a blank line in the source carries one flag. A rebuilt list writes exactly one blank line before such an item, whatever the run's length was.

- It is set only on items of a list slot (statements, members, arguments). A blank line anywhere else, such as before a closing brace, comes from the options.
- It adds no stored word: a record child's run entry has spare bits, and a slot-held row uses a spare bit of an existing count.
- Parse does one comparison per gap between list items, of two row numbers the walk already holds. Nothing reads the flag unless the list is rebuilt.

## Indentation

One rule, for every grammar:

- A line a rebuilt parent writes is indented with the source's inferred indentation unit. The unit is inferred once per source, for every grammar.
- An untouched slice moved to another depth has its lines' common source indentation replaced by the unit times the new depth. Lines that begin inside a token, and blank lines, keep their bytes.
- In a grammar that has depth tokens, the slice's net depth move is applied to the writer. Whether a grammar has depth tokens is a fact of the grammar, never its name.

All three exist in the engine today and stay.

What goes is the writer's excess: extra indentation levels the source opened beyond the template's depth, restored per frame. It is a stored whitespace deviation. A block the source indented deeper than its nesting is therefore re-indented to unit times depth once its parent is rebuilt. To verify on the probe: that no depth-token grammar relies on excess for correctness.

## What the output looks like

Only gaps a rebuilt parent writes change.

| case | source | today | after |
|---|---|---|---|
| rebuilt root, blank lines between untouched statements | `const   x  =  1;\n\n\nfoo( a,b );   // trail\n// own line\nlet y = [1,2,\n   3];\n` | `const   x  =  1;\n\n\nfoo( a,b ); // trail\n// own line\nlet y = [1,2,\n   3];\n` | `const   x  =  1;\n\nfoo( a,b ); // trail\n// own line\nlet y = [1,2,\n   3];\n` |
| rebuilt statement over untouched children | `const   x  =  1;` | `const x  =  1;` | the same |
| rebuilt block | `{\n\n    a();\n\n\n    b();  // why\n}` | `{\n\n    a();\n\n\n    b(); // why\n}` | `{\n    a();\n\n    b(); // why\n}` |
| rebuilt function over a body indented by eight spaces | `def f():\n        x = 1\n\n        return x  # done\n` | byte-identical | `def f():\n        x = 1\n\n        return x  # done\n` |
| a call whose argument list was broken across lines, one argument edited | `f(\n  a,\n  b,\n)` | broken as in the source | as the options write that list |
| trailing comment on the same row | `b();  // why` | `b(); // why` | the same |

## What is deleted

All of it is shared engine code, so both storages change together and no difference between them is introduced.

- The baseline measure, whole: the recorder and its tallies, the recorded render of a region, the gap and depth lookups behind it, and the recording render path of each storage. It exists only to say what the options would write at a gap, so that a deviation can be stored.
- Layout runs, run excess and the deviation lookup; whitespace as an entry or member of a side.
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

1. The parse-time comment placement and the side read from the store, with the lazy placer still present. A parity test compares the old and new sides for comments on every fixture.
2. The blank-line flag.
3. Delete the baseline, deviations and runs, and retake the expectations the ruling changes.
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
