# Per-call reformat and `styleFrom`

Status: draft, parked by the maintainer (2026-11-05): not scheduled, not approved. Its `styleFrom` surface follows the maintainer's 2026-10-08 ruling.

## Why

- **No render of a parsed node is independent of its formatting.** A caller that compares two declarations, such as a vocabulary reader checking that two spellings of one type agree, can't: a union written over several lines with a leading `|` renders differently from its one-line form.
- **sittir can't be compared with a formatter.** Every render of a parsed tree preserves its source, and a formatter rewrites it, so the numbers aren't like for like.
- **A project's style can't be inferred.** `styleFrom`'s surface was agreed but never built.

The render-options design specified a per-call `reformat`, and it was never built. This design builds it and `styleFrom`. The default render's cost is handled separately and without changing its output: trivia is placed lazily, one layout owner at a time.

## Decided by the maintainer (2026-11-05)

- **The default render doesn't change.** Untouched nodes render as their source bytes. Gaps that rebuilt parents render keep their stored deviations from the options. Everything else comes from the options.
- **Reformat is per call:** `engine.render(node, { reformat: true })`.
  - It renders the whole node from the options: per-call options, then engine options, then the grammar's defaults.
  - It drops stored layout deviations, preference choices (delimiters, separators, optional tokens such as a leading `|` or a trailing comma) and the tree's inferred layer.
  - It never changes a parsed node's kind or form, or any text no option site governs.
- **Comments keep their line placement.** A comment on its own line stays on its own line, and an end-of-line comment stays trailing. That's one fact per comment.
- **Blank lines are kept, collapsed to one.** A gap holding one or more blank lines renders exactly one, as formatters do. That's one fact per gap that holds a blank line.
- **`styleFrom` is built with the surface already agreed,** which the maintainer ruled on 2026-10-08: `engine.styleFrom(...sources: (Tree | SourcePath<G>)[])`. It detects, applies the result as the engine's options (keys set in `createEngine` win), and returns the applied options with each key marked `detected`, `defaulted` or `set`. The layout-table spec's Detection section (`2026-10-02-layout-table-design.md`) is the one source of that surface, and this design adds nothing to it. The format batch, `engine.applyStyle(...paths)` and `engine.checkStyle(...paths)` (`2026-11-10-native-file-io-and-format-batch-design.md`), renders with the engine's options and mirrors the same surface.
- **Nothing infers a tree's list spacing automatically.** A file's style reaches a render only through options.
- **The comparison with a formatter** is measured on reformat.

## Goals

- A formatting-independent render of any parsed node, with its comments and its statement grouping intact.
- A project style inferred from its files and passed as options.
- Measured numbers for reformat against today's render and against oxfmt.

## Non-goals

- Breaking long lines to a width.
- Changing the default render or its output.
- Inferring a tree's own style automatically.
- Changing built nodes, which already render from the options.

## Anti-goals

- Layout runs or per-gap layout entries computed for a reformat, beyond the blank-line fact.
- A reformat that moves a comment to another side, joins an own-line comment onto code, or breaks an end-of-line comment off its line.
- A second gap classification. `styleFrom`, stored layout and the blank-line fact read one classification.
- A reformat whose output reparses to a different syntax tree.
- Any difference between arena and object storage.

## The end state

### What a reformat reads from the source

- **Content:** each node's kind and form, and every token whose text no option site governs.
- **Comments and `ERROR` nodes,** on the sides the trivia table assigns them, each with its line fact: whether a line break comes before it and after it in the source. `ERROR` text is kept verbatim.
- **The blank-line fact** of each gap that holds one or more blank lines.
- **Nothing else.** Every other gap, delimiter, separator, optional token and indentation renders from the resolved options. Derived delimiters (a python quote, a rust raw string's hash run) are derived from the resolved preference, with the derivation's fallback where content needs it.

### Trivia for a reformat

- A reformat places sides with their line facts and blank-line facts only. It computes no layout runs and no deviations.
- It uses the same lazy placement as the default render, one layout owner at a time, so it places only the layout owners it renders. A reformat of the whole tree places them all.
- **Written trivia renders.** An entry a caller wrote, a layout member included, is the caller's own choice, not the source's, so reformat keeps it.

### `styleFrom`

- It runs one gap classification per file and folds votes per option site, one vote per list. That's the same classification the stored layout reads.
- It covers every option site a source can show: indentation, root edges, list spacing, separators, and the other preference sites.

### Checks, in both storages

- A reformat reparses to the same syntax tree.
- Every comment appears once, in source order, with the same line relation (own line, or end of line).
- Reformatting the output again, with the same options, gives the same bytes.
- A union written over several lines with a leading `|` reformats equal to its one-line form.
- Arena and object render the same bytes.
- `styleFrom` over a file, passed to a reformat of that file, reproduces the file's list spacing wherever it's consistent.

### Measured outcome

- Reformat cost per node on the corpus, in both storages, against today's render of the same trees.
- A reformat of the TypeScript corpus against oxfmt, on the same files and machine, dist builds.
- Speed claims come from CI. Local runs are diagnosis only.

## Constraints

- **DRY:** one gap classification feeds the stored layout, the blank-line fact and `styleFrom`, and one site table maps sides to option sites.
- **Stamped facts:** a site's id is resolved by the emitter, never by name.
- **Generated outputs are never hand-edited.**
- **No new `#set!` directives.**
- **Render stays recursive descent.** No napi or V8 call runs off the JS thread.
- **The default render's validation history doesn't move.** New checks start at their measured counts and only tighten.

## Left to the builder

- **Which extras are layout:** besides comments and `ERROR` nodes, each other extra is either layout (rendered from the options) or content (kept).
- **Representation:** how the per-comment line fact and the per-gap blank-line fact are stored beside the sides.
- **The fold's coverage:** the inventory of sites `styleFrom` folds.
- **Migration order.**

## Calls made in this design, not by the maintainer

- Written trivia renders under reformat. Only source choices are dropped.
- A reformat places sides, line facts and blank-line facts only, through the default render's lazy placement.
- The reformat checks are a reparse to the same tree, comments kept once with their line relation, idempotence, and the multi-line union.
- Line continuations and similar whitespace-class extras are layout.
- An engine already takes options, so `styleFrom` adds only detection and applying its result.
