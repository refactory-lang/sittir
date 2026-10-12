# Building through the feature gate: probe

The vocabulary gates a feature's members on the context: `In<G, F, T> = G extends F ? T : never`. For a type parameter `G` the conditional stays unresolved, so code bounded by a feature reads a gated member but cannot build one. These files measure what each answer to that costs, and the copying and hand-off cases any answer has to serve.

Each refusal carries `@ts-expect-error`, so the folder type-checks exactly when every result below holds:

```sh
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/gate-construction/tsconfig.json
```

Measured with TypeScript 7.0.2.

## Files

- `base.ts`: the vocabulary's shape, cut down to the namespace map with the identifier role's permissive fill, the `async-await` and `decorators` features, and two languages that differ by `decorators`.
- `conditional.ts`: the gate as the vocabulary has it.
- `model.ts`: portable construction. Each language's portable interface is generated with its members spelled out and extends the vocabulary over the language's context; builders take those interfaces; a node built for several languages is a JSON object that satisfies the vocabulary over a context its author declares.
- `copy.ts`: copying a parsed or a built node to another language.
- `absent.ts`: the same cases with an `Absent<F>` branch in place of `never`.
- `alternatives.ts`: three other encodings tried for building through a bound.

## Results

| file | case | result |
| --- | --- | --- |
| `conditional.ts` | read a gated member through a feature bound | reads its type |
| | read it unbounded | reads its type or `undefined` |
| | build over a declared context with the feature | builds |
| | build through a feature bound | TS2322: the value must fit both branches, and nothing fits `never` |
| | build over a context without the feature | refused: not assignable to type `undefined` |
| `model.ts` | an object that `satisfies` the vocabulary, to rust's and python's builders | both build it |
| | an object with `decorators` | python builds it, rust refuses it |
| | the same object annotated with its context instead | python refuses its permissive identifier role |
| | annotated over a context with the role narrowed but without `decorators` | python builds it |
| `copy.ts` | a parsed node of each language as the vocabulary over the union of their contexts | both conform |
| | a parsed rust node to python's builder | builds |
| | a parsed python node to rust's builder | refused: its type admits `decorators` |
| | a node built by a builder typed by exactly what was built, to rust | builds; refused when it has `decorators` |
| | a parsed python node narrowed by a run-time guard, to rust | builds |
| `absent.ts` | a parsed rust node to python's builder | refused: `Absent<Decorators>` is not python's `decorators` |
| | an unbounded read | refused: reads `Absent<Decorators>` |
| `alternatives.ts` | a lookup on a feature fact every context states | builds through the bound; refuses where the feature is absent; a union of contexts stays a supertype |
| | a requirement in a parameter position (`(context: F) => void`) | builds through the bound; the structure turns contravariant in the context, so a union of contexts is no longer a supertype of each |
| | `interface Fn<in G>` | TS2636 where the interface reads `G` covariantly, as the vocabulary does through the namespace map; where accepted, building through the bound still fails |

## What the spec took from it

Building happens over a declared context, a language's or the author's own, where the gate resolves, and a bounded type parameter reads (§4.4, §8). A member the context's features lack is `never`: the refusals `Absent<F>` added fall away, a node from a language without a feature conforms to one with it, and the refusal no longer names the feature. A node built for several languages keeps its literal type with `satisfies`, since an annotated value carries every member and role fill its context admits. Copying a node into another language narrows it out of the vocabulary over the union of their contexts: by structure for a node typed by exactly what was built, by a run-time check for a parsed one.
