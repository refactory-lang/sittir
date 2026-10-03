# `packages/tools/src/exercise` — Function Glossary

### `packages/tools/src/exercise/roundtrip.ts::run`

Parses each case with the grammar's engine (`loadNativeEngine`, which is `createEngine` over the grammar's descriptor), finds the first named node of the case's kind in the parsed tree, rebuilds it through the factories (`buildFactoryNodeFromReference`, the dispatch the factory-render-parse validator uses) and renders the rebuilt node with the same engine. A case passes when the render equals the node's source text up to whitespace. This is the path a user takes: the rebuilt node's children are the engine's own parsed nodes, so they render from the tree the engine holds.

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

One file's rewrite. It picks each top-level function whose body spans at most five lines and that no `#[inline]` attribute precedes, and inserts a parsed `#[inline]` attribute item before it, or before the first of the attribute items already above it. This is the acceptance codemod's own selection (`tests/acceptance/codemod-inline.ts`). The whole list goes back through `root.$with.statements(...)`, and the root is rendered.

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
