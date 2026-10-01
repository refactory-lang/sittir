# `packages/tools/src/exercise` — Function Glossary

### `packages/tools/src/exercise/roundtrip.ts::run`

Parses each case with the grammar's engine (`loadNativeEngine`, which is `createEngine` over the grammar's descriptor), finds the first named node of the case's kind in the parsed tree, rebuilds it through the factories (`buildFactoryNodeFromReference`, the dispatch the factory-render-parse validator uses) and renders the rebuilt node with the same engine. A case passes when the render equals the node's source text up to whitespace. This is the path a user takes: the rebuilt node's children are the engine's own parsed nodes, so they render from the tree the engine holds.

### `packages/tools/src/exercise/roundtrip.ts::findFirstOfKind`

The first named node of a kind in a parsed tree, in `walkWrappedTree` order, compared by the kind the node shows (`nativeShownKindId`), so an aliased node is found under its visible name.

### `packages/tools/src/exercise/roundtrip.ts::sourceOf`

A parsed node's source text. A span counts UTF-8 bytes, so the source is sliced as bytes, not as a string.
