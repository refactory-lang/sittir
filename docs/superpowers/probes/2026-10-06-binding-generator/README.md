# Binding generator probe

The prototype behind `docs/superpowers/specs/2026-10-06-binding-generator-design.md`. It reads a grammar's `bindings.scm` and slot model through the inventory's own loaders and emits the generated module the spec describes, for one grammar, outside the package. It is a record of what the design was measured on, not the generator.

## Where it differs from the spec

The prototype predates the portable engine surface. It:

- reads through views over `$core` and enters at the root through a public `viewNode(node)`, where the spec has the portable engine's `parse` and `attach`, with no way down;
- builds through `from()`, where the spec has the portable engine's `build`;
- exposes leaf text as `$text` and reads a token as text, where the spec has `$value` for a varying leaf and the const string for a fixed literal;
- puts a `kind` string on each view literal, where the spec's portable node carries only `$type`;
- reads contextual claims by their context-free claim, and does not test predicate claims;
- routes a presence member by its capture name as the token's text, since the facts it reads keep no token text: `"async" @async` resolves, `"async" @isAsync` would have no route, so it does not validate renamed presence captures;
- skips build entries whose kind has no bare factory, where the spec routes them through the existing form and subtype routing;
- keeps the type maps in its own module rather than the grammar's types module, and names its literals "view classes" in its output.

Its views have the shape of a portable node (an object literal of closures), so its read and type-check figures stand for the spec's.

## Tools

| file | what it does |
| --- | --- |
| `generate.mts` | The generator prototype. Writes `out/<grammar>.vocab.ts` (the context `Ctx`, `ViewForm`, `VocabViews`, the kind-id view types, `Backward`, one literal factory per read entry, the internal `view()`/`viewEnum()` dispatch, `viewNode()` and `builder()`) and `out/<grammar>.engine.ts` (a typed re-export of the engine). Every interface member gets a closure, read from the vocabulary's own files (`VOCAB_DIR`, inherited members included); a member with no route returns `undefined`. Prints what it emitted and every entry it skipped, with the reason. |
| `lock-vocabulary.mts` | Writes `locked/`, a stand-in for the locked vocabulary: today's vocabulary with the bindings spec's §3.4 kind rule applied, so each level's `kind` admits every path beneath it. Generate with `VOCAB_DIR=<this folder>/locked` to check against it. |
| `conformance.py` | Sorts the type errors of a generated module by cause (spec §4) and names one location per cause. Reads `tsc` output on stdin. |
| `demo.mts` | Reads a rust function through the views, builds a structure and the view back, renders both, and times the views against the low-level reader. It is type-checked with the module, so it also shows the consumer's typing. |
| `tsconfig.json` | Type-checks `out/*.ts` and the `.mts` files. |

`out/` and `locked/` are generated and not committed.

## Commands

Run from the root of a checkout whose natives match its sources.

```bash
P=docs/superpowers/probes/2026-10-06-binding-generator
pnpm exec tsx $P/generate.mts rust
pnpm exec tsc -p $P/tsconfig.json --noEmit | python3 $P/conformance.py
pnpm exec tsx $P/demo.mts

# against the §3.4 stand-in
pnpm exec tsx $P/lock-vocabulary.mts
VOCAB_DIR=$PWD/$P/locked pnpm exec tsx $P/generate.mts rust
pnpm exec tsc -p $P/tsconfig.json --noEmit | python3 $P/conformance.py
```

## Results

Rust, measured at `f4a78b7fb` on an Apple-silicon Mac.

- **Generated:** 190 read entries over 152 grammar kinds, 399 kind ids typed, 173 build entries; a 3.9k-line module. Type-checking this folder (the module and the `.mts` files) takes 5.1 s.
- **Skipped (39):**
  - reads (13): 4 contextual claims, 3 predicate claims, 4 unresolved nested routes (`impl_item_body`'s extension members), 2 kinds with no typed surface (`_`, `let_chain`);
  - builds (26): 21 entries whose kind has no bare factory, 3 predicate claims, 2 claims of a vocabulary kind already built from another grammar kind.
- **Conformance,** 374 members over 190 read entries:

  | cause | against today's vocabulary | against the §3.4 stand-in |
  | --- | --- | --- |
  | token text | 74 | 74 |
  | text leaf | 33 | 32 |
  | predicate | 13 | 13 |
  | unmapped | 10 | 11 |
  | untyped reader | 6 | 6 |
  | refinement | 3 | 0 |
  | extra member | 2 | 2 |
  | absent | 1 | 1 |
  | **rejected** | **142** | **139** |

  Against the stand-in, 3 further errors fall outside the view members (TS2339, TS2349, TS2722), in the demo's use of the views.
- **Demo:** `async fn add(a: i32, b: i32) -> i32 { a + b }` reads as `declaration.function` with `async: true`, two `declaration.parameter`s, a `type.primitive` return type and a `statement.block` whose tail is `expression.binary.arithmetic.add` with operator `+`. Building the view back renders the same text (the demo exits non-zero when it does not), and the structure `{ kind: 'expression.binary.arithmetic.add', … }` renders `x + y`.
- **Backward:** excludes `function_item` and `function_signature_item`, 2 of 152 claimed kinds, the holders of the 5 contextual claims.
- **Cost** (best of 5 over 200k): the low-level reader 105 ns; making the root's view 136 ns; reading a view's `name` 249 ns, the low-level read plus making the child's view.
