# Vocabulary features as type mixins: probe

A runnable prototype of vocabulary features: every row of the bindings spec's feature table, and the rows it proposes. Each feature adds kinds and members to the vocabulary, written the way the base vocabulary is written. A language's context extends the features its composition names and lists only the kinds the composition has, and the vocabulary gates each feature's members on the context. The contexts are folded: `GrammarContext<G>` is the namespace map, which types each namespace and each slot by its permissive fill over the context, and there is no `BaseContext`. The probe checks the design with the compiler and measures what it costs the type-checker against today's contexts. The design is written up in the bindings spec, §3.4 and §4 (`docs/superpowers/specs/2026-09-13-bindings-and-vocabulary-design.md`).

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
| `compositions.ts` | The authored compositions: an interface per language extending the features it has (`TypeScriptFeatures extends JavaScriptFeatures, TypeAnnotations, …, ModuleDeclarations`), and each language's claims and terms. |
| `demo.ts` | The demonstration, checked by the compiler; its `@ts-expect-error` lines are the negatives. |
| `lib.mts` | The model: reading the vocabulary and the feature tree, planning ownership with its checks, writing the gated vocabulary, the contexts, the names and the consumers, and the fold. |
| `generate.mts` | Writes the variants under `out/` (gitignored) and prints the diagnostics. |
| `cost.mts` | Measures the variants. |
| `flags/` | The flag encodings' checks: `check.ts`, which every flag variant compiles; `enum-checks.sh` and `enum/`, the enum candidate's run-time and erasability questions; `grammar-graph.py`, the modules Node loads to run each grammar. |
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

Stubs bound the context as the snapshot does, `G extends GrammarContext`; the fold rewrites them with the base (below).

The planner (`lib.mts`, `plan`) reads what each stub means and enforces:

- **Single ownership.** A kind is added by one feature, and a member at a kind is owned by one.
- **Restatements.** A member written as required that the base declares optional is a restatement: `ManifestTyping` makes `Declaration.Field.type` required. The language's context applies it (below). A feature restates only what the base or a feature it extends declares.
- **Gating follows the inheritance line.** The feature that owns `async` on `declaration.function` declares it on `declaration.function.generator` and `.signature` as well, because a refinement's ungated declaration cannot override a gated one, and the reverse fails too (TS2430).
- **No base kind inherits from a feature's kind.**
- **Faithful transcription.** Every declaration a feature owns matches the snapshot's text, so the probe's features are the base, moved.

The features, 75: every row of the bindings spec's feature table (§4.3) and the rows it proposes (§11), nested by inheritance.

- **Types and their members:** `methods` (with `accessors`, and `classes`, under which `single-inheritance`, `multiple-inheritance`, `abstract-classes` and `explicit-overrides`), `structs`, `untagged-unions`, `interfaces`, `interface-conformance`, `type-aliases` (with `associated-types`), `enumerations` (with `algebraic-data-types`), `open-type-extension` (with `typeclasses`), `overloading`, `operator-overloading`, `visibility`, `encapsulation`, `computed-keys`, `readonly-members`.
- **Typing:** `type-annotations` (with `manifest-typing`, `structural-conformance`, `optional-members`, `ambient-declarations`, and `nullable-types` with its `non-null-assertions`); `parametric-polymorphism` (with `const-generics`, `lifetimes`, and `bounded-quantification` with its `higher-rank-polymorphism`).
- **Control:** `async-await` (with `async-blocks`), `coroutines` (with `generators`), `exceptions`, `error-propagation`, `resource-management`, `match-expressions`, `multiway-branch`, `counted-loops`, `post-test-loops`, `labeled-control-flow`, `conditional-expressions`, `concurrency-syntax`, `deferred-execution`, `unsafe-code`, `compile-time-evaluation`.
- **Values:** `destructuring`, `references`, `tuples`, `comprehensions`, `range-expressions`, `slice-expressions`, `optional-chaining`, `coercive-equality`, `named-arguments`, `default-arguments`, and one per primitive type or literal form: `arbitrary-precision-integers`, `complex-numbers`, `characters`, `regular-expressions`, `byte-strings`, `string-interpolation`, `raw-strings`.
- **Program structure:** `modules` (with `module-declarations`), `foreign-function-interface`, `syntactic-metaprogramming`, `decorators`, `attributes`.

