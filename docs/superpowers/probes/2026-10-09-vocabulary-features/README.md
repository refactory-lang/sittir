# Vocabulary features as type mixins: probe

A runnable prototype of vocabulary features. Each feature adds kinds and members to the vocabulary, written the way the base vocabulary is written. A language's context extends the features its composition names, and the vocabulary gates each feature's members and kinds on the context. The probe checks the design with the compiler and measures what it costs the type-checker against today's contexts. The design is written up in the bindings spec, §4 (`docs/superpowers/specs/2026-09-13-bindings-and-vocabulary-design.md`).

## The snapshot it builds on

The binding prototype's vocabulary and claims, read from its worktree (`scratchpad/wt-bindings-proto`, branch `proto/grammar-bindings`) and never edited:

- `snapshot/vocabulary.patch` (11,674 bytes, sha256 `ef3062247d4187db984598e33dcdd7f44c5dae677e7cc5d42bd72f5c085c7571`): the prototype's uncommitted edits to `packages/types/src/vocabulary` (among them the number-literal kinds), as a diff on the vocabulary at master `cd724143d`. The prototype's base commit, `119c1479e`, has the same vocabulary. The patch equals the vocabulary hunks of the prototype session's gated snapshot, `tracked.patch` (sha256 `000ed2ef41a736f838d8e1faa4ce2285e2c235418ca62ebdedf97e9906f0dcd8`, with `untracked.tgz`, sha256 `fe41c382c492da14b898bea45d56cdebd47f36823aa53c23ec2f09639fa7a133`, both written 2026-10-08 21:31).
- `snapshot/realization.json` (33,717 bytes, sha256 `4b17016bb652bba179b6d176a7389c2748e1acaa26f192445acb9b27b1632bda`): per grammar, the vocabulary paths its read entries claim and the members its routes reach, from the prototype's generated `node-model-portable.json5`: python 177 paths, rust 199, typescript 229.
- Re-extracted on 2026-10-09 at the prototype's `009a01984`, 71 commits after its base, both files are byte-identical.
- `snapshot/extract.mts` writes both: `tsx docs/superpowers/probes/2026-10-09-vocabulary-features/snapshot/extract.mts [<worktree>]`.

The vocabulary interfaces carry no `$subType`, and the features extend them as they are.

## Layout

| path | what it is |
| --- | --- |
| `features/` | The authored features: a folder per feature, nested by inheritance. `index.ts` declares the feature's marker interface and re-exports the stub files; each stub file mirrors one vocabulary namespace file. |
| `compositions.ts` | The authored compositions: an interface per language extending the features it has (`TypeScriptFeatures extends JavaScriptFeatures, TypeAnnotations, ParametricPolymorphism, InterfaceConformance`), and each language's claims and terms. |
| `demo.ts` | The demonstration, checked by the compiler; its `@ts-expect-error` lines are the negatives. |
| `lib.mts` | The model: reading the vocabulary and the feature tree, planning ownership with its checks, writing the gated vocabulary, the contexts, the names and the consumers. |
| `generate.mts` | Writes the variants under `out/` (gitignored) and prints the diagnostics. |
| `cost.mts` | Measures the variants. |
| `snapshot/` | The snapshot above. |

## How a feature is written

A feature is a folder. Its `index.ts` declares a marker, a one-key interface that extends the features it builds on:

```ts
// features/coroutines/generators/index.ts
import type { Coroutines } from '../index.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Generators: functions that run as coroutines producing a sequence, and delegation to another generator. */
export interface Generators extends Coroutines {
	readonly generators: true;
}
```

Its stub files are written as the base is written, one per vocabulary namespace it touches:

```ts
// features/coroutines/generators/declaration.ts
export namespace Declaration {
	export namespace Function {
		// a kind the feature adds: it has a `$kind`
		export interface Generator<G extends GrammarContext> extends SubKindOf<V.Declaration.Function<G>> {
			readonly $kind: 'declaration.function.generator';
			readonly body: V.Statement.Block<G>;
			readonly generator?: boolean;
			readonly name: G['identifier'];
			readonly parameters: V.Declaration.Parameter.Any<G>[];
		}
	}
	// members the feature adds to a kind it does not declare: no `$kind`
	export interface Method<G extends GrammarContext> {
		readonly generator?: boolean;
	}
}
```

