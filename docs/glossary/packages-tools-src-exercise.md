# `packages/tools/src/exercise` — Function Glossary

### `packages/tools/src/exercise/roundtrip.ts::run`

Parses each case with the grammar's engine (`loadNativeEngine`, which is `createEngine` over the grammar's descriptor), finds the first named node of the case's kind in the parsed tree, rebuilds it through the factories (`buildFactoryNodeFromReference`, the dispatch the factory-storage validator uses) and renders the rebuilt node with the same engine. A case passes when the render equals the node's source text up to whitespace. This is the path a user takes: the rebuilt node's children are the engine's own parsed nodes, so they render from the tree the engine holds.

### `packages/tools/src/exercise/roundtrip.ts::findFirstOfKind`

The first named node of a kind in a parsed tree, in `walkWrappedTree` order, compared by the kind the node shows (`nativeShownKindId`), so an aliased node is found under its visible name.

### `packages/tools/src/exercise/roundtrip.ts::sourceOf`

A parsed node's source text. A span counts UTF-8 bytes, so the source is sliced as bytes, not as a string.

### `packages/tools/src/exercise/codemod-corpus.ts::run`

`sittir tool codemod-corpus`: the inline-attribute codemod of the acceptance suite, written as an edit through `$with` instead of a text splice, run over its 20-file corpus (`tests/acceptance/fixtures/codemod-sample`, `CODEMOD_CORPUS`). It prints how many files render byte-identical to the corpus's `baseline/` and names the rest. The baseline is the splice's output, so an identical file means `$with` plus a root render kept every byte the edit did not touch, the gaps around an inserted item included. It reports and never fails: a count below the last one recorded is the regression to explain.

The rewrite reaches top-level items only (`root.$with.statements`), so a candidate function inside an `impl` block is not rewritten, and a file whose only candidates sit there (`08.rs`) differs from the baseline by that missing insertion. The expected count is 19 of 20.

### `packages/tools/src/exercise/codemod-corpus.ts::runCodemodCorpus`

The per-file outcome `run` prints: each `.rs` file's insertion count and whether its rewrite equals the file of the same name under `baseline/`.

### `packages/tools/src/exercise/codemod-corpus.ts::rewriteWithInline`

One file's rewrite. Each top-level item is put to `inlineAnchor`, through the engine's typed guards, and a parsed `#[inline]` attribute item is inserted at each anchor it returns. The whole list goes back through `root.$with.statements(...)`, and the root is rendered.

### `packages/tools/src/exercise/codemod-corpus.ts::inlineAnchor`

The inline codemod's selection rule, the one both the acceptance codemod (`tests/acceptance/codemod-inline.ts`, over tree-sitter nodes) and `rewriteWithInline` (over engine nodes) apply, so the tool replays the codemod its baseline came from. A function is selected when it has a body of at most five lines and none of the attribute items directly before it, outer or inner, is already `#[inline]` or `#![inline]`. The anchor is the first of those attribute items, or the function itself when there are none, so the new attribute lands above the existing ones. Each caller passes only its own way of reading a node (`InlineSelectionView`): whether it is an attribute item, its text, and its body's text.

### `packages/tools/src/exercise/codemod-corpus.ts::InlineSelectionView`

What `inlineAnchor` reads of a node, in the caller's own node vocabulary.

### `packages/tools/src/exercise/codemod-corpus.ts::CODEMOD_CORPUS`

The acceptance suite's codemod corpus directory: 20 `.rs` files and their `baseline/` outputs.

### `packages/tools/src/exercise/codemod-corpus.ts::CodemodCorpusOptions`

The corpus directory and whether to print JSON.

### `packages/tools/src/exercise/codemod-corpus.ts::CodemodCorpusFile`

One file's outcome: its name, the insertions made, and whether its render equals the baseline.

### `packages/tools/src/exercise/codemod-corpus.ts::CodemodCorpusResult`

The identical count, the file count and each file's outcome.

### `packages/tools/src/exercise/codemod-corpus.ts::sliceBytes`

The source text a `$span` names. A span counts UTF-8 bytes, so it is sliced from the source's bytes, not from the string.