`type-annotations` owns the `type` namespace, the annotation members (`returnType`, a declaration's `type`) and the casts. Five features own nothing in these grammars and are markers a composition names: `overloading` (typescript's overload signatures are `declaration.function.signature` claims, a kind rust's bodiless functions share), `operator-overloading` (python's and rust's are by content, through dunders and trait implementations), `nullable-types` (python's and typescript's are union types), `concurrency-syntax` and `deferred-execution` (no grammar here has them).

The tree was written once with the authoring aid (`lib.mts`, `writeFeatureTree`), which transcribes a feature's kinds and members from the snapshot, and every run's planner checks it. What a feature owns follows four rules:

- A kind or member belongs to the feature whose concept it realizes, whenever some language lacks the concept.
- A member that is one grammar's spelling of a slot (`alternative` beside `alternatives`, `content` beside `contents`) is shape, not a feature, and stays where it is.
- TypeScript's typing kinds and members belong to typing features, so JavaScript, which covers TypeScript's claims, has none of them.
- Operators and keyword leaves stay in the base (finding 10).

## What is generated

- **`vocabulary/augment.ts`**: one `declare module` block per vocabulary module, written member by member:
  - each kind a feature adds, as an interface extending its stub, so the kind keeps one name (`V.Declaration.Function.Generator<G>`);
  - each gated member, its type indexed from the stub that owns it:
    `readonly generator?: gate.In<G, features.Generators, generators.Declaration.Method<G>['generator']>;`
  - every level's `Any`, the vocabulary's whole level: the base's kinds and the kinds features add (`V.Expression.Yield<G>` among `Expression.Any`'s arms), none of them gated. The base files no longer declare their `Any` unions.
- **`vocabulary/utils.ts`**: `Absent<F>` and the gate `In<G, F, T, Otherwise = Absent<F>> = G extends F ? T : Otherwise`.
- **`vocabulary/features/index.ts`**: every marker.
- **`languages.ts`**: each grammar's context, `extends GrammarContext<PythonContext>, C.PythonFeatures`, with namespace sets over the claims its composition has, each restatement intersected where the context names its kind (`V.Declaration.Field<RustContext> & manifestTyping.Declaration.Field<RustContext>`), and the slot table re-instantiated over it.
- **The fold** (`lib.mts`, `fold`), the last pass over every variant but `today`:
  - `context.ts` declares `GrammarContext<G extends GrammarContext<G>>`. Each namespace key is its level over `G`, and each slot the snapshot `BaseContext`'s fill with `BaseContext` read as `G`. `BaseContext` and `SlotTable` go.
  - every `G extends GrammarContext` in the vocabulary, the stubs and the glue becomes `G extends GrammarContext<G>`, and each grammar context extends the map over itself;
  - each refinement the variant still has outside its parent (`OUTSIDE_PARENT` in `fold` and the scale variants, none in `gate`) is pinned with `@ts-expect-error` where it is declared (findings, below), so the check fails when one is fixed or another appears.
- **`names.ts`** and **`javascript.ts`**: each language's names, one per kind its context covers, a term beside its kind (`Rust.Declaration.Mod`). `javascript.ts` also holds the JavaScript context, which covers TypeScript's claims less those its composition lacks.

The glue reaches its own helpers through lowercase namespace imports (`gate.In`, `features.Generators`). Inside a `declare module` block the vocabulary's names are in scope, so a bare `In` would be the kind `Expression.Binary.Membership.In` and a bare `F` the kind `Literal.String.F`.

## Running

From the repository root:

```sh
pnpm exec tsx docs/superpowers/probes/2026-10-09-vocabulary-features/generate.mts
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/out/gate/tsconfig.demo.json     # passes
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/out/gate/tsconfig.errors.json   # the negatives' messages
pnpm exec tsx docs/superpowers/probes/2026-10-09-vocabulary-features/cost.mts                           # the cost table
pnpm exec tsc -p docs/superpowers/probes/2026-10-09-vocabulary-features/out/flags-enum/tsconfig.check.json   # the flag checks, in each flags-* variant
bash docs/superpowers/probes/2026-10-09-vocabulary-features/flags/enum-checks.sh                          # the enum's run-time and erasability questions
python3 docs/superpowers/probes/2026-10-09-vocabulary-features/flags/grammar-graph.py                     # what Node loads to run each grammar
```

