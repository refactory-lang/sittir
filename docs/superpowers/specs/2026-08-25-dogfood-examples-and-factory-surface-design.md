# Dogfood examples and the factory surface — design

**Status:** approved design, not yet implemented
**Date:** 2026-08-25
**Depends on:** the `engine.parse()` / diagnostics split, the uniform verbatim
slot carrier in the native transport, and the `deep` read flag (in flight on
the `parse-api` branch). The examples are written against `engine.parse`.

## Goal

Make the examples realizable by proving the *construction* surface is
complete for real code: a human writes an `ir.*` program that reconstructs
a real source file from this repository, and the friction met while
writing it is the API work list. Three languages, three real files, no
escape hatches.

## 1. The examples

| module | reconstructs | stresses |
| --- | --- | --- |
| `examples/17-dogfood-rust.ts` | `rust/crates/sittir-core/src/splice.rs` | `//!`/`///` doc trivia, `#[derive(...)]` token trees, `enum` with struct variants, `impl Trait for`, `match` with struct patterns, `write!` macro invocation, `!a \|\| !b` conditions, closures with method chains, `for` loops, `Result`/`Err` generics |
| `examples/18-dogfood-typescript.ts` | `packages/common/src/format.ts` | `import type`, JSDoc trivia, generics, `readonly T[]`, destructuring, `??`, template literals, spread-with-`&&` object literals, arrow functions, `for..of` over `Object.entries` |
| `examples/19-dogfood-python.ts` | `packages/tools/scripts/probe-sweep.py` | shebang + module docstring, imports, dict comprehension, `try/except`, `with ... as`, keyword arguments, f-strings, tuple returns, `if __name__ == ...` |

Each module exports one function returning the rebuilt root
(`ir.sourceFile.from(...)`, `ir.program.from(...)`, `ir.module.from(...)`).
Comments are part of the contract and are attached with `$trivia(...)`;
the read path already carries them (`compute_trivia` on read,
`render_with_trivia!` on render), so a rebuilt tree must carry them too.

The three existing modules `16-dogfooding.ts` (TypeScript codegen sketch)
and the pending-surface stubs keep their numbers; the new modules take the
next free numbers and are added to `examples/tsconfig.json` so they are
compile-checked, and to `examples/README.md`.

### Test contract

One `examples-verify.test.ts` per grammar package
(`packages/{rust,typescript,python}/tests/`; TypeScript and Python gain the
file). For each dogfood module:

1. **Reparse equality.** `rebuilt.$render()` parsed with `engine.parse`
   has the same `structuralShape` (kinds, slot storage, trivia; positions
   and text dropped) as `engine.parse(readFileSync(target))`.
2. **Whitespace-normalized identity.** `rebuilt.$render()` and the target
   file are byte-identical after collapsing whitespace. Every token,
   literal and comment must match; layout is not the claim — canonical
   render whitespace may differ from the author's.

Byte-for-byte identity is explicitly **not** asserted for a full rebuild.
Byte fidelity of untouched regions is the `$replace` + `applyEdits` /
verbatim-stub path, exercised by examples 10 and 14.

### No escape hatches

If a construct cannot be expressed through `ir.*` / `from()`, the example
does not fall back to a verbatim string. The construct is written as the
closest legal shape (which fails the test), marked in place with a
`// GAP <class>: <what>` comment, and the example stays red until the API
is fixed at its root. `GAP` markers are working notes: they are deleted as
each gap closes and are never committed as permanent comments.

## 2. Friction protocol — defect classes and their roots

| class | symptom while hand-rolling | root |
| --- | --- | --- |
| **A. Unreachable kind** | a factory exists but the kind has no `ir.*` entry and no namespaced constructor path | `ir` namespace emitter / `namespacedConstructors` eligibility (`namespaceOf`) |
| **B. Missing loose form** | `from()` accepts only a strict node where the `.from()` resolution table should have a string/config row | `from` emitter's per-field resolver selection |
| **C. Ergonomic mismatch** | the factory needs N nested calls for a shape the language writes in one token; form/polymorph constructor names don't match how an author thinks | `FactoryShape` derivation in `factory-map`, form naming in `namespaced-constructors` |
| **D. Render defect** | the factory builds the right tree but the rendered text is not reparse-equal (dropped separator, token-changing spacing) | template walker / `render-module` |
| **E. Artefact kind exposed as a top-level builder** | the program has to call a builder for a kind no author would name (`ir.visibilityModifierInPath(path)`, `armN`/`groupN` mints, polymorph arms) | `factoryInline` (section 3) |

