# Handoff — path keys are checked per written key (2026-09-10)

Branch `feat/strict-rebuild-from-source`, continuing from
[the labels-via-bindings handoff](2026-09-10-labels-via-bindings-handoff.md),
whose step 1 this is. Nothing pushed, no PR.

| | |
| --- | --- |
| done | `patches:` and `options:` keys judged by the type checker, from the base `wire()` is handed |
| next | that handoff's steps 2–4: `matchAddress` supertype membership, retire the flat surface, remove `RenderDefaults` |
| open | one rust callback site reports TS7006 where it reported TS2769; typescript and python grammars are `@ts-nocheck` so nothing checks their keys |

Gates: all three `test-fixtures.json` byte-identical, generated `src/`
unmoved (only the three `generated.manifest.json` source hashes changed),
validate identical to the previous two runs — rust `147 / 207 / 1259`,
typescript `143 / 193 / 1063`, python `126 / 142 / 1286` — codegen
`tsc --noEmit` clean, every grammar's `tsconfig.grammar-sittir.json` at its
baseline error count (rust 16, typescript 1, python 1), comment-slop gate
clean, suite 245 files / 3456 passed (the prior session's exact numbers).

The generated examples — the consumer all of this serves — re-emit
byte-identical (`pnpm run gen:examples` produces no diff under `examples/`;
its trailing `oxfmt` step exits 2 because `oxfmt-config.ts` ignores
`examples/**`, which predates this work), type-check at their ceiling
(rust 6, typescript 0, python 6), and rendered against their inputs through
`dogfoodContract` all three are identical modulo whitespace; typescript and
python reparse to the same tree, rust does not (the carried trivia gap).
Line-level differences are layout only: python drops six blank lines,
typescript renders four-space indentation where the source has tabs, rust
expands inline field lists to multiline and is missing three blank lines.

## What landed

**Enumeration was measured and rejected.** The first cut enumerated every
valid path of a rule from the post-enrich shape as a string-literal union,
depth-capped at 8, exactly as the previous handoff sketched. It stalled the
compiler past ten minutes against a 0.35 s baseline. Every alternative
spelling of a node — `_`, `-k`, `name:` — multiplies along a path, so the
union is 3–4^depth per leaf whatever the cap. Do not retry it.

**Validation instead.** `IsPath<Rule, Path>` in
`packages/codegen/src/grammar-shapes/path-type.ts` is the type-level twin of
`applyPath`: `Segments` splits on `/` keeping quoted literals whole (rust has
`"/="` as a token), `Step` mirrors the walker's dispatch one segment at a
time, `Walk` distributes over the union a wildcard produces so the rest of
the path need only hold on one member. Cost is per written key; there is no
depth cap. `IsPreferencePath` in `dsl/primitives/preference-path.ts` is the
same for `parsePreferencePath`, sharing `Segments`.

**`wire()` infers the two blocks.**

```ts
wire<B extends GrammarJson = any, const P = PatchesConfig<B>, const O = OptionsConfig>(
  config: WireConfig<B> & { patches?: P & PatchesCheck<B, P>; options?: O & OptionsCheck<B, O> },
  base?: B
)
```

Rust now calls `wire({ … }, enrichedBase)` with no type argument; typescript
and python already did. `PatchesCheck` judges each key against its rule's
post-enrich shape and maps a bad one to an object demanding the property
`patches: no such path in this rule`, so the error sits on the key's own line
and names it. `OptionsCheck` judges each option path for syntax and each
`_bindings` entry for being a declared `kind/path` whose root is not a real
kind — the three refusals `readOptionsBlock` makes at load time. It checks
nothing structural against the shape: option addresses name slots runtime
enrich mints, kinds `variant()` mints and supertype members reached through
a slot, none of which the base shape holds.

**Three inference traps, each hit once.**

1. An inferred type argument that fails its constraint is silently replaced
   by the constraint. With `const C extends WireConfig<B>` over the whole
   config, the fifteen baseline `$.x | undefined` errors failed the
   constraint, `C` became `WireConfig<B>`, and every key was judged against
   the generic map. The inferred parameters carry no constraint; the
   intersection checks `WireConfig<B>`.
2. A type parameter that a context-sensitive callback's contextual type
   mentions is fixed before the second inference pass. Inferring the whole
   config fixed `C` to its default as soon as a `rules:` callback needed
   typing, and checked nothing. Only the function-free blocks are inferred,
   each as its own parameter.
3. An explicit type argument disables inference for every parameter after
   it. `wire<GrammarJson>({ … })` in the codegen tests dropped `P` to its
   default, which is why the defaults are the loose block types and why the
   rust grammar had to lose its `wire<EnrichedGrammar<RustGrammarShape>>`.

**One deliberate looseness.** 129 of rust's 130 patch keys passed; the
one rejection, `line_comment` `'1/3'`, is an arm that runtime enrich's
exclusive field-choice distribution mints onto the choice and
`enrich-type.ts` does not replicate. A choice's modelled arity is therefore a
lower bound: an index beyond it yields an `Opaque` child under which any
segment is accepted. A sequence keeps exact bounds, since enrich wraps its
members in place and never changes their count. The ruling was that
loosening is acceptable as long as runtime is unaffected, and runtime is
untouched by all of this — `wire()`'s body and the rust grammar's runtime
are the same code.

## Residual

- `packages/rust/grammar.sittir.ts` `_non_delim_token`: the
  `original.members.map((m) => …)` site errored as TS2769 before and errors
  as TS7006 now. Same site, same cause (`members` is a union of tuple types
  so `map`'s callback loses its contextual parameter type), baseline count
  unchanged. The other fifteen baseline errors are the `ShapedSymbols`
  index-signature leak under `noUncheckedIndexedAccess`.
- The rust grammar glossary entry that justified the explicit type argument
  (`docs/rust-grammar-sittir-glossary.md`) is rewritten; the TS2589 it
  guarded came from enumerating keys inside `PatchesConfig`, which no longer
  happens.

## Gotchas

- **`tsc` is the native 7.0.2 compiler**, so sub-second grammar checks are
  real. `tsconfig.grammar-sittir.json` caches to
  `tsconfig.grammar-sittir.tsbuildinfo`; measure with
  `--incremental false --extendedDiagnostics`.
- **macOS has no `timeout`.** `perl -e 'alarm 240; exec @ARGV' -- <cmd>` is
  the time box; the enumeration attempt is why one is needed.
- **The per-package `tsconfig.json` does not include `grammar.sittir.ts`.**
  `tsconfig.grammar-sittir.json` does; that is the file to run.
- **`.test-d.ts` files are type-checked by codegen's `tsc`, not run by
  vitest.** Their `@ts-expect-error` negatives are the assertion.
- **The Write hook demands `generate_test_context` before a test file is
  written**, even a type-only one.

## Commands

```bash
for g in rust typescript python; do
  (cd packages/$g && pnpm exec tsc --noEmit --incremental false -p tsconfig.grammar-sittir.json --extendedDiagnostics 2>&1 | awk '/error TS|^Check time|^Instantiations/')
done
pnpm -C packages/codegen exec tsc --noEmit -p tsconfig.json
pnpm -C packages/codegen run build                      # separate call — it rm -rf's dist
pnpm run validate:native && pnpm run validate:history
git diff --stat -- 'rust/crates/*/test-fixtures.json'
pnpm exec vitest run                                    # its own call
bash scripts/comment-slop-check.sh --working
```
