# Builder contexts: does the type encoding hold, and what does it cost?

This is the probe behind [the builder contexts spec](../../specs/2026-10-15-builder-contexts-design.md). It answers two questions:

- Can a built node's type carry the contexts it still needs, so that a bounding slot refuses an unmet need at compile time?
- What does that cost tsc on the real TypeScript node types?

## Files

- `signatures-plain.ts`: thirteen builders in today's shape (`block`, `whileS`, `ifS`, `fn`, `program`, `awaitE`, `breakS`, `returnS` and the expressions around them), over `packages/typescript/src/types.ts`.
- `signatures-contexts.ts`: the same builders in the contexts shape. Each builder is generic over its node-valued slots and returns `With<Bound, Needs>`. A providing slot `Exclude`s its contexts. A bounding slot intersects the child with `Bounded<B, Allowed>`.
- `refusals.ts`: the encoding's own test. It contains two valid functions and one valid module, plus five refusals, each marked `@ts-expect-error`:
  - `break` outside a loop;
  - `await` in a non-async function;
  - an `await` that a loop does not discharge;
  - `return` at the top level;
  - `break` nested two blocks deep at the top level.

  tsc reports no error, so every refusal fires and every valid line checks. With the directives removed, each message ends at the unmet context: `'"Break"' is not assignable to '"Return" | "Unproven"'`.
- `gen.mts <out> <functions> <depth>`: writes `workload-plain.ts` and `workload-contexts.ts`. Each holds `functions` async functions whose bodies nest `depth` loops, each loop holding an `if` with an awaited call and a `break`.
- `cost.tsv`: the measurements.

## Run

```
pnpm exec tsx docs/superpowers/probes/2026-10-15-builder-contexts/gen.mts <scratch> 1200 8
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target esnext --module esnext \
  --moduleResolution bundler --allowImportingTsExtensions --skipLibCheck --extendedDiagnostics \
  <scratch>/workload-contexts.ts
```

The compiler is tsc 7.0.2. Times are the median of five runs on a shared machine. Types, instantiations and memory are deterministic.

## Results

| workload | builder calls | check time, plain | check time, contexts | types added | instantiations added | memory added |
| --- | --- | --- | --- | --- | --- | --- |
| none (loading the types) | 0 | 1.42 s | 1.39 s | 358 | 1,104 | 0.4 MB |
| 1200 functions × depth 4 | ~73,000 | 1.62 s | 3.04 s | 15,518 | 166,680 | 7.8 MB |
| 1200 functions × depth 8 | ~151,000 | 2.98 s | 5.72 s | 25,118 | 272,280 | 11.2 MB |

- Loading the generated TypeScript types costs about 1.4 s, the same in both shapes.
- On top of that, the contexts shape adds 18–20 µs of check time per builder call, against 3–10 µs per call today. Each call adds 1.8–2.3 instantiations.
- A test file with 500 builder calls gains about 10 ms. The largest workload here, 151,000 calls in one file, goes from 3.0 s to 5.7 s.
- The cost lands where builders are called, not where the types are declared.
- What the probe does not measure: the generated declarations grow by a type parameter per node-valued slot. Their size and the emit cost are measured when the emitter exists.