The planner (`lib.mts`, `plan`) reads what each stub means and enforces:

- **Single ownership.** A kind is added by one feature, and a member at a kind is owned by one.
- **Restatements.** A member written as required that the base declares optional is a restatement: `ManifestTyping` makes `Declaration.Field.type` required. The language's context applies it (below). A feature restates only what the base or a feature it extends declares.
- **Gating follows the inheritance line.** The feature that owns `async` on `declaration.function` declares it on `declaration.function.generator` and `.signature` as well, because a refinement's ungated declaration cannot override a gated one, and the reverse fails too (TS2430).
- **No base kind inherits from a feature's kind.**
- **Faithful transcription.** Every declaration a feature owns matches the snapshot's text, so the probe's features are the base, moved.

The features: `async-await` (with `async-blocks`), `coroutines` (with `generators`), `methods` (with `classes`, under which `single-inheritance` and `multiple-inheritance`), `interface-conformance`, `type-annotations` (with `manifest-typing`), `parametric-polymorphism` (with `higher-rank-polymorphism`), `coercive-equality`, and one per primitive type and its literals: `arbitrary-precision-integers`, `complex-numbers`, `characters`, `regular-expressions`, `byte-strings`, `string-interpolation`. `type-annotations` owns the whole `type` namespace as well as the annotation members (`returnType`, a declaration's `type`).

## What is generated

- **`vocabulary/augment.ts`**: one `declare module` block per vocabulary module, written member by member:
  - each kind a feature adds, as an interface extending its stub, so the kind keeps one name (`V.Declaration.Function.Generator<G>`);
  - each gated member, its type indexed from the stub that owns it:
    `readonly generator?: gate.In<G, features.Generators, generators.Declaration.Method<G>['generator']>;`
  - every level's `Any`, a feature's kind as a gated arm (`gate.In<G, features.Coroutines, V.Expression.Yield<G>, never>`). The base files no longer declare their `Any` unions.
- **`vocabulary/utils.ts`**: `Absent<F>`, `Permissive` and the gate
  `In<G, F, T, Otherwise = Absent<F>> = G extends F ? T : G extends Permissive ? T : Otherwise`.
- **`BaseContext`** carries the brand `readonly permissive?: true` in place of extending every feature.
- **`vocabulary/features/index.ts`**: every marker.
- **`languages.ts`**: each grammar's context, `extends GrammarContext, C.PythonFeatures`, with namespace sets over the claims its composition has, each restatement intersected where the context names its kind (`V.Declaration.Field<RustContext> & manifestTyping.Declaration.Field<RustContext>`), and the slot table re-instantiated over it.
- **`names.ts`** and **`javascript.ts`**: each language's names, one per kind its context covers, a term beside its kind (`Rust.Declaration.Mod`). `javascript.ts` also holds the JavaScript context, which covers TypeScript's claims less those its composition lacks.

The glue reaches its own helpers through lowercase namespace imports (`gate.In`, `features.Generators`). Inside a `declare module` block the vocabulary's names are in scope, so a bare `In` would be the kind `Expression.Binary.Membership.In` and a bare `F` the kind `Literal.String.F`.

## Running

From the repository root:

```sh
pnpm exec tsx docs/superpowers/probes/2026-10-09-vocabulary-features/generate.mts
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/out/gate/tsconfig.demo.json     # passes
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/out/gate/tsconfig.errors.json   # the negatives' messages
pnpm exec tsx docs/superpowers/probes/2026-10-09-vocabulary-features/cost.mts                           # the cost table
```

The variants under `out/`:

- `today`: the snapshot as it is, each grammar's context over the kinds it claims.
- `gate`: the demonstration. The features own their kinds and members, the contexts extend the compositions, and the equality proposal is applied: `equal` and `not_equal` become levels over a base `.strict` leaf (python and rust `==`, typescript `===`) and a `coercive-equality` `.loose` leaf (typescript `==`).
- `scale-gate`: the cost model. Every member the snapshot tags as particular to some grammars (`// rt only`), and every kind only some grammars claim, belongs to a feature named by those grammars (`OnlyRt`): 6 features, 341 kinds, 162 member declarations gated.
- `scale-registry`: the cost model with every level read off an augmentable registry, `Kinds<G>`, filtered by path, in place of the generated unions.

Every variant's consumers come from one rule (`lib.mts`, `writeConsumers`). For each kind a language's context covers, it writes a portable node literal with a closure per member the language's kind has, and assigns the kind to its namespace in the language's context.

## Results

### The demonstration

`tsc -p out/gate/tsconfig.demo.json` passes. Each negative fails with the message shown (`tsconfig.errors.json`):

| check | outcome |
| --- | --- |
| Rust composes `async-blocks`, which extends `async-await` | Rust's context is an `AsyncAwait` |
| Python composes `async-await` without async blocks | `Property ''async-blocks'' is missing in type 'PythonContext' but required in type 'AsyncBlocks'` |
| TypeScript is JavaScript and its typing features | TypeScript's context is a `JavaScriptFeatures` |
| JavaScript has no type annotations | `Property ''type-annotations'' is missing in type 'JavaScriptContext' but required in type 'TypeAnnotations'` |
| a TypeScript method's `generator` | `boolean \| undefined` |
| a Rust method's `generator` | `Type 'boolean' is not assignable to type 'Absent<Generators>'` |
| a Python class's `implements` | `Property 'absent' is missing in type 'never[]' but required in type 'Absent<InterfaceConformance>'` |
| a JavaScript function's portable node | `Property 'returnType' does not exist on type 'ViewForm<Function>'`, and the same for `typeParameters` |
| Rust's async block at its level and by name | in `V.Expression.Any<RustContext>`; `Rust.Expression.Block.Async` |
| Python's | not in Python's expression level; `Namespace '"names".Python.Expression' has no exported member 'Block'` |
| the type level | `JavaScriptContext['type']` is `never`; TypeScript's is not |
| the equality proposal | `TypeScript…Equal.Loose` and `.Strict`; `Python…Equal.Strict`; `…Python.Expression.Binary.Comparison.Equal' has no exported member 'Loose'` |
| a restatement | a TypeScript field may omit `type`; for Rust, `Property 'type' is missing in type '{}' but required in type 'Pick<Field, "type">'` |
| a term | `Rust.Declaration.Mod` is `Rust.Declaration.Module`; `…Python.Declaration' has no exported member 'Mod'` |
| a consumer over the permissive context | takes a Rust method, which lacks `generator`, and reads it |
| a consumer generic over the context | reading `fn.async` as `boolean \| undefined`: `Type 'Absent<AsyncAwait>' is not assignable to type 'boolean \| undefined'` |

Every program loads all three contexts together, which is the polyglot case: the augmentation is loaded once, by the vocabulary.

### The diagnostics

`generate.mts` prints, for each composition, what it and the snapshot's bindings say of each other:

- **Claims outside the composition.** None for python, rust or typescript. JavaScript, over TypeScript's claims, has 26: exactly the `type.*` kinds `type-annotations` owns.
- **Composed features nothing claims or routes.** Python composes `generators`, but its bindings claim no generator kind and route no `generator` member. Either the composition says more than Python's bindings do, or the bindings miss `yield from`.
- **Composed kinds no claim reaches.** These are informational, from coarse features: Python composes all of `type-annotations`' 40 kinds and claims a handful.
- **Composed members no route reaches.** These are route gaps, also informational: Python's `declaration.method.generator` (Python marks a generator by its body), Python's `expression.lambda.async`, typescript's `declaration.variable.lexical.type`.
- **The plan's notes.** These name members a feature owns at some kinds that the base keeps at others. `type` stays in the base at 19 kinds where it is not an annotation (`clause.constraint`, `expression.cast.as`, `declaration.extension`, …). `extends` stays at `declaration.interface` and `.trait`, where it is interface extension, not single inheritance. `returnType` stays at `declaration.signature.call`.

### The cost

`cost.mts`: TypeScript 7.0.2, `tsc --extendedDiagnostics --singleThreaded`, the median of 7 runs, each variant copied out of the repository first. The machine's load average was about 22 throughout, so the times are noisy and the counts are what to compare.

| variant | types | instantiations | memory (K) | check (s) |
| --- | --- | --- | --- | --- |
| today | 24,373 | 100,747 | 57,232 | 0.064 |
| gate | 28,160 (+15.5%) | 106,479 (+5.7%) | 62,288 (+8.8%) | 0.070 |
| scale-gate | 32,154 (+31.9%) | 118,582 (+17.7%) | 64,578 (+12.8%) | 0.071 |
| scale-registry | 35,960 (+47.5%) | 260,426 (+158%) | 87,961 (+53.7%) | 0.178 |

The gated variants check fewer members per language than `today` (`gate`: python 617, rust 633, typescript 812 against 619, 637 and 817; `scale-gate`: 503, 554 and 710), because a member the language lacks is dropped from its portable node.

### Findings

1. **Levels are generated unions, not a registry.** With no features at all, reading every `Any` off `Kinds<G>` cost 3.2 times today's instantiations (325k); with the per-level path filter computed once it is still 2.6 times at full gating. A registry's only advantage is that it can be augmented, and features cannot come from outside the vocabulary package anyway (a polyglot program loads every feature once). The generated unions cost +5.7% instantiations at the demonstration's scale and +17.7% at full gating.
2. **The permissive context is a brand, not every feature.** With `BaseContext` extending every marker, no language's kind was assignable to the permissive context's, not even `Expression.Binary`, which has no gated member: TypeScript compares `X<Lang>` with `X<Base>` by comparing the contexts, and a language lacks markers the permissive context has. `today` has that assignability, and §10.9 relies on it. Special-casing the permissive context as `BaseContext extends G` put the context on the extends side of the gate, and the assignability failed again, deep in the type graph. The brand keeps the context on the checked side, and the assignability holds again: Rust's method, Python's class and Python's context are each assignable to the permissive context's.
3. **The glue declares members one by one.** A generated `interface X<G> extends Gate<G, F, Stub<G>> {}` fails at every refinement that restates a gated member, with TS2320, because its two heritage clauses disagree on the member. A member declared in the interface's body overrides the inherited one.
4. **The fallback for a missing member is the open trade-off.** `Absent<F>` names the missing feature in every error and lets the portable node drop exactly the members a language lacks. But a consumer generic over the context sees each gated member as possibly `Absent`. `never` (or `undefined`) would let a generic consumer read the member's type unchanged, but the errors no longer name the feature, and the portable node cannot tell a missing member from a member whose type is `never`. A branded `undefined` would give both, but TypeScript reduces `undefined & { absent: F }` to `undefined`, and `void & …` keeps the brand but is not assignable to `undefined`.
5. **TypeScript as JavaScript and its typing features.** The probe gates the typing members (`returnType`, a declaration's `type`, `typeParameters`, `implements`) and the whole `type` namespace. TypeScript's other typing kinds stay in the base here: interfaces, type aliases, signatures, the assertion and `satisfies` casts, abstract classes and methods. They would move into typing features the same way `regular-expressions` and `coercive-equality` move theirs.

### Simplifications

- The slot table (`SlotTable` and `BaseContext`'s fills) stays whole in `context.ts`. It is generated from the bindings, and the generator would emit a feature kind's entries with it.
- Route gaps are printed, not typed.
- The JavaScript context covers TypeScript's claims, since the probe has no JavaScript grammar.
- The cost model's rules exist for cost only. A kind belongs to the feature of the grammars that claim it or anything beneath it, a namespace's root kind stays in the base, and a member belongs to the tag of its first declaration. 37 member lines are left ungated where that tag's feature also adds the kind they sit on.
- The equality proposal is applied in `gate` only, so `today` and `scale-gate` keep the snapshot's equality kinds.
