# Vocabulary mapped types

**Question.** The vocabulary is to derive three things at the type level from its namespace
structure, with no declaration form beyond `Flag`:
1. the owner × value crossings, structural first (`declaration.method.getter.public`);
2. each kind's flag union, gated by feature;
3. the typed chain, whose steps leave out what a set flag excludes.

Can each be a mapped type, and what does it cost to type-check?

**Answer.** All three are mapped types (`mapped.ts`), and the type test (`mock.test.ts`) passes
with its negative cases. Each depends on one condition:
1. **Crossings.** An owner authors the values it takes as kinds in its sub-namespace
   (`declaration.method.public`). A shared axis's root is a `modifier` kind with values beneath it
   (`modifier.visibility`), so the namespace names the root. Every structural refinement of the
   owner crosses with each value the owner authors. A crossing keeps the refinement's members and
   gains the value's (`scope` on `.public.restricted`).
   - Crossings come only from structure, so the vocabulary also gets kinds that no grammar spells,
     such as a receiver's visibility (`declaration.parameter.self.public`). A language's context
     holds only the kinds its bindings realize, so those kinds never reach it.
2. **Flag unions.** A kind's flags are its members typed `Flag`. A gated flag's member is typed
   through the feature gate (`In<G, F, Flag>`), as a gated member is, and the union reads the gate
   from that type. Declaration merging erases where a flag was declared, so the gate in the type is
   the only place that records it. A `boolean` member is data and never enters the union.
3. **Chains.** The exclusions are a grammar's, so the language's context carries them
   (`$exclusions`): pairs of facts keyed by the kind whose rule never spells both. The generator
   derives them from the grammar's rule. A path's own segments count as stated facts, so a
   getter's chain has no `.generator` step.

## Files

- `mapped.ts`: the three mapped types, written against the vocabulary's shapes (a kind's `$kind` is
  its path, and the kinds are one union).
- `mock.test.ts`: a small vocabulary shaped like the real one, with each claim as a positive or
  `@ts-expect-error` check.
- `real.py <vocabulary dir> <out dir>`: writes the variants over a checkout's vocabulary.
  `owners.ts` authors the five visibility values under the eleven top-level owners that take them.
- `cost.py <out dir> <variant>...`: runs `tsc --extendedDiagnostics --singleThreaded` for each
  variant and reports the median of seven runs.

## Running

From a checkout of `feat/vocabulary-facts`, whose flags are declared with `Flag`:

```sh
P=docs/superpowers/probes/2026-10-10-vocabulary-mapped-types
pnpm exec tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext \
  --allowImportingTsExtensions --erasableSyntaxOnly $P/mock.test.ts          # the type test
python3 $P/real.py packages/types/src/vocabulary /tmp/vocab-mapped
python3 $P/cost.py /tmp/vocab-mapped base crossings chains crossing-members all-flags
```

## Results

`feat/vocabulary-facts` at `41951dd0a`, TypeScript 7.0.2. Each value is the median of 7 runs, at a
load average of 27 to 37, so check times are noisy; types, instantiations and memory are not.

| variant | types | instantiations | memory (K) | check (s) |
| --- | --- | --- | --- | --- |
| base: the namespace unions and the 55 owner values | 24,952 | 45,016 | 64,467 | 0.097 |
| crossings: the 110 crossing kinds joined to the union | 28,314 | 203,512 | 69,385 | 0.139 |
| chains: crossings, and three typed chains | 28,551 | 210,597 | 69,647 | 0.141 |
| crossing-members: every crossing's members forced | 29,922 | 584,881 | 76,918 | 0.224 |
| all-flags: every kind's flag union forced | 38,937 | 1,969,294 | 111,416 | 0.717 |

- A union that holds the crossings costs 158K instantiations. A chain is computed on demand, and
  three chains add 7K.
- Forcing every kind's flag union is the upper bound: it resolves every member type of every kind
  against a concrete context. A guard or a builder step computes only its own kind's union.
- The 110 crossings fall by owner as enum members 10, fields 5, functions 10, methods 35,
  parameters 30, type aliases 5 and imports 15. They include refinements the rulings remove
  (static, class and generator kinds, and the typed, default and optional parameters), so the
  count falls as those go.
- Looking up a kind by key remapping (`{ [I in K as I['$kind']]: I }`) instead of `Extract` costs
  less memory but more instantiations on demand: 335K against 211K for the chains variant. So
  `KindOf` uses `Extract`.