The variants under `out/`:

- `today`: the snapshot as it is, each grammar's context over the kinds it claims.
- `fold`: `today` folded, with no features.
- `gate`: the demonstration, folded. The 75 features own 255 kinds and 213 member declarations, the contexts extend the compositions, and three proposals are applied (`lib.mts`):
  - the equality proposal makes `equal` and `not_equal` levels over a base `.strict` leaf (python and rust `==`, typescript `===`) and a `coercive-equality` `.loose` leaf (typescript `==`);
  - the property-facts proposal moves what three kinds of a name said to the property that holds the name, and reads rust's shorthand field initializer as a field initializer with no value (finding 4);
  - the visibility proposal makes `visibility` an access level (finding 5).
- `scale-gate`: the cost model, folded. Every member the snapshot tags as particular to some grammars (`// rt only`), and every kind only some grammars claim, belongs to a feature named by those grammars (`OnlyRt`): 6 features, 341 kinds, 162 member declarations gated. Its features exist for cost only; `gate`'s are the design's.
- `scale-registry`: the cost model with every level read off an augmentable registry, `Kinds<G>`, filtered by path, in place of the generated unions.
- `flags-enum`, `flags-const`, `flags-names` and `flags-registry`: `gate` with its 87 boolean members, 26 names, written as flags rather than members, one variant per encoding (`lib.mts`, `FlagEncoding`). Each consumer also checks the kind's builder steps (`Steps`), and `tsc -p out/<variant>/tsconfig.check.json` compiles `flags/check.ts`.

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
| visibility as an access level | a TypeScript field's `'protected'`, a Rust function's `'internal'`; Rust's spelling, `Type '"pub(crate)"' is not assignable to type 'AccessLevel \| undefined'`; for JavaScript, `Type 'string' is not assignable to type 'Absent<Visibility>'` |
| members the full feature set gates | a Rust function's `unsafe`, a TypeScript loop's `label` and a TypeScript subscript's `optionalChain`; for Python, `Absent<UnsafeCode>`, `Absent<LabeledControlFlow>` and `Absent<OptionalChaining>` |
| a TypeScript typing kind | `TypeScript.Declaration.Parameter.Optional`; for JavaScript, `Cannot access 'Parameter.Optional' because 'Parameter' is a type, but not a namespace` |
| a JavaScript function's portable node | `Property 'returnType' does not exist on type 'ViewForm<Function>'`, and the same for `typeParameters` |
| Rust's async block among its expressions and by name | in `RustContext['expression']`; `Rust.Expression.Block.Async` |
| Python's | `Type 'Async<PythonContext>' is not assignable to type …` (Python's expression kinds); `Namespace '"names".Python.Expression' has no exported member 'Block'` |
| the type level | `JavaScriptContext['type']` is `never`; TypeScript's is not |
| the equality proposal | `TypeScript…Equal.Loose` and `.Strict`; `Python…Equal.Strict`; `…Python.Expression.Binary.Comparison.Equal' has no exported member 'Loose'` |
| a restatement | a TypeScript field may omit `type`; for Rust, `Property 'type' is missing in type '{}' but required in type 'Pick<Field, "type">'` |
| a term | `Rust.Declaration.Mod` is `Rust.Declaration.Module`; `…Python.Declaration' has no exported member 'Mod'` |
| a private member | a TypeScript field's `private`, a JavaScript member's `private()`; for Rust, `Type 'boolean' is not assignable to type 'Absent<Encapsulation>'`; for Python's member, `Property 'private' does not exist on type 'ViewForm<Member>'` |
| the private kind of name | `Cannot access 'Property.Private' because 'Property' is a type, but not a namespace` |
| a computed key, a shorthand property | a TypeScript method's `computed`; for Python, `Type 'boolean' is not assignable to type 'Absent<ComputedKeys>'`; a TypeScript pair may omit `value` |
| the identity operators | Python's `is not` operator is `string`: `Type 'number' is not assignable to type 'string'` |
| a consumer bounded by the features it reads | `asyncOf` takes Rust's function; `generatorOf` takes TypeScript's method and rejects Rust's at the call: `Property 'generators' is missing in type 'RustContext' but required in type 'Generators'` |
| an unbounded consumer | `method.generator === true` takes any language's method; returning `fn.async`: `Type 'Absent<AsyncAwait>' is not assignable to type 'boolean \| undefined'` |
| roles and slots through the namespace map | `fn.name.$kind` reads; a parameter's fill admits text, so `fn.parameters`' kinds need narrowing first: `Property '$kind' does not exist on type 'string'` |
| several languages | `(PythonContext \| RustContext)['expression'][]` holds both; `asyncOf<PythonContext \| RustContext>` takes either's function, and the union is a supertype of each member by member. Unnamed, the union infers Python's context: `Type 'RustContext' is missing the following properties from type 'PythonContext': classes, generators, …` |

