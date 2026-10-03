# `packages/tools/src/profile` — Function Glossary

### `packages/tools/src/profile/trivia-timing.ts::run`

`sittir tool trivia-timing`: parses one file deep with the grammar's engine, then times reading every node's leading trivia, best of `rounds`. Each read asks the native engine for the node's line gaps once, addressing a deep read's node by its tree, span and stamped kind, so the time is dominated by finding that node again (`node_at_span`). Per-node cost that grows with the file means the lookup scales with the file's width rather than its depth. Prints one line, or the timing as JSON.

### `packages/tools/src/profile/trivia-timing.ts::measureTriviaTiming`

The measurement `run` prints: the file's size in bytes, the number of nodes read, the best round's time and the time per node. The walk and the parse sit outside the timed loop, so only the trivia reads are measured.

### `packages/tools/src/profile/trivia-timing.ts::TriviaTimingOptions`

The grammar, the file, the number of rounds, and whether to print JSON.

### `packages/tools/src/profile/trivia-timing.ts::TriviaTiming`

One measurement: grammar, file, bytes, nodes, the best round in milliseconds, and microseconds per node.

### `packages/tools/src/profile/trivia-timing.ts::typedNodesOf`

Every read node under `root`, reached through each storage slot's reader (`slotReaderName`), so a deep read's nodes are the wrapped nodes a caller holds.

### `packages/tools/src/profile/trivia-timing.ts::slotReaderName`

The reader method of a storage key: `_parameters` is read by `parameters()`.

### `packages/tools/src/profile/trivia-timing.ts::ReadNode`

The shape `typedNodesOf` walks: a `$type`, the `$trivia` reader, and slot storage.
