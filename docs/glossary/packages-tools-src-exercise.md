# `packages/tools/src/exercise` — Function Glossary

### `packages/tools/src/exercise/roundtrip.ts::hasKindTag`

Whether a value carries a `$type`. It runs on a bag `toRenderableNode` has already stripped of its tree provenance, `$source` included, so it cannot be `isNode`: a keyword-only bag (`{ $type }`, no storage or text) is renderable here but is not a node by `isNode`'s rule.
