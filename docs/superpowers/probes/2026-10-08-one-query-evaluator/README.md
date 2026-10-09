# One QueryPlan evaluator: measurements

These are the measurements behind `docs/superpowers/specs/2026-10-08-one-query-evaluator.md`.

## `probes/where-cost.mts`

The probe runs `$descendants.ofType(K).where(...)` with the condition evaluated in four places. It uses the same files, conditions and population for each, and every variant ends with the passing nodes hydrated:

| variant | where the condition is evaluated |
| --- | --- |
| native | in the walk (`Plan::holds`), as today |
| batch | the walk filters by kind; one more native call per batch answers each stub, and only passing stubs hydrate. This is the crossing pattern of a JavaScript evaluator fed by the walk. |
| span | every kind match is hydrated, and JavaScript `holds` reads slots through the accessors: a leaf's `$text`, else the value's byte-span slice |
| `$text` | as span, but with `$text` only (the portable `is` provider) |

It also measures:

- the result counts per variant, where a difference is a divergence in what a slot's text means;
- the per-node cost of one native `planHolds` call against JavaScript `holds`;
- a regex-dialect check, Rust `regex` against ECMAScript `u`, on non-ASCII python names.

**Corpus:**

| grammar | files |
| --- | --- |
| python | the 3.14 standard library's `argparse.py` and `json/decoder.py` |
| typescript | `packages/codegen/src/emitters/wrap.ts` and `packages/common/src/engine.ts` |
| rust | `rust/crates/sittir-core/src/read_untyped_node.rs` and `render.rs` |

The python conditions are the six from the node query design's §7.4.

**Run** from the root of a checkout whose release addons are built (the `gen --all` for each grammar builds them):

```
./node_modules/.bin/tsx docs/superpowers/probes/2026-10-08-one-query-evaluator/probes/where-cost.mts [runs]
```

The default is 7 runs. The output is one markdown table per file, then the dialect table.

## `outputs/where-cost.txt`

A run on master at d6ecac5a6, 7 runs each, in a detached worktree with freshly built release addons. The load average was 27–513 during the run, so compare columns within a row rather than absolute times.