Every program loads all three contexts together, which is the polyglot case: the augmentation is loaded once, by the vocabulary.

### The diagnostics

`generate.mts` prints, for each composition, what it and the snapshot's bindings say of each other:

- **Claims outside the composition.** None for python, rust or typescript. JavaScript, over TypeScript's claims, has 55: exactly the kinds TypeScript's typing features own (the `type` namespace, interfaces, type aliases, enumerations, signatures, casts, type parameters and their clauses, abstract classes and methods, optional parameters, ambient and module declarations).
- **Composed features nothing claims or routes.** Python's `generators` (question 7 of the spec), its by-content features (finding 12), and `nullable-types`, a marker; rust's `operator-overloading`, and `byte-strings`, since its bindings read `b"…"` as a plain string; typescript's `nullable-types` and `overloading`, markers.
- **Composed kinds no claim reaches.** These are informational, from coarse features: rust composes `destructuring` and `match-expressions` with python's and typescript's patterns among their kinds, and python all of `type-annotations`' kinds.
- **Composed members no route reaches.** These are route gaps, also informational: Python's `declaration.method.generator` (Python marks a generator by its body), Python's `visibility` (spelled by naming convention, which no route reads), rust's `visibilityScope` (until its bindings route `pub(in path)`'s path there), typescript's `declaration.variable.lexical.type`.
- **The plan's notes.** Four kinds sit under another feature's kind (finding 13). `consequence`, `default` and `value` are gated at some kinds and stay in the base at others, where they are another fact: an `if`'s consequence, a rust function's `default` (specialization), a variable's value.

### The cost

`cost.mts`: TypeScript 7.0.2, `tsc --extendedDiagnostics --singleThreaded`, the median of 7 runs, each variant copied out of the repository first. The machine's load average was about 23 at the start and 24 at the end, so the times are noisy and the counts are what to compare. The figures are reported, not a gate: type-check time does not decide a type design.

| variant | types | instantiations | memory (K) | check (s) |
| --- | --- | --- | --- | --- |
| today | 24,373 | 100,747 | 57,221 | 0.062 |
| fold | 36,012 (+47.8% on today) | 142,005 (+41.0% on today) | 86,948 (+52.0% on today) | 0.167 |
| gate | 50,751 (+40.9% on fold) | 164,804 (+16.1% on fold) | 103,667 (+19.2% on fold) | 0.211 |
| scale-gate | 51,109 (+41.9% on fold) | 163,285 (+15.0% on fold) | 100,522 (+15.6% on fold) | 0.165 |
| scale-registry | 54,584 (+51.6% on fold) | 301,632 (2.1 times fold) | 127,333 (+46.4% on fold) | 0.272 |

The fold's cost is the namespace map's: every instantiation checks its context against the map over that context. `gate`, with every feature of the table and the three proposals, costs about what `scale-gate`'s cost model does: 16.1% more instantiations than the fold, against 15.0%. The gated variants check fewer members per language than `today` and `fold`, because a member the language lacks is dropped from its portable node: `gate` checks 585 for python, 590 for rust and 803 for typescript against 619, 637 and 817, and `scale-gate` 503, 554 and 710.

