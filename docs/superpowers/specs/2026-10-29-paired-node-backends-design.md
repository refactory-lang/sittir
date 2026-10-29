# Paired node backends

## Intent and accepted choice

The maintainer selected two public modes: parsed and built objects, or parsed arena views and built records. The independent hybrid arena/object choice is deprecated. Object/object must effectively match the object behavior of current master, pinned for this work to `7471447a24febcdae6f37b025cdb80a12a929209`.

The prior independent-choice design remains historical context. It does not override this accepted replacement. There is no claim that the hybrid was slower: the change reduces the supported public state space and its maintenance cost.

## Contract

- `nodeStorage: 'object'` selects object reading and object building; `nodeStorage: 'arena'` selects arena reading and record building.
- Preserve the branch's existing arena default; the compatibility comparison always requests object mode explicitly. No default selection was newly requested.
- Matching explicit `nodeConstruction` values remain deprecated compatibility assertions. A conflicting value is rejected by the public types and at runtime with a named migration error. A construction-only request must not silently change the storage default.
- Derive the resolved pair once at the engine boundary. Object mode does not load the record builders or create the built arena merely because record support exists.
- Validators, CLI, benchmark workers and CI select/label the paired modes. Historical reports that measured the hybrid remain readable and explicitly historical; new runs never construct the retired pair.
- Source fidelity is evaluated per mode against the specified source/expected render. Cross-mode byte deltas are diagnostics. Untouched parsed roots, candidate boundary rules, edits and fresh builds have distinct expectations; AST results remain a separate gate.

## Approaches

The considered choices were retaining all three supported pairs with an acceptance matrix, or reducing the API to two paired modes. The maintainer selected the latter. Retaining matching legacy values avoids gratuitous source churn; rejecting conflicts avoids quietly changing existing callers' meaning.

## Master comparison

Use an exported snapshot of the pinned master, without a new Git worktree or branch. Install its locked dependencies independently and build its own runtime/native bindings. Compare identical fixtures/workloads with explicit object mode: rendered text and AST outcomes, retained input identity, parsed and built edits, refusal behavior, ownership/lifecycle, and public construction timing/allocations. Record existing master source-fidelity limitations separately from regressions. Do not substitute a current feature binary or the private eager probe for master.

The baseline is a compatibility oracle for object behavior, not a requirement that arena reproduce object normalization. The current master contains unrelated newer portable API work; isolate differences and report any actual compatibility conflict rather than weakening a test.

## Constraints

Inline execution only. Keep the existing checkout/branch. Preserve unrelated scratch files. No Claude contact, session operations, merge, deployment, public-default cutover or new worktree. Regenerate generated files normally. No baseline/ceiling increases. Preserve raw failing evidence. Keep runtime explanations in commit messages or glossary, and public contracts in JSDoc.
