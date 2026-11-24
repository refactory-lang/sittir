# A repeated keyword is a count: design

**Status:** the shape approved by the maintainer, 2026-11-24 ("Count stored as a number", chosen over a leaf whose text varies and over a list of empty positions). The details below are brainstorm's calls on that ruling. Builds after `plans/2026-11-06-arena-trees-from-records.md` Task 6's PR (#1227), because it changes what a record's cell holds and what a render writes.

## Why

- C#'s implicit array (`new[,,] { 1 }`) and its unbound generic type (`typeof(D<,>)`) each hold `repeat(',')` inside a larger rule. The comma's count is data: the array's rank, the type's arity.
- The generator collapses a repeat of one fixed token to a boolean slot, which records only whether the keyword occurs, so `new[,]` and `new[,,]` read and build the same.
- A census of eight grammars' parser grammars (typescript, rust, python, regex, scm, C#, Java, Go; C's was not generated in the trees read, so it is not checked) finds no other site. Python's `import_prefix` (`from ... import x`) is a whole rule that is only `repeat1('.')`, so it is already a leaf whose text varies, and it stays one.

## The rule

- **A count slot.** Where a rule holds a `repeat` or `repeat1` of one fixed token as part of a larger rule, that repeat is one slot whose value is a count: how many times its keyword occurs. It is the boolean slot's case with more than one occurrence: a boolean slot records whether its keyword occurs, and a count slot records how many times.
- A rule whose whole body is such a repeat is unchanged: it stays a leaf whose text varies.
- The layer names the slot, as it names any slot (C#: `commas`).

## Read, build and render

| | `new[,,] { 1 }` | `new[] { 1 }` | `typeof(D<,>)` |
|---|---|---|---|
| read | `{ commas: 2 }` | `{ commas: 0 }` | `{ commas: 1 }` |
| build | `{ commas: 2 }` | `{ commas: 0 }` or absent | `{ commas: 1 }` |

- **Read.** The slot reads as a non-negative integer, and a `repeat1` slot reads 1 or more. The portable surface reads it as a number.
- **Build.** The slot takes a non-negative integer, and a `repeat1` slot takes 1 or more. Anything else is refused at build, naming the slot. A `repeat` slot left out is 0.
- **Render.**
  - An untouched node renders its source slice, as every untouched node does.
  - A built or edited node writes the keyword as many times as the count says. Between two of them the keyword's own preferences apply, as they do wherever the keyword is written (C#'s `','` is tight before it).

## Storage

- Like a boolean slot's flag, the count is held in the holder's cell, and its keywords get no rows, in both storages.
- Like a flag's keyword, a counted keyword has no cell of its own, so it has no site, no side is kept on it, and no query yields it. The read spec's rules for a boolean slot's keyword (`specs/2026-11-17-read-without-fixed-token-rows-design.md`, "keyword unit … for a boolean slot, the slot's flag") apply to each occurrence.

## Verification

- typescript, rust, python, regex and scm generate byte-identical: none of them holds such a repeat.
- C#: `new[,] {1}`, `new[,,] {1}`, `new[] {1}` and `typeof(D<,>)` parse with no errors, read their counts, render untouched as their source, and rebuild to the same text in both storages. A negative count, and a count of 0 in a `repeat1` slot, are refused at build.
- `new[1] {1}` stays refused by the parse (CS0178).

## Left to the builder

- How the count is laid out in a cell, and how the native render writes the repeated keyword.
- The name of the model's storage for the slot, beside `"storage":"boolean"`, chosen from the words the model already uses.
