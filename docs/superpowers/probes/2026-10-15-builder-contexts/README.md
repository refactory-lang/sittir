# Builder contexts: the type encoding, its cost, and the kinds-only tables

This is the probe behind [the builder contexts spec](../../specs/2026-10-15-builder-contexts-design.md). It answers three questions:

1. Can a built node's type carry the contexts it still needs, so that a bounding slot refuses an unmet need at compile time? This is checked on the real TypeScript node types.
2. What does that cost tsc?
3. With every requirement, provider and bound a kind or a (kind, slot), and no conditions:
   - which of the census's early-error rows are refused;
   - is any valid corpus entry refused?

## Files

- `signatures-plain.ts`: builders in today's shape over `packages/typescript/src/types.ts`.
- `signatures-contexts.ts`: the same builders in the contexts shape, kinds only.
  - Each builder is generic over its node-valued slots and returns `With<Bound, Needs>`.
  - A providing slot `Exclude`s its contexts, and a bounding slot intersects the child with `Bounded<B, Provided>`.
  - Each function kind's body provides a fixed set. No async function kind exists, so every function body provides `Await`.
- `refusals.ts`: the encoding's own test, which tsc checks with no error.
  - Seven refusals, each marked `@ts-expect-error`:
    - `break` outside a loop;
    - `continue` in a labeled block that is not a loop;
    - `yield` in a function that is not a generator;
    - `yield` that a loop does not discharge;
    - `return` at the top level;
    - `new.target` at the top level;
    - `break` nested in blocks at the top level.
  - Six valid lines: a loop with `break` and `continue`, a labeled `break`, a generator's `yield`, `new.target` in a function, and `await` in a function body and at the top level.
  - With the directives removed, each message ends at the unmet context, for example `'"Break"' is not assignable to '"Unproven" | FunctionBody'`.
- `tables.mts`: the kinds-only context tables for typescript, python and rust, run over sittir's own parse trees (`packages/<g>/.sittir/parser.wasm`). It does three things:
  - checks each table against the grammar sittir generates, as the declaration's diagnostics would;
  - computes the masks the spec defines over the census's early-error witnesses and over each grammar's corpus;
  - asks the language's compiler about every corpus entry it refuses, through the census's `judges.mts`.
- `coverage.tsv`: per grammar, each early-error witness, refused or accepted, and each refused corpus entry with the compiler's verdict.
- `gen.mts <out> <functions> <depth>`: the cost workload, in both shapes.
- `cost.tsv`: the measurements.

## Run

```
pnpm exec tsx docs/superpowers/probes/2026-10-15-builder-contexts/tables.mts
pnpm exec tsx docs/superpowers/probes/2026-10-15-builder-contexts/gen.mts <scratch> 1200 8
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target esnext --module esnext \
  --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --extendedDiagnostics \
  <scratch>/workload-contexts.ts
```

## Results: the tables

| grammar | early-error rows refused | corpus entries checked | corpus entries refused | all refused entries rejected by the compiler? |
| --- | --- | --- | --- | --- |
| typescript | 8 of 30 | 116 (2 with parse errors skipped) | 2 | yes |
| python | 5 of 7 | 115 (1 skipped) | 6 | yes |
| rust | 4 of 7 | 148 | 8 | yes |

Every refused corpus entry is a fragment the language rejects for the context the table names:
- **TypeScript's two:** a `declare module` body holding `break`, `continue` and `return` (TS1104, TS1108, TS1036).
- **Python's six:** `return`, `await` and `yield` at module level.
- **Rust's eight:**
  - free functions with `self` ("`self` parameter is only allowed in associated functions");
  - C-variadic definitions outside an extern block;
  - a top-level `.await`;
  - a top-level `let … else { return }`.

So no valid entry is refused. A missing kind costs a refusal, never a false one.

The rows the tables do not refuse are named, with the kind each waits on, in the spec's census section.

## Results: the cost

The compiler is tsc 7.0.2. Types, instantiations and memory are deterministic. Times are the median of five runs.

| workload | builder calls | check time, plain | check time, contexts | instantiations added |
| --- | --- | --- | --- | --- |
| none (loading the types) | 0 | 1.42 s | 1.39 s | 1,206 |
| 1200 functions × depth 4 | ~73,000 | 1.62 s | 3.04 s | 161,969 |
| 1200 functions × depth 8 | ~151,000 | 2.98 s | 5.72 s | 267,569 |

- The times were taken on the first shape, whose async functions provided `Await` by a type parameter. The kinds-only shape drops that parameter: its instantiations are about 0.2% lower (`cost.tsv`), so those times are an upper bound.
- A rerun of the timing on the kinds-only shape was not usable: the machine's load average was 191, and the five plain runs of the largest workload ranged from 4.6 s to 17.9 s.
- Loading the generated TypeScript types costs about 1.4 s in both shapes.
- On top of that, contexts add 18–20 µs of check time and about 2 instantiations per builder call, against 3–10 µs per call today.
- A test file with 500 builder calls gains about 10 ms. The largest workload, 151,000 calls in one file, goes from 3.0 s to 5.7 s.
- Not measured: the growth of the generated declarations, a type parameter per node-valued slot that can reach a requirement. It is measured when the emitter exists.
