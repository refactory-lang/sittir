# Trivia table: probes

Measurements for `docs/superpowers/specs/2026-10-09-trivia-table-design.md`.

## `whitespace.mts`: whitespace is layout only

What a parsed tree's trivia table stores, three ways: only the gaps whose layout differs from their seam default, by a line class or an in-line one; every whitespace run; and the source's line layout (every run that holds a break), which an earlier ruling stored. Its header says how it measures. In short, each source's gaps are compared with those of its **default render**: the source's snapshot with every `span` removed, so every gap renders with its seam default. The two token walks are lined up one to one, and each differing gap is classed:

- **(a)** the source breaks where the default does not;
- **(b)** the default breaks where the source does not;
- **(c)** both break, with a different count of blank lines;
- **(d)** both break alike, with a different indentation;
- **(e)** neither breaks, and the in-line class differs: tight (no space), tabs, or a space (any other run);
- **(f)** neither breaks, the in-line class is the same, and the run differs (a wider space).

(a)–(e) are what differs from the defaults, and a parsed tree's table stores them: an in-line class that differs is a layout difference, as a break is (the maintainer, 2026-10-12). (f) derives from the seam defaults. A "moved" gap holds comments the default render does not hold in the same order.

```sh
SITTIR_BACKEND=native ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts /tmp/whitespace.json
```

### Results

At `feat/vocab-export-type` `db010af12`: `feat/bindings` `8de42a615` with a vocabulary change that touches no render. Every source aligned and no render failed. The first measurement, at `feat/arena` `8c05bca7e`, counted (e) and (f) as one class and stored neither.

| set | sources | gaps | (a) | (b) | (c) | (d) | (e) | (f) | moved | stored: entries | bytes | empty gaps | every run stored: entries | bytes | empty gaps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rust corpus | 148 | 4862 | 237 | 52 | 52 | 50 | 73 | 1 | 1 | 464 | 798 | 4400 | 2464 | 3316 | 2434 |
| typescript corpus | 119 | 4035 | 173 | 79 | 47 | 66 | 94 | 1 | 1 | 459 | 847 | 3575 | 2366 | 3061 | 1679 |
| python corpus | 116 | 3700 | 126 | 4 | 58 | 114 | 100 | 11 | 2 | 402 | 734 | 3304 | 1744 | 2954 | 1996 |
| scm corpus | 19 | 780 | 59 | 0 | 27 | 4 | 0 | 0 | 0 | 90 | 212 | 693 | 311 | 433 | 472 |
| regex corpus | 37 | 473 | 21 | 0 | 0 | 0 | 0 | 0 | 0 | 21 | 21 | 452 | 21 | 21 | 452 |
| `engine.rs` | 1 | 2944 | 152 | 0 | 36 | 6 | 0 | 0 | 0 | 194 | 2094 | 2750 | 1216 | 4572 | 1795 |
| `spacing.rs` | 1 | 8840 | 280 | 8 | 96 | 0 | 50 | 0 | 0 | 434 | 4464 | 8406 | 2970 | 13572 | 5987 |
| `create-engine.ts` | 1 | 2160 | 84 | 2 | 3 | 113 | 2 | 0 | 0 | 204 | 595 | 1956 | 917 | 1318 | 1243 |

**Storing only the differing gaps, between one gap in nine and one in twenty-two stores an entry** (typescript corpus 11 %, rust corpus 9.5 %, `spacing.rs` 4.9 %, regex corpus 4.4 %). The in-line classes are 16 % of the rust corpus's entries, 20 % of typescript's and 25 % of python's. With every whitespace run stored, it is about half. On the arena inputs the differences store 2094 / 4464 / 595 bytes against 4572 / 13572 / 1318.

Examples of each class:
- **(a)** the corpus's leading line break (`<start> | async`), and a struct literal the source breaks across lines (`engine.rs`, `{ | parent`).
- **(b)** a one-line block the default breaks (`async { let x = 10; }`, `{ | let`), and a file with no final line break (python, `| <end>`).
- **(c)** two blank lines where the default writes one (`; | mod`).
- **(d)** the corpus's two-space indentation against the default's four.
- **(e)** tight where the default spaces (`Item=(` against `Item = (`, closure bars `|w|` in `spacing.rs`), and a space where it is tight (typescript `{ }` against `{}`). The wrong seam defaults show here too: the default writes python's `print (` and typescript's `?(` and `=++`.
- **(f)** a wider space, which the class does not keep: aligned columns (python, `:  handle_click_at`) and a doubled space (rust, `mut  z`).

**Moved gaps.** There are four, and none is a layout entry:
- **Rust "Line doc comment with no EOL"** (`\n//! Doc comment`, no final line break). The default render ends the comment with a line break, because a line comment holds a terminated break that the render writes even at its end (`LineHold::Terminated`). The source's layout has no break there, so the render reproduces it only if a stored layout of fewer breaks beats the held break at the end of a document.
- **Typescript "Object types with automatic semicolon insertion".** The source's `ERROR` text is missing from the default render: the read drops an `ERROR` placed on a `predefined_type` enum leaf. The assignment walk gives it a side (`ERROR` is an entry).
- **Python's line continuations** ("Function definitions", "Escaped newline"). The default render drops the source's `\⏎` extras: `) \⏎or` renders `) or`, and three continuations after a final `pass` render as one line break.

