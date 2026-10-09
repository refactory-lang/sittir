# One QueryPlan evaluator: measurements

These are the measurements behind `docs/superpowers/specs/2026-10-08-one-query-evaluator.md`.

## `probes/where-cost.mts`

The probe runs `$descendants.ofType(K).where(...)` with the condition evaluated in four places. It uses the same files, conditions and population for each, and every variant ends with the passing nodes hydrated:

| variant | where the condition is evaluated |
| --- | --- |
| native | in the walk (`Plan::holds`), as today |
| spans | the proposal: the walk filters by kind and returns, with each stub in the same call, the byte spans of the values each subject of the plan admits. JavaScript slices them with `spanSlicer`, evaluates the plan compiled once, and hydrates only passing stubs. It needs `prototype-spans.patch` and prints n/a without it. |
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

**Run** from the root of a checkout whose release addons are built. Apply `prototype-spans.patch` first (`git apply`), then rebuild each grammar's addon (`pnpm run build` in `rust/crates/sittir-<grammar>`, or `gen --all`):

```
./node_modules/.bin/tsx docs/superpowers/probes/2026-10-08-one-query-evaluator/probes/where-cost.mts [runs]
```

The default is 7 runs. The output is one markdown table per file, then the dialect table.

## `prototype-spans.patch`

The patch against master (d6ecac5a6) that adds the walk's optional `subjects` argument:

- `query::Subject` and `subject_spans` in `sittir-core`;
- `ParsedTree::descendants_with`, with the batch's `spans` field;
- the napi `descendants` parameter;
- the JavaScript wrapper's pass-through.

It is a measurement prototype, not the implementation. It keeps the native plan beside the spans so that both variants run in one build.

## `outputs/where-cost.txt`

A run on master at d6ecac5a6 with `prototype-spans.patch` applied, 7 runs each, in a detached worktree with freshly built release addons.

- The load average was about 50, so compare columns within a row rather than absolute times.
- One corpus file, `packages/common/src/engine.ts`, is one of the files the patch edits. So its rows count 102 kind matches here, against 99 on unpatched master. Every variant reads the same file within a run.
