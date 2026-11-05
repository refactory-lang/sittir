# Paired node backends

## Intent and accepted choice

The maintainer selected two public modes: parsed and built objects, or parsed arena views and built records. The independent hybrid arena/object choice is deprecated. Object/object must effectively match the object behavior of current master, pinned for this work to `7471447a24febcdae6f37b025cdb80a12a929209`.

The prior independent-choice design remains historical context. It does not override this accepted replacement. There is no claim that the hybrid was slower: the change reduces the supported public state space and its maintenance cost.

## Contract

- `nodeStorage: 'object'` selects object reading and object building; `nodeStorage: 'arena'` selects arena reading and record building.
- Preserve the branch's existing arena default; the compatibility comparison always requests object mode explicitly. No default selection was newly requested.
- `nodeStorage` is the only backend option (the maintainer, 2026-11-05). No key names how built nodes are stored, so a hybrid has no spelling. `createEngine` reads only the keys it knows, so a `nodeConstruction` key passed past the types is ignored like any other unknown key.
- Derive the storage once at the engine boundary (`nodeStorageOf`, the one home of the arena default). Object mode does not load the record builders or create the built arena merely because record support exists.
- Validators, CLI, benchmark workers and CI select the storage alone. A benchmark summary states the pairing of the commit that measured it; a report that measured the hybrid keeps the summary committed with it, and new runs cannot construct the hybrid.
- Source fidelity is evaluated per mode against the specified source/expected render. Cross-mode byte deltas are diagnostics. Untouched parsed roots, candidate boundary rules, edits and fresh builds have distinct expectations; AST results remain a separate gate.

## Approaches

The considered choices were retaining all three supported pairs with an acceptance matrix, or reducing the API to two paired modes. The maintainer selected the latter, then made `nodeStorage` the one option: a second key could only restate what the storage decides.

## Master comparison

Use an exported snapshot of the pinned master, without a new Git worktree or branch. Install its locked dependencies independently and build its own runtime/native bindings. Compare identical fixtures/workloads with explicit object mode: rendered text and AST outcomes, retained input identity, parsed and built edits, refusal behavior, ownership/lifecycle, and public construction timing/allocations. Record existing master source-fidelity limitations separately from regressions. Do not substitute a current feature binary or the private eager probe for master.

The baseline is a compatibility oracle for object behavior, not a requirement that arena reproduce object normalization. The current master contains unrelated newer portable API work; isolate differences and report any actual compatibility conflict rather than weakening a test.

## Constraints

Inline execution only. Keep the existing checkout/branch. Preserve unrelated scratch files. No Claude contact, session operations, merge, deployment, public-default cutover or new worktree. Regenerate generated files normally. No baseline/ceiling increases. Preserve raw failing evidence. Keep runtime explanations in commit messages or glossary, and public contracts in JSDoc.