Fixes are made at the root only — emitter or model change, regenerate all
three grammars, gates — never in generated output. When all three examples
exist, the `GAP` set is deduplicated into one work list grouped by class,
and each class is fixed as one slice covering every site it names.

Evaluation heuristic while writing: every `ir.<kind>` typed that is not a
word in the target language is a class-E finding.

## 3. `factoryInline`

A declared section of each `packages/<lang>/grammar.sittir.ts`, alongside
overrides: the kinds that have **no top-level `ir.*` builder** and are
constructed only through nested config on the slot(s) that reference them.

- **Stamped at the source.** A pass that synthesizes a kind (enrich mints,
  polymorph arms, group mints) adds it to `factoryInline` at mint time.
  Emitters read one model attribute, `node.factoryInline`, stamped at
  link; nothing downstream asks where a kind came from. Hand-authored
  entries cover grammar-native kinds that are still factoring artefacts.
- **Parent nests, child stays internal.** The parent's `from()` accepts
  the inline kind's shape as nested config (the same loose input it
  already accepts for that slot — the direct path is removed, not a second
  path added); the parent's factory calls the child's `build*` function
  internally; the parent's `$with` setter takes the same nested config.
  `is.*` guards and the `types.ts` interface remain — an inline kind can
  still be read from a parsed tree.
- **Link-time diagnostic.** A `factoryInline` kind that is the grammar
  root, a supertype member reachable outside its parent(s), or referenced
  from no slot fails `link` with a diagnostic: there is no parent config
  to nest it in.
- **Ratchet.** The `ir` entry count per grammar only shrinks. Single-parent
  reference is necessary but not sufficient — `parameters` is
  single-parent and stays a builder because it is a noun of the language;
  the examples are the evidence for each entry.

**What `factoryInline` is not.** It removes a top-level `ir.*` entry; it
cannot create a construction path. A hidden (`_`-prefixed) kind has no `ir`
entry to begin with, so declaring one is a no-op. Kinds that are unreachable
rather than over-exposed are a `namespacedConstructors` eligibility problem
(reached as `ir.<parent>.<form>(…)`) or a `from()` nested-config problem — not
this mechanism. `visibility_modifier_in_path` was originally nominated as the
first entry on that mistaken basis: it is hidden, so the declaration would do
nothing, and `ir.visibilityModifier.pub({ in: … })` is construction work —
`.pub` is a strict namespaced constructor that no coercion path reaches.

## 4. Loose setters on `engine.parse` nodes

The `from` emitter resolves each field through an inlined resolver
expression (`_resolveOneBranch<T>(input.x, ...)`, `_requireField(...)`,
list resolvers) inside `coerceTo<Kind>`. Each becomes a named, exported
per-field function, `resolve<Kind>_<field>(input): <strict field type>`,
called by both `coerceTo<Kind>` and the wrap emitter's `$with.<field>`.
One resolver per (kind, field), two callers.

- Wrapped (tree) nodes: `$with.<field>(value: <loose field input>)`.
- Factory-built nodes: `$with` stays strict.

A loose set installs a factory-built child inside a tree node. The
materializer copies non-stub values structurally, and with the verbatim
slot carrier untouched siblings keep their bytes while the replaced child
renders canonically — the codemod story of examples 10 and 14.

## 5. Pending-surface examples

After `engine.parse` lands:

- `03-trivia`, `06-composition`, `12-cross-language-migration`,
  `15-generate-file`: rewritten template-free onto the current surface and
  promoted to compile-checked.
- `14-format-preserving-transform`: rewritten onto `engine.parse` +
  accessor navigation + `$with` (loose) + `$replace`/`applyEdits`; no
  `findAndRead` needed for the guide's scenario. Promoted.
- `04`, `05`, `11` (construction templates) and `08`, `10`, `13`
  (`findAndRead`): stay pending on their ADRs, which need a native-only
  revision before implementation (their wasm/JS-fill sections are stale;
  `ast-grep-core` is still commented out in `sittir-core`'s manifest).

## 6. Sequencing

1. `parse-api` branch lands (parse/diagnostics, verbatim carrier, deep
   flag) — prerequisite for the tests.
2. Write the three dogfood examples with `GAP` markers; land the red tests
   pinned with `it.fails` per gap class so the numbers are visible.
3. Fix classes in order E (`factoryInline`, largest surface change), A, B
   (including section 4's shared resolvers), C, D — one slice per class,
   each regenerating all three grammars and passing the full gates
   (`validate history` numbers compared, full suite).
4. Promote pending-surface examples per section 5.

## Out of scope

- Byte-identical full-file rebuilds.
- Construction templates and the typed query API (both are separate work).
- Any behaviour keyed on synthesis provenance at emit time.