### Flag encodings

A flag is no member: a node's flags are one bitflag, and a kind's flags are its is-guards and builder steps (bindings spec §3.3). The four flag variants write the same 87 declarations, 26 flag names, four ways. The base and the feature stubs lose their boolean members, and `vocabulary/flags.ts` holds:

- **the bits,** one per flag name in name order: `enum Flag { Abstract = 1 << 0, … }` (`flags-enum`, `flags-registry`), an erasable `const Flag = { Abstract: 1, … } as const` (`flags-const`), or the names, with a `const FlagBit` beside them (`flags-names`);
- **each bit's name,** `FlagName`, `{ readonly [Flag.Abstract]: 'abstract'; … }`, but for `flags-names`;
- **each kind's flags,** `KindFlags<G>`: per kind, the flags it declares and those the kinds above it declare, each gated on the feature that owns it, `gate.In<G, features.Generators, Flag.Generator, never>`. In `flags-registry` they come instead from `FlagRegistry<G>`, keyed `'<kind>#<flag>'`: the base declares its own entries, augment.ts adds those features own by augmentation, and a kind's flags are the entries whose kind is it or a kind above it, by path prefix;
- **`Steps<G, P>`,** the builder steps of the kind at `P` in the context `G`, one per flag it admits there.

`flags/check.ts` compiles in all four. A typescript method has `async`, `generator`, `static`, `private`, `computed`, `optional`, `override` and `readonly` steps, a getter has its method's, and a rust method has no `generator` step, nor a python async block a `move` step, each refused as `@ts-expect-error`. In this vocabulary a flag declared on a kind reaches the same kinds by path prefix as by inheritance.

The cost, from the same run as the table above:

| variant | types | instantiations | memory (K) | check (s) |
| --- | --- | --- | --- | --- |
| gate (flags as members) | 50,751 | 164,804 | 103,721 | 0.154 |
| flags-enum | 50,676 | 159,575 (−3.2% on gate) | 104,054 | 0.149 |
| flags-const | 50,677 | 159,575 | 104,076 | 0.151 |
| flags-names | 50,541 | 159,450 | 103,884 | 0.157 |
| flags-registry | 56,696 | 427,461 (2.7 times flags-enum) | 110,269 | 0.233 |

The load average was about 21 through the run. The counts repeat the table above's `today`, `fold` and `gate` exactly.

What the enum candidate raises (`flags/enum-checks.sh`):