**What a parsed tree's table stores:** the differences, classes (a)–(e), the "stored" columns above. The earlier ruling stored the source's line layout instead, every run that holds a break whatever its default, and no in-line run:

| set | entries | bytes | empty gaps |
|---|---|---|---|
| rust corpus | 873 | 1724 | 4024 |
| typescript corpus | 690 | 1384 | 3354 |
| python corpus | 763 | 1962 | 2957 |
| scm corpus | 130 | 252 | 653 |
| regex corpus | 21 | 21 | 452 |
| `engine.rs` | 436 | 3633 | 2522 |
| `spacing.rs` | 1177 | 11536 | 7698 |
| `create-engine.ts` | 227 | 628 | 1933 |

That is about twice the differences (rust corpus 873 entries against 464), the cost of knowing the layout at read with no baseline. The ruling now takes its baseline from the writer: what the options render at a gap.

**What a `$trivia` read returns.** A side's entries are its comments and `ERROR`s with their text, and each layout difference as its whitespace member: a break, a blank line, indentation as depth members, or an in-line class (`_space`, `_tab`, `_tight`). A run that matches what the options render is no entry, on one line or across lines.

## `table-census.mts`: a gap's owner is the parser's own

For every corpus entry (`walk.mts`, zero-width tokens included), each entry (an extra or an `ERROR`) in gap *k* is checked: is the smallest node containing tokens *k* and *k + 1* the entry's tree-sitter parent? It also records the side the assignment gives it.

```sh
./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/table-census.mts /tmp/table-census.json
```

### Results

At `feat/arena` with Task 2's native table.

| grammar | sources | entries | owner not parent | leading | trailing | of which before a closing edge | inner | unowned | hidden-token texts | node-edge tokens | zero-width leaves | `ERROR` | native elsewhere | placed elsewhere by the reader |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rust | 148 | 43 | 0 | 8 | 4 | 0 | 31 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| typescript | 115 | 10 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 209 | 2 | 0 | 0 |
| python | 116 | 46 | 0 | 23 | 23 | 5 | 0 | 0 | 0 | 168 | 455 | 1 | 0 | 9 |
| scm | 19 | 3 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| regex | 37 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

**Every entry's owner is its tree-sitter parent**, once the walk yields python's hidden zero-width tokens. `_indent` and `_dedent` are no nodes, but tree-sitter extends a block over the comments up to its dedent. A walk that sees only visible tokens finds 9 python comments at a block's edge whose smallest node spanning the gap is the block's parent (`module`, `if_statement`), not the block. The walk puts a zero-width token at each node edge that reaches past the node's own first or last token (168 in python, none elsewhere), and the gap splits there.

Every corpus entry lands in a side; none is unowned. **The native table agrees** (Task 2): the census reads every node's sides through `triviaSide` and finds each extra on the node and side the assignment gives it, and each `ERROR` on its side (`native≠` 0 in every grammar).

**Where the table and the reader's placement differ.** Nine python comments, each after a `case …:` colon on the case's line (`case Color.RED:  # c`). The colon is the case clause's own token, so no child ends at it, and the comment leads the clause's `suite_block`; the reader seats it as the trailing of `case_patterns` and holds it past the colon (`tokens_between`). The table's side renders after the colon by its position. Every other corpus extra sits where the reader seats it. Five python comments lie after a block's last statement, before its dedent: the edge token on their right is the block's own, so they trail the last statement, inside the block. Whitespace between two children is never a token: python's `_newline` text is a gap's line break, equal to its seam's default.

## `baseline-cost.mts`: what the read-time baseline costs a tree

Over every corpus entry, the cost of computing what a tree stores of its layout (`storedLayout`, which renders the baseline records the deviation test reads) against a plain render of the same tree from its templates (read to full depth, rendered under its options). Each mode runs in a child process of its own, so its peak resident size is its own; the `parse` mode only parses and is the floor. Each mode reports its fastest of five passes.

```sh
SITTIR_BACKEND=native ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/baseline-cost.mts 5
```

### Results

On the layout-deviations branch, with the machine fully loaded by other work, so CPU time (user+sys, in parentheses) is the figure to read; wall time is shown as measured.

| grammar | entries | parse ms | plain ms | baseline ms | baseline ÷ plain (CPU) | parse MB | plain MB | baseline MB |
|---|---|---|---|---|---|---|---|---|
| rust | 148 | 4.8 (5) | 492.0 (199) | 118.8 (35) | 0.18 | 155 | 270 | 150 |
| typescript | 118 | 3.5 (4) | 277.5 (146) | 134.6 (40) | 0.27 | 153 | 274 | 169 |
| python | 116 | 3.6 (4) | 512.2 (162) | 107.2 (43) | 0.27 | 143 | 294 | 154 |
| scm | 19 | 0.4 (0) | 59.2 (16) | 4.4 (4) | 0.25 | 123 | 134 | 121 |
| regex | 37 | 0.5 (1) | 9.8 (11) | 1.9 (2) | 0.18 | 137 | 131 | 118 |

**The baseline costs a fifth to a quarter of a plain render of the same tree**, and its peak memory stays at or below the plain render's: the region records render only what each run needs (`region_depth`), and each record is kept and shared by the runs it answers.
