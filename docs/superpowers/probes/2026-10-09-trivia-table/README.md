# Trivia table: probes

Measurements for `docs/superpowers/specs/2026-10-09-trivia-table-design.md`.

## `whitespace.mts`: whitespace is layout only

What a parsed tree's trivia table stores when a seam's source layout is stored only where it differs from the seam's default, and spaces within a line derive from the defaults. Its header says how it measures. In short, each source's gaps are compared with those of its **default render**: the source's snapshot with every `span` removed, so every gap renders with its seam default. The two token walks are lined up one to one, and each differing gap is classed:

- **(a)** the source breaks where the default does not;
- **(b)** the default breaks where the source does not;
- **(c)** both break, with a different count of blank lines;
- **(d)** both break alike, with a different indentation;
- **(e)** neither breaks, and the in-line run differs.

(a)–(d) are stored, one layout entry each. (e) is derived. A "moved" gap holds comments the default render does not hold in the same order.

```sh
SITTIR_BACKEND=native ./node_modules/.bin/tsx docs/superpowers/probes/2026-10-09-trivia-table/whitespace.mts /tmp/whitespace.json
```

### Results

At `feat/arena` `8c05bca7e` (`feat/typed-reader` `5604cd7c0`). Every source aligned and no render failed.

| set | sources | gaps | (a) | (b) | (c) | (d) | (e) | moved | stored: entries | bytes | empty gaps | every run stored: entries | bytes | empty gaps |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| rust corpus | 148 | 4862 | 241 | 52 | 67 | 50 | 91 | 1 | 410 | 794 | 4470 | 2464 | 3316 | 2434 |
| typescript corpus | 115 | 3980 | 171 | 79 | 46 | 66 | 158 | 1 | 362 | 802 | 3617 | 2327 | 3022 | 1663 |
| python corpus | 116 | 3700 | 126 | 4 | 59 | 108 | 112 | 0 | 297 | 688 | 3409 | 1744 | 2954 | 1996 |
| scm corpus | 19 | 780 | 59 | 0 | 27 | 4 | 14 | 0 | 90 | 212 | 693 | 311 | 433 | 472 |
| regex corpus | 37 | 473 | 21 | 0 | 0 | 0 | 0 | 0 | 21 | 21 | 452 | 21 | 21 | 452 |
| `engine.rs` | 1 | 2944 | 153 | 0 | 39 | 6 | 0 | 0 | 198 | 2101 | 2746 | 1216 | 4572 | 1795 |
| `spacing.rs` | 1 | 8840 | 281 | 8 | 96 | 0 | 50 | 0 | 385 | 4465 | 8455 | 2970 | 13572 | 5987 |
| `create-engine.ts` | 1 | 2160 | 84 | 2 | 3 | 113 | 2 | 0 | 202 | 593 | 1958 | 917 | 1318 | 1243 |

**Under the rule, about one gap in ten to twenty-five stores an entry** (rust corpus 8 %, `spacing.rs` 4 %). With every whitespace run stored, it is about half. On the arena inputs the rule stores 2101 / 4465 / 593 bytes against 4572 / 13572 / 1318.

Examples of each class:
- **(a)** the corpus's leading line break (`<start> | async`), and a struct literal the source breaks across lines (`engine.rs`, `{ | parent`).
- **(b)** a one-line block the default breaks (`async { let x = 10; }`, `{ | let`), and a file with no final line break (python, `| <end>`).
- **(c)** two blank lines where the default writes one (`; | mod`).
- **(d)** the corpus's two-space indentation against the default's four.
- **(e)** in-line spacing (`Item=(` against `Item = (`), derived from the seam defaults. The wrong seam defaults show here too (python `print (`, typescript `void ;`).

**Moved gaps.** There are two, and neither is a layout entry:
- **Rust "Line doc comment with no EOL"** (`\n//! Doc comment`, no final line break). The default render ends the comment with a line break, because a line comment holds a terminated break that the render writes even at its end (`LineHold::Terminated`). The source's layout has no break there, so the render reproduces it only if a stored layout of fewer breaks beats the held break at the end of a document.
- **Typescript "Object types with automatic semicolon insertion".** The source's `ERROR` text is missing from the default render: the read drops an `ERROR` placed on a `predefined_type` enum leaf. The assignment walk gives it a side (`ERROR` is an entry).

**What a `$trivia` read returns under the rule.** A side's entries are its comments and `ERROR`s with their text, and the stored layout runs of classes (a)–(d) as whitespace members. A read today returns the comments the reader placed and the line-break runs the line-gap query derives (`lineGapsOf`), whatever their seam's default. Under the rule, a run equal to its default is not an entry, and an in-line run never is.
