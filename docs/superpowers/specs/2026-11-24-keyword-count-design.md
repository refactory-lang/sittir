# A repeated keyword is a count: design

**Status:** the shape approved by the maintainer, 2026-11-24 ("Count stored as a number", chosen over a leaf whose text varies and over a list of empty positions). The details below are brainstorm's calls on that ruling. Builds after `plans/2026-11-06-arena-trees-from-records.md` Task 6's PR (#1227), because it changes what a record's cell holds and what a render writes.

## Why

- C#'s implicit array (`new[,,] { 1 }`) and its unbound generic type (`typeof(D<,>)`) each hold `repeat(',')` inside a larger rule. The comma's count is data: the array's rank, the type's arity.
- The generator loses that count in two ways. It collapses a repeat of one fixed token inside a rule to a boolean slot, which records only whether the keyword occurs, so `new[,]` and `new[,,]` read and build the same. And it folds a rule made only of fixed text, repeat included, into a pattern leaf, so `D<,>` has no slot at all.
- A census of eight grammars' parser grammars (typescript, rust, python, regex, scm, C#, Java, Go; C's was not generated in the trees read, so it is not checked) finds one other site: python's `import_prefix` (`from ... import x`), a whole rule that is only `repeat1('.')`.

## The rule

- **A repeat of one fixed token is always a slot** (the maintainer, 2026-11-24: "we should definitely set Nonterminal = true/Multiplicity=xxx for Repeat(String(','))"). The model holds it as a nonterminal whose one value is the terminal, with multiplicity `array` for `repeat` and `nonEmptyArray` for `repeat1`. It is never folded into a pattern leaf, and never collapsed to a boolean.
- **Its storage is `count`.** A new `FieldStorageKind`, beside `boolean` and `bitflag`, derived from that slot: one terminal value whose multiplicity is `array` or `nonEmptyArray`. Today `keywordPresenceKind` returns `boolean` for exactly that case. The value is how many times the keyword occurs, and its least value comes from the multiplicity (0 for `array`, 1 for `nonEmptyArray`), not from a second check. It is the boolean slot's case with more than one occurrence: a boolean slot records whether its keyword occurs, and a count slot records how many times.
- **What the model holds today** (C#'s node model):
  - `implicit_array_creation_expression` already has the slot, `comma`, with `multiple: true` and one terminal of multiplicity `array`, but `"storage":"boolean"`;
  - `type_argument_list_unbound` (`<` `repeat(',')` `>`) is a pattern leaf with no slots, because every token of it is fixed text. It becomes a node whose slot is the count, with `<` and `>` as fixed text.
- The slot takes its name the way any slot does (C#: `commas`).
- **Python's `import_prefix` is a count too** (the maintainer, 2026-11-24: "yes"). Its whole body is `repeat1('.')`, today a leaf whose text varies (`'..'`). It becomes a node whose one slot is the count, `dots`, so `from .. import x` reads `{ dots: 2 }`. This changes a stable grammar's public surface.

## Read, build and render

| | `new[,,] { 1 }` | `new[] { 1 }` | `typeof(D<,>)` | `from .. import x` |
|---|---|---|---|---|
| read | `{ commas: 2 }` | `{ commas: 0 }` | `{ commas: 1 }` | `{ dots: 2 }` |
| build | `{ commas: 2 }` | `{ commas: 0 }` or absent | `{ commas: 1 }` | `{ dots: 2 }`; 0 is refused |

- **Read.** The slot reads as a non-negative integer, and a `repeat1` slot reads 1 or more. The portable surface reads it as a number.
- **Build.** The slot takes a non-negative integer, and a `repeat1` slot takes 1 or more. Anything else is refused at build, naming the slot. A `repeat` slot left out is 0.
- **Render.**
  - An untouched node renders its source slice, as every untouched node does.
  - A built or edited node writes the keyword as many times as the count says. Between two of them the keyword's own preferences apply, as they do wherever the keyword is written (C#'s `','` is tight before it).

## Storage

- Like a boolean slot's flag, the count is held in the holder's cell, and its keywords get no rows, in both storages.
- Like a flag's keyword, a counted keyword has no cell of its own, so it has no site, no side is kept on it, and no query yields it. The read spec's rules for a boolean slot's keyword (`specs/2026-11-17-read-without-fixed-token-rows-design.md`, "keyword unit … for a boolean slot, the slot's flag") apply to each occurrence.

## Verification

- typescript, rust, regex and scm generate byte-identical: none of them holds such a repeat.
- Python changes only at `import_prefix`, and its API rows go to the maintainer with the PR. `from . import x` and `from .. import x` read their counts, render untouched as their source, and rebuild to the same text in both storages. A count of 0 is refused at build.
- C#: `new[,] {1}`, `new[,,] {1}`, `new[] {1}` and `typeof(D<,>)` parse with no errors, read their counts, render untouched as their source, and rebuild to the same text in both storages. A negative count, and a count of 0 in a `repeat1` slot, are refused at build.
- `new[1] {1}` stays refused by the parse (CS0178).

## Left to the builder

- How the count is laid out in a cell, and how the native render writes the repeated keyword.
