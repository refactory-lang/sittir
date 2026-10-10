# Relative coordinates: probes

Run every script from a checkout root.

## The list census

Whether a list slot's storage ever leaves its key absent, before an empty list becomes `[]` in the transport (`Vec`, or `NonEmptyVec` for a `repeat1` list), the types and the codec.

- `list-census.py <python|rust|typescript>`: the list storage keys a grammar's types mark optional (`readonly _x?: readonly …[]` or `NonEmptyArray`), and how the grammar's `test-fixtures.json` holds them.
- `list-census-corpus.mts`: the same keys on every node a full-depth read of every corpus entry returns.
- `list-required-agree.py <python|rust|typescript>`: whether a transport's required list (a non-`Option` `Vec`, whose read refuses an empty list) is exactly a list the types mark `NonEmptyArray`.

Measured before the change (optional lists were `Option<Vec<…>>` and `_x?:`):

| grammar | optional list keys | fixtures: items / empty / absent | corpus reads: entries, items / empty / absent | transport lists / types lists | required (transport / types) | disagree |
| --- | --- | --- | --- | --- | --- | --- |
| python | 8 | 791 / 18 / 0 | 116 entries, 436 / 15 / 0 | 42 / 42 | 34 / 34 | none |
| rust | 31 | 803 / 996 / 0 | 148 entries, 338 / 329 / 0 | 51 / 51 | 20 / 20 | none |
| typescript | 23 | 818 / 978 / 0 | 115 entries, 281 / 239 / 0 | 37 / 37 | 14 / 14 | none |

No fixture and no read leaves a list key absent, and the two derivations of "this list holds at least one item" agree on every list. One producer did leave keys absent: the dummy stubs the generated `nodes.test.ts` builds (`test.ts::buildDummyStub`) filled required slots only, so an optional list was missing, and every list was missing below the stub depth limit. The stubs now give every list they do not populate `[]`.

`hydrateSlotsWith`'s callers: the wraps call it for a slot whose storage holds nodes (`storesNodes`) and is many; a slot whose storage collapses its multiplicity (`collapsesMultiplicity`) is a `boolean` or `bitflag` slot, which holds no node and is read as stored. Every call names a list storage key, so its `stored == null` arm went, and with it `NO_CHILDREN`; the same arm went from the builders' `hydrateStoredSlots`.

## Verifications 1–6 (the one-reader step)

The relative-coordinates spec's verifications for the one-reader step, at the base `12644d5df` (master when the step began) and the branch head. Verifications 1–4 are tests; 5 and 6 are measured here.

1. **One object through every route; a write through each renders the same.** The identity half is tested: `packages/rust/tests/identity.test.ts` "one wrapper per node, on a shallow read / a deep read" (a query returns the object the accessors return, either order, across two queries, `includes` is identity), "a collected wrapper" (wrapped again, one object on every route), "an alias envelope and its content", and `packages/python/tests/identity.test.ts` "an alias whose content is its own parser node". The write half is met in part, by the maintainer's ruling that the identity registry is a cache the render never consults: a write through a node a query reached is refused rather than rendered (`packages/rust/tests/fold-in-place-trivia.test.ts` "refuses a comment on a node a query reached, and renders it written through the accessors"), until edits are kept as data the render reads, keyed by where they sit in the tree.
2. **A `$descendants` query reads its unregistered matches and no ancestor.** `packages/rust/tests/identity.test.ts` "a descendants query over a let declaration / a variant arm": the first query's native reads equal its matches, the second reads nothing.
3. **Every node's index from any start node is its root index.** `rust/crates/sittir-parity-tests/tests/descendant_index.rs`: `rust_`, `typescript_` and `python_offsets_from_every_start_node_are_root_indexes`.
4. **A deep write unfolds its ancestors; untouched siblings and cousins stay bytes.** `packages/rust/tests/identity.test.ts` "the fold by range" (a deep write, nested writes, a built holder of an edited parsed child, an untouched node after a write elsewhere) and `packages/python/tests/fold-outside-trivia.test.ts` (an outside write keeps the span folded; the whole tree pinned and reparsed; a comment between root statements survives a write below the root).
5. **The fold's render time** (`fold-timing.mts`):

   | input | bytes | written node | untouched, base (ms) | untouched, head (ms) | written, base (ms) | written, head (ms) |
   |---|---:|---|---:|---:|---:|---:|
   | `engine.rs` | 24,766 | LetDeclaration at depth 11 | 0.024 | 0.026 | 0.596 | 0.422 |
   | `spacing.rs` | 48,860 | ExpressionStatement at depth 15 | 0.048 | 0.045 | 0.544 | 0.323 |
   | `create-engine.ts` | 8,947 | ReturnStatement at depth 16 | 0.003 | 0.004 | 0.288 | 0.190 |

   Each cell is the median of three alternating base/head rounds, and each round reports the median of 31 renders after 5 warm-ups. Writing one leading comment on the deepest statement makes the render 29–41% faster at the head than at the base, because the head folds every range the write doesn't touch. An untouched render is a native slice at both commits.
6. **The registry's heap per wrapper** (`registry-heap.mts`):

   | input | walked wrappers | walked, base (B) | walked, head (B) | Δ | queried wrappers | queried, base (B) | queried, head (B) | Δ |
   |---|---:|---:|---:|---:|---:|---:|---:|---:|
   | `engine.rs` (rust) | 1,474 | 1,709 | 1,939 | +230 | 2,938 | 2,258 | 2,493 | +235 |
   | `spacing.rs` (rust) | 6,406 | 1,504 | 1,872 | +368 | 8,873 | 2,095 | 2,347 | +252 |
   | `create-engine.ts` (typescript) | 1,609 | 1,534 | 1,741 | +207 | 1,933 | 2,179 | 2,415 | +236 |

   The head's excess, 207–368 B per wrapper, is what the registry costs: a `Map` entry, a `WeakRef` and a finalization-registry cell per wrapper. The root alone grows by 1–7 KB.

   **Setup:**
   - Commits: base `12644d5df`, head `4b27b0238` (the branch merged with master).
   - Each commit's tree was rsynced to a scratch directory with its native addon built.
   - Machine: Apple M4 Pro, 48 GB; Node v26.10.0; `NODE_ENV=production`; `SITTIR_BACKEND=native`.
   - Each run waited for a 1-minute load average under 10. The machine is shared, so a lower gate never opened.
   - Commands, run in each tree with `SITTIR_ROOT` set to it:
     - `tsx fold-timing.mts <inputs>/engine.rs <inputs>/spacing.rs <inputs>/create-engine.ts`
     - `tsx --expose-gc registry-heap.mts <grammar> <input>`
   - The inputs are the shared-arena probe's `transport/inputs/`.