### `packages/tools/src/exercise/codemod-corpus.ts::spanOf`

A node's `$span`, when it carries one.

### `packages/tools/src/exercise/default-diff.ts::run`

`sittir tool default-diff`: for each source file of one grammar, rebuilds the file through the builders (the strict factory source `emitFactorySourceText` prints) and renders it with default options only, then lists every gap between two tokens that the render spells differently from the source. The files are the evidence: an idiomatic source, formatted with the language's own formatter first (rustfmt, a prettier-compatible formatter, black), so the target is the idiom and not whatever the file happened to be. `packages/tools/tests/idiomatic/<grammar>/*.sample` holds the corpus the defaults were measured on; the `.sample` suffix keeps repo formatters, linters and the type-check off it. The per-file reports are aggregated by site, with the sites ranked by fixed gaps minus broken ones. A file the rebuild cannot print or build is reported as failed and the rest still run: such a failure is a builder or emitter defect, not a default. Three options shape a run: `noAttribute` skips the attribution experiments and reports only the differing gaps (the fast pass), `renderedDir` writes each file's rendered text to `<name>.rendered` there so the output can be read beside the source, and an `onProgress` callback fires after each site and arm is tried. The run exits nonzero when any file failed to read, rebuild or render, so an empty or partial report is distinguishable from a complete one. Every engine a trial creates is disposed and every tree a parse creates is deleted, since a run builds thousands of both.

### `packages/tools/src/exercise/default-diff.ts::defaultDiff`

One file's report: the token gaps, the differing ones, and the attribution. A gap is the source text between two adjacent tokens, taken from the tree-sitter parse of the source and of the render; a token is a leaf with width, so comments and string content are tokens. The two token sequences are aligned by text, with a bounded resync after a mismatch (a token that differs, such as a rebuilt literal, is counted as a token mismatch and its gaps are not compared). Attribution is by experiment, not by guess: every site of the grammar's address table (`sitesOf`) is set, one at a time, to each class of gap the source shows, the file is rendered again, and the gaps that stop differing are that site's `fixed`, the gaps that start differing its `broken`. A gap no site fixes is `unattributed`: a template or layout matter (line width, wrapping) and not a default.

### `packages/tools/src/exercise/default-diff.ts::sitesOf`

The render option sites of a grammar, read from the address table the grammar's generated `render/options.rs` carries: each site is the chain of option keys from a kind to an edge (`tryExpression.qmark.before`) and its address in the grammar's own `options:` spelling (`(try_expression)/"?"/before`). The table is read as text, so the tool needs no second derivation of which sites exist. One option leaf can control several concrete addresses (a `body.after` leaf covers every kind that has a body), and setting it sets all of them together, so a site keeps every address it names and a report labels the effect with all of them (joined by ` | `), never with the first alone.

### `packages/tools/src/exercise/default-diff.ts::optionsOf`

The render options object that sets one site to one arm: the site's key chain, nested, with the arm's kind id at the end. An arm is a kind id (`kinds.Newline`), as the engine's option type declares.

### `packages/tools/src/exercise/default-diff.ts::gapClassOf`

The class of a gap's text: no text is `tight`, spaces or tabs only `space`, and one, two or three or more line breaks `newline`, `blankline` and `double_blankline`. Indentation after a break is not part of the class; two gaps of one class that differ in indentation are `indentOnly`.

### `packages/tools/src/exercise/default-diff.ts::tokensOf`

The leaves with width of a parse tree, in source order, with their text and offsets in string indices.

### `packages/tools/src/exercise/default-diff.ts::alignTokens`

Pairs the tokens two texts share, in order. On a mismatch it looks for the nearest pair of positions, within a window, whose tokens agree, and counts the mismatch; with none it stops, so a render that diverges for good compares only the part before.

### `packages/tools/src/exercise/default-diff.ts::differences`

The gaps the source and the render spell differently, over the aligned tokens. Only two tokens adjacent in both texts have a gap to compare. The result is the gaps of the source that the rendered text spells differently, over the tokens both texts share in order.

### `packages/tools/src/exercise/default-diff.ts::aggregate`

The attributions of many files summed by site and arm.