- **A feature cannot add a bit by augmentation.** tsc accepts a feature module that adds a member to the enum (`declare module './flags.ts' { export enum Flag { Async = 1 << 1 } }`), but an augmentation is ambient and emits nothing: at run time `Flag.Async` is `undefined`, and `Flag.Static | Flag.Async` is `1`, the bit silently dropped. So the generator writes one enum with every bit, and a feature contributes a flag's declaration, which the generator reads. A registry that features augment holds the type-level unions correctly, at 2.7 times the instantiations of the generated map.
- **Bits are generated.** The generator gives each flag name one bit, in name order, so a flag has one bit in every context and composition. A bitwise number holds 31 bits, and the generator refuses a 32nd: the probe's vocabulary has 26. A new flag name shifts the bits after it, which no reader sees, since the bitflag is client-side only and a structure states its flags by name (`$flags`).
- **The vocabulary stays out of the erasable graph.** `flags/grammar-graph.py` lists what Node loads to run each grammar from its `.sittir/grammar.js`: 51 modules per grammar (47 in codegen, `@sittir/common/error-kind`, and three of the grammar's own), none under the vocabulary and none declaring an enum. `@sittir/types` is not loaded at all. Node's strip-only loader refuses an enum (`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`), as `--erasableSyntaxOnly` does (TS1294), so a grammar that ever reached one would fail at its first generate.

### Findings

1. **There is no permissive context; the namespace map carries its fills.** With every namespace and slot of `GrammarContext` typed `unknown`, a consumer generic over the context cannot read a role or a slot: `Property '$kind' does not exist on type 'G["identifier"]'`. Supplying those types was all `BaseContext` did that a type parameter cannot, and it was a top only through the compiler. `Method<RustContext>` is assignable to `Method<BaseContext>` because TypeScript compares the two contexts, while the `generator` member compared on its own is not (`Type 'Absent<Generators> | undefined' is not assignable to type 'boolean | undefined'`), and the gate's permissive brand held only through weak-type detection. Folded into `GrammarContext<G extends GrammarContext<G>>`, the fills reach every generic consumer. Typing them over `this` in an unparameterized map fails instead: a language's context then does not satisfy the map (`Type 'Class<PythonContext>' is not assignable to type 'Any<GrammarContext>'`), and extending it fails with TS2430, "'this' could be instantiated with a different subtype".
2. **Levels are not gated.** Once the map types every slot by levels over an arbitrary `G`, every refinement is checked against its parent for every context. A gated arm (`In<G, F, X, never>`) cannot be shown to hold `X` there. So a refinement that narrows a slot to a kind a feature adds failed with TS2430: `expression.call.template` (its `arguments` the template string `string-interpolation` adds), `type.path.expression` (its `path` a turbofish, both `type-annotations`' kinds), and in `scale-gate` 9 refinements. With every level whole, they compile. A language's own level is its context's key, `PythonContext['expression']`, which lists only what its composition has.
3. **The map checks every refinement against its parent.** Today's `unknown` slots accept any refinement, because TypeScript checks a value against a generic indexed access through the target's constraint. Under the map, three refinements in the snapshot fill a slot outside their parent's. `fold` and the scale variants pin each where it is declared (`lib.mts`, `OUTSIDE_PARENT`); in `gate` the property-facts proposal fixes all three:
   - `expression.binary.identity` and `expression.binary.membership`: `operator` is `unknown`, outside `expression.binary`'s `string`. The snapshot leaves it unfilled at their leaves too (`.is`, `.is_not`, `.not_in`), though Python routes it there. It is keyword text, so the proposal fills it as `string`.
   - `identifier.property.private`: `content` is `unknown`, outside `identifier.property`'s identifier role. The proposal removes the kind (finding 4).
4. **A fact about a property is the property's** (ruled). The snapshot records three facts about a property as kinds of its name. The property-facts proposal (`lib.mts`, `propertyFactsProposal`) moves each to the property:
   - **Privateness.** `identifier.property.private` goes: a private name is an `identifier.property`. `private?: boolean` sits on `declaration.field`, `declaration.method` and `expression.member`, owned by `encapsulation`. In a brand check, `#x in obj`, the private name is the left operand of a binary `in`, which its fill already admits.
   - **A computed key.** `identifier.property.computed` goes: the key is its expression. `computed?: boolean` sits on `declaration.field`, `declaration.method`, `element.pair` and `pattern.object.pair`, owned by `computed-keys`. Where TypeScript claims one of those kinds, the name's fill admits an expression.
   - **Shorthand.** The proposal removes both shorthand kinds. The ruling keeps one, because each grammar follows its own kinds (spec §6). Rust's `element.struct.field.shorthand` goes: a shorthand field initializer is a node, an `element.struct.field` with no value, whose `field` admits the identifier the shorthand names, and rust's claim of it merges into its claim of the field initializer. TypeScript's `identifier.property.shorthand` stays: its shorthand is a leaf, and both `shorthand_property_identifier` and `shorthand_property_identifier_pattern` claim the memberless identifier kind. The proposal instead read a TypeScript shorthand as a pair with no value and made a pair's `value` optional, and the probe measures that form.

   Refinements inherit each flag: getters, setters and signatures. JavaScript composes both features, so TypeScript has both, and Python and Rust neither. Under the proposal TypeScript claims three kinds fewer and Rust one; under the ruling, TypeScript two and Rust one.
5. **Visibility is an access level** (ruled; the values are proposed). The visibility proposal (`lib.mts`, `visibilityProposal`) removes `modifier.visibility` and its `pub` refinement and types every `visibility` member and slot as `AccessLevel`: `open`, `public`, `package`, `internal`, `restricted`, `protected internal`, `protected`, `private protected`, `file` and `private`. Each kind whose member or slot admitted rust's modifier also has `visibilityScope`, the module `pub(in path)` names. `visibility` owns both members at every kind that declares them, 38 declarations. Rust's `pub(crate)` is `'internal'`, and JavaScript, which has `encapsulation` and not `visibility`, has no level at all.
6. **Levels are generated unions, not a registry.** At full gating a registry costs 1.8 times the generated unions' instantiations. Cost is the only measured difference. The registry's one other merit is that a package outside the vocabulary could add kinds to a level by augmentation, which a type alias cannot take. That does not arise while every feature lives in the vocabulary package, which a polyglot program needs anyway.
7. **The glue declares members one by one.** A generated `interface X<G> extends Gate<G, F, Stub<G>> {}` fails at every refinement that restates a gated member, with TS2320, because its two heritage clauses disagree on the member. A member declared in the interface's body overrides the inherited one.
8. **A missing member is `Absent<F>`.** It names the missing feature in every error and lets the portable node drop exactly the members a language lacks. A consumer bounded by the feature reads the member's type unchanged. An unbounded consumer sees `Absent<F>`, which names the bound it lacks, and can still test the member. `never` (or `undefined`) would drop the feature from the errors, and the portable node could not tell a missing member from a member whose type is `never`. A branded `undefined` would give both, but TypeScript reduces `undefined & { absent: F }` to `undefined`, and `void & …` keeps the brand but is not assignable to `undefined`.
9. **TypeScript is JavaScript and its typing features.** Every typing kind and member belongs to a typing feature: `type-annotations` (the `type` namespace, annotations and casts), `interfaces`, `type-aliases`, `enumerations`, `structural-conformance` (call, construct and index signatures), `abstract-classes`, `interface-conformance`, `parametric-polymorphism` and `bounded-quantification`, `visibility`, `explicit-overrides`, `module-declarations`, and four features for TypeScript's modifiers: `optional-members` (`x?: T`, the optional parameter), `readonly-members`, `ambient-declarations` (`declare`) and `non-null-assertions` (`x!`, `x!: T`). Under `type-annotations` those modifiers would have reached rust's and python's fields, which compose annotations and none of them. JavaScript, over TypeScript's claims, then has none of the typing kinds: the 55 claims outside its composition. One typescript form that is not typing reaches JavaScript through `modules`: `import x = require()`. `optional-members` also owns `optionality`, the `?` or `!` token of a property, which states again what `optional` and `definite` state.
10. **Operators and keyword leaves stay in the base.** A language never claims an operator it lacks, so its context already leaves the leaf out; a feature per token would add a marker and no member. `coercive-equality` is the exception, because its leaf is a different comparison. With them stay the kinds one grammar has that no row covers. 92 kinds some grammars claim remain in the base:
    - operators: `expression.binary.arithmetic.exponent`, `.floor_divide`, `expression.binary.matmul`, `expression.binary.nullish`, `expression.binary.shift.right_unsigned`, `expression.binary.identity.is`, `.is_not`, `expression.binary.membership.in`, `.instanceof`, `.not_in`, `expression.binary.logical`, the compound assignments `and`, `or`, `nullish`, `exponent`, `floor_divide`, `matmul`, `shift_right_unsigned`, the unary `bitwise_not`, `plus`, `typeof`, `void` and `delete`, `expression.update` with `.increment` and `.decrement`, `expression.sequence`;
    - one grammar's statements and clauses: python's `statement.assert`, `.delete`, `.exec`, `.global`, `.nonlocal`, `.print`, `.print.chevron`, `clause.print.chevron` and `clause.elif`, and its `statement.pass` beside the `statement.empty` rust and typescript claim; typescript's `statement.debugger`, `statement.scope` (`with`) and `expression.meta`;
    - literals and identifiers spelled one grammar's way: `literal.ellipsis`, `literal.null`, `literal.null.undefined`, `literal.number.negative`, `literal.number.float.leading_point`, `.scientific`, `literal.string.concatenated`, `.docstring`, `.triple`, `identifier.crate`, `.dotted`, `.field`, `.nested`, `.property`, `.scoped`, `.super`;
    - comments: `comment.block`, `.block.doc`, `.block.doc.inner`, `comment.line.doc`, `.line.doc.inner`;
    - kinds two features share: `clause.case` (python's match case and typescript's switch case, whose members `match-expressions` and `multiway-branch` gate), `declaration.field` (classes' and structs'), `element.pair`, `element.splat` with `.dictionary` and `.parenthesized`, `declaration.function.signature` (a function with no body: typescript's overloads, rust's trait and extern functions);
    - shapes whose refinement pins a member a feature gates on its parent (finding 11): python's `declaration.parameter.default`, `.typed` and `.typed_default`, typescript's `clause.case.default`;
    - declarations and collections in one grammar's form: `declaration.constant`, `declaration.variable.lexical`, `.pattern`, `.var` and `.static`, `expression.collection.dictionary`, `.object`, `.set`, `expression.function`, `expression.call.path`, `pattern.as`, and `pattern.mutable` (rust's `mut` is the fact typescript spells `let` and `const`, in two shapes the vocabulary should unify before a feature owns it);
    - roots and levels a grammar claims as its own kind: `attribute` and `attribute.content` (rust's attribute), `comment`, `literal.boolean`, `literal.number`, `statement.loop` (rust's `loop`), `type`.
11. **A feature cannot gate a member above a refinement it adds.** The refinement restates the member, its stub is written as the base is, ungated, and an ungated restatement cannot override the gated parent (TS2430). So the feature gates the member and leaves the refinement with its parent's owner: `accessors` gates `accessor` and leaves the getter and setter with `methods`; `default-arguments` gates `default` and leaves python's default parameters in the base; `multiway-branch` gates the switch case's `value` and `bodies` and leaves `clause.case.default` in the base; `type-annotations` gates `type` and leaves python's typed parameters. A refinement another feature adds is fine: `optional-members` adds the optional parameter, and `type-annotations` gates its `type` there.
12. **A feature composed by content reaches nothing.** Python composes `visibility`, `accessors`, `abstract-classes`, `explicit-overrides` and `operator-overloading` by content: naming conventions, `@property`, `abc`, `@override` and dunders. Its bindings route none of their members, so each is a composed feature nothing reaches until a reader derives the member from the content.
13. **Four kinds belong to two features.** A struct's tuple pattern (`pattern.tuple.struct`) is a struct pattern and a tuple pattern; a complex-number case (`pattern.case.complex`) is a match pattern; a foreign module (`declaration.module.foreign`) is a module declaration; an interface's `extends` clause (`clause.extends.type`) refines a class's. Each has one owner, chosen by what the kind adds, and the planner notes the other.
14. **The table's rows, realized, move three things.** `modules` splits: JavaScript has imports and exports and no namespaces, so `module-declarations` (rust's `mod`, typescript's `namespace`) extends it. Rust composes no `interface-conformance`, as the table says: `impl Trait for T` is `typeclasses`' kind and its `implements` part of the kind. And `gradual-typing` is `type-annotations` without `manifest-typing`, as the spec proposes.

### Simplifications

- Each language's slot table is the snapshot `BaseContext`'s fills re-instantiated over it, not filled from its own routes. The generator fills each from the bindings and would emit a feature kind's entries with them.
- A language's requiredness from its bindings (spec §4.4) is not modeled. So Python's pair, whose every claim has a value, reads `value` as optional here.
- The proposal routes its flags in every TypeScript claim of a kind on a holder's line. The bindings would capture each one, e.g. `(public_field_definition name: (private_property_identifier) @private)`, and the probe does not check them.
- The fold is a last pass over the generated variant, so the authored stubs bound the context as the snapshot does.
- The snapshot's roles hold kinds only. The binding generator's contexts also admit a grammar's keyword text in a role, which the namespace map as folded here does not (spec §11, Features question 10).
- Route gaps are printed, not typed.
- The JavaScript context covers TypeScript's claims, since the probe has no JavaScript grammar.
- The cost model's rules exist for cost only. A kind belongs to the feature of the grammars that claim it or anything beneath it, a namespace's root kind stays in the base, and a member belongs to the tag of its first declaration. 37 member lines are left ungated where that tag's feature also adds the kind they sit on.
- The three proposals are applied in `gate` only, so `today`, `fold` and the scale variants keep the snapshot's kinds.
