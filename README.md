# sittir

Take any [tree-sitter](https://tree-sitter.github.io/) grammar; emit a typed,
tree-shakeable IR — factories, render templates, parse-tree readers, type
guards, and per-kind tests — that can build, render, read, and edit source in
the original language with zero hand-authored per-kind code.

> **Alpha.** Public APIs, generated package shapes, override conventions, and
> native render fidelity are still moving. Pin versions and review generated
> edits before applying them at scale.

## Why

Cross-language source manipulation is split across three kinds of tooling
that don't compose:

- **Parsers and CST libraries** (tree-sitter, the various per-language
  parser crates) give you a syntax tree, but the tree is untyped at the
  application layer — you check `node.type === 'function_item'` against
  string constants and reach into anonymous children by index. There is no
  construction API and no canonical way back to source text.
- **Pattern engines** (ast-grep, semgrep, comby) find and rewrite by
  syntactic pattern. They are excellent for matching, but their rewrites
  are template strings with metavariables, not typed node manipulation;
  anything that needs to *compose* AST fragments — let alone construct one
  from scratch — falls out of the model.
- **Typed AST libraries** (Babel for JavaScript, libcst for Python,
  syn/quote for Rust, Roslyn for C#) give you the construction and
  rendering surface, but each one is a per-language, hand-authored project
  with its own conventions, lifecycle, and ergonomics. Anything that wants
  to touch more than one language ends up gluing three of them together.

A codemod that reads Rust, edits a TypeScript declaration, and emits a
Python equivalent currently means hand-stitching three separate AST
libraries with three separate mental models — and accepting that two of
them probably can't render back to source faithfully.

### Why tree-sitter and ast-grep as the base

tree-sitter is the only widely adopted parsing layer with grammars for
essentially every mainstream language, error-recovering parses (a hard
requirement for codemods that touch real-world, sometimes-broken source),
incremental reparse, and a uniform CST shape with field labels. Building
on top of it means inheriting the entire grammar ecosystem instead of
reinventing it.

ast-grep sits one step above tree-sitter as the matching layer — typed
patterns with metavariables (`$NAME`, `$$$ARGS`), language-aware queries,
and a stable selection model. sittir doesn't replace ast-grep; it
complements it. ast-grep finds the nodes, sittir reads the matches into
typed `NodeData`, the typed factories let you compose replacements
without string-mashing, and the render pipeline puts the result back into
source text.

### What this unlocks

**A single typed platform for source manipulation.** TypeScript + ast-grep
+ sittir is one toolchain covering the whole lifecycle — parse, query,
read into typed `NodeData`, construct or modify with typed factories,
render back to source, emit byte-range edits — under one set of types
and one mental model. The same `is.functionItem` guard narrows both an
ast-grep match and a constructed node, and the same `wrapNode` produces
a typed accessor surface for either. There is no glue layer between
three separately-evolving AST libraries.

**Type-intelligent use of tree-sitter and ast-grep.** Both projects are
already powerful, but at the application layer their outputs are
string-typed: `node.type === 'function_item'`, `match.kind() === 'block'`,
metavariable bindings handed back as opaque `SgNode` references.
sittir's generated package types each kind exhaustively from the
grammar — so a tree-sitter parse becomes a discriminated `NodeData`
union, an ast-grep match wraps into a `wrapNode(match, tree)` accessor
with field-typed getters, and a metavariable replacement composes
through typed factories instead of template-string concatenation.
Every check the grammar already makes implicitly is reflected in the
type system explicitly.

**Syntactic validity by construction — no reparse step.** Most
code-generation tools emit text and then leave validation to whoever
re-parses the output. sittir collapses the two:

- *Structurally, at compile time.* Each kind's slot signature is
  derived from its grammar rule. The TypeScript type system enforces
  that every required field is supplied, every named field gets a node
  of the right kind (or a `.from()`-coercible value resolving to one),
  and every list slot honors the rule's multiplicity (`optional`,
  `repeat`, `repeat1`). Trees that don't typecheck are trees the parser
  would reject.
- *Literally, at runtime.* Terminal-text inputs to leaf factories
  (identifier names, integer/string literals, etc.) are validated
  against the same regex / enum / keyword definition the grammar uses.
  An invalid identifier fails at construction, before render.

Because validity is enforced where the tree is built, you don't need to
parse the rendered output to know it's well-formed. The render pipeline
also doesn't need to re-tokenize — it walks an already-validated tree
and emits text directly through the grammar-derived templates.

### Natural extensions

The shape of the runtime makes a few additions almost free; we haven't
shipped them yet but they are in scope:

- **Construction templates.** Authoring replacement source as a
  template string with metavariable slots — `pub fn $NAME($...PARAMS)
  -> $RET { $BODY }` — and filling it with typed `NodeData` to produce
  either another `NodeData` or rendered text. The same override
  pipeline that produces the production parser also produces a
  template-mode parser per grammar (a tiny patch injects a metavariable
  rule and merges it into the relevant nominal rules), so templates
  parse cleanly without preprocessing or `ERROR` nodes. Slot types are
  derived at codegen time by walking the template parse tree and
  reading each metavariable's parent-field storage type — the same
  storage type the factory's `Config` already uses, so factory
  construction and template filling stay in sync by construction.
  Stubbed in `examples/04-precompiled-templates.ts` and
  `examples/05-inline-templates.ts`.
- **Type-aware structural query API.** Pattern matching directly over
  `NodeData` trees with the same kind/field types the rest of the
  surface uses, so the same tree you constructed (or modified, or read)
  can be queried without re-rendering and handing it back to ast-grep.
- **Typed node traversal.** Parent / child / sibling / ancestor walks
  with TypeScript narrowing on the result. ast-grep already covers
  traversal over parse trees; the gap is over `NodeData` trees that
  exist only in memory (constructed factories, modified copies after
  `$with`).
- **More grammars.** Adding a language is a workspace package, a
  `tree-sitter-<lang>` dependency, and an `overrides.ts`. Go, Java, C,
  SQL, and others have mature tree-sitter grammars and are candidates
  whenever a use case appears.

## Goals

- **One pipeline, many languages.** All language-specific knowledge enters
  through `grammar.json`, `node-types.json`, and a per-grammar
  `overrides.ts`. The compiler is grammar-agnostic; the same emitters
  produce Rust, TypeScript, and Python packages today and accept any other
  tree-sitter grammar without code changes.
- **Render fidelity, then ergonomics.** A round-trip
  `read(source) → render` must be byte-identical for well-formed input on
  each grammar before any ergonomic surface is layered on top. Render lives
  on the canonical rule tree; `.from()` coercion, `$with` immutability,
  fluent getters, and `.$trivia()` are projections over the same
  `NodeData`.
- **Two backends, one contract.** A Nunjucks-based JS engine and an
  Askama-based native engine sit behind one engine interface. Native is
  preferred when the platform binary is loadable and its baked
  template-bundle hash matches the JS-side bundle; otherwise JS handles the
  same call. Consumers don't branch on backend.
- **Determinism.** Same grammar version, same overrides, byte-identical
  generated output. No timestamps, no Map iteration order, no PRNG.
- **DRY as a correctness rule.** Every fact (a field name, a separator, a
  kind classification) has one source and one derivation. Drift between
  the rule tree and the generated client is treated as a codegen bug, not
  a patchable mismatch.

## Architecture

### Codegen pipeline

A full regeneration runs in two stages. First, an auto-chain pushes the
override DSL into the actual parser:

```
overrides.ts ──▶ transpile ──▶ .sittir/grammar.js ──▶ tree-sitter generate
                                                          │
                                                          ├─▶ grammar.json
                                                          ├─▶ node-types.json
                                                          └─▶ compile-parser ─▶ parser.wasm
```

Both `enrich(base)` and the per-rule overrides (`transform()`, `role()`,
`variant()`) participate in this transpile, so the grammar tree-sitter
parses with — and the type information sittir reads downstream — see the
same enriched shape. There is no second authoring layer; one source
patches both surfaces.

The compiler proper then runs in seven ordered phases over the parser
artifacts. Each phase has a single responsibility and produces a
well-defined intermediate representation; later phases never revisit
decisions earlier ones made. Detailed per-function semantics live in
[`docs/compiler-phase-glossary.md`](docs/compiler-phase-glossary.md); the
summary below is the contract a reader needs to navigate the source.

| Phase                | Source                       | Input                           | Output                              | Responsibility                                                                                                                                                                                            |
| -------------------- | ---------------------------- | ------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0. Enrich**        | `dsl/enrich.ts`              | `GrammarResult`                 | Enriched `GrammarResult` + `_kw_*`  | Mechanical grammar pre-pass invoked from `overrides.ts` as `grammar(enrich(base), {...})`. Promotes bare symbols to `field()`, lifts `optional(literal)` keywords into hidden `_kw_*` rules. Because enrich runs inside the override-DSL transpile, its rewrites end up in `.sittir/grammar.js` — the parser and the downstream codegen see identical rules. |
| **1. Evaluate**      | `compiler/evaluate.ts`       | `grammar.js` / `overrides.ts`   | `RawGrammar`                        | Executes the tree-sitter DSL with sittir extensions (`role()`, `variant()`, `transform()`). Normalizes seq/choice/optional/repeat, lifts `commaSep` patterns, synthesizes hidden enum rules from inline `field(name, choice('a','b','c'))`. |
| **2. Link**          | `compiler/link.ts`           | `RawGrammar`, `node-types.json` | `LinkedGrammar`                     | Resolves what each node *is*. Strips `alias` and `token` wrappers, classifies hidden rules (enum / supertype / group), detects clauses, infers field names from the symbol-reference graph, classifies polymorphs (both heuristic and `variant()`-sourced), annotates block-bearer fields. Shape-preserving — no restructuring. |
| **3. Optimize**      | `compiler/optimize.ts`       | `LinkedGrammar`                 | `OptimizedGrammar`                  | Non-lossy structural simplification. Collapses degenerate wrappers, fans out `seq(a, choice(b, c))`, factors common prefix/suffix, dedupes adjacent members, inlines single-use hidden rules. Does not rename fields or reclassify nodes. |
| **3.5. Simplify**    | `compiler/simplify.ts`       | `OptimizedGrammar`              | `simplifiedRules` map               | Derivation-only view. Strips anonymous delimiters, hoists fields out of single-content wrappers, merges position-equivalent choice branches. Used to derive each kind's field/child slots — *not* used by template emission, which keeps the raw rule so delimiters survive. |
| **4. Assemble**      | `compiler/assemble.ts`       | `OptimizedGrammar`              | `NodeMap`                           | First materialization of nodes. Classifies each rule into a model type (branch / polymorph / supertype / group / enum / pattern / keyword / token), hydrates slot refs, marks parameterless kinds (kinds whose required slots auto-stamp from a single literal or a single parameterless ref), resolves colliding names, assigns short `ir.*` keys. |
| **5. Emit**          | `emitters/*`                 | `NodeMap`                       | `.ts` + `.jinja` files              | Renders types, factories, `.from()` resolvers, `wrap.ts`, type guards, the `ir.ts` namespace, consts, render rules, Jinja templates, JoinBy metadata, the native render bundle, and per-kind tests. |

Three commitments worth flagging:

- **Single source of truth for shape.** The rule tree is canonical. Every
  derived artifact — types, factories, render templates, field
  projections, supertype unions — is computed from it. There is no sidecar
  config that restates the same fact.
- **Mechanical only.** No phase makes heuristic judgments based on
  thresholds or frequency counts. Anything that would ask "is this common
  enough?" stays out of the automated path; grammar maintainers express it
  explicitly via `transform()`, `role()`, or `variant()` in the override
  DSL.
- **Same pipeline runs every grammar.** Rust, TypeScript, and Python share
  one compiler. New grammars enter through a workspace package and a
  `packages/<lang>/overrides.ts`; no compiler fork.

### Runtime

The runtime is split into a backend-neutral contract layer and a single
native engine implementation. The JS (Nunjucks) `SittirEngineLike` engine
has been removed — native is the only supported backend, and
`createEngine()` throws if the native binding is unavailable rather than
falling back.

```
                 ┌──────────────────────────────────┐
                 │  @sittir/<grammar>                │  generated, per-grammar
                 │   ir, from, wrap, is, types,      │
                 │   ConfigOf<T>, TreeNodeOf<T>,     │
                 │   templates/*.jinja               │
                 │   createEngine() ──┐              │
                 └────────────────────┼──────────────┘
                                      ▼
                       ┌────────────────────────────────┐
                       │  @sittir/<grammar>-native       │
                       │  N-API binding (Askama crate)   │
                       │  rust/crates/sittir-<grammar>/  │
                       └──────────────┬───────────────────┘
                                      │  implements SittirEngineLike
                                      ▼
                          ┌────────────────────────────┐
                          │  @sittir/common             │
                          │  readNode, applyEdits,      │
                          │  freezeNodeData, NodeData,  │
                          │  TreeHandle, native boundary│
                          └─────────────────────────────┘
                                      │
                                      ▼
                          ┌────────────────────────────┐
                          │  @sittir/types              │
                          │  AnyNodeData, ConfigOf<T>,  │
                          │  TreeNodeOf<T>, Edit, ...   │
                          │  (zero runtime)             │
                          └─────────────────────────────┘
```

- **`@sittir/types`** — pure TypeScript types. Zero runtime. Owns
  `AnyNodeData`, `ConfigOf<T>`, `TreeNodeOf<T>`, `FromInputOf<T>`, `Edit`,
  `ByteRange`, `RenderContext`.
- **`@sittir/common`** — backend-neutral runtime. Implements
  `readNode(tree, handle?, childIndex?)` (parse-tree → `NodeData`),
  `applyEdits(source, edits)`, `freezeNodeData()`, the native boundary
  invariants (`assertNativeNodeData`, `normalizeNativeReadNode`), and
  `createNativeEngine()`, which the native backend implements against the
  shared `SittirEngineLike`/tree-handle interfaces.
- **`@sittir/core`** — shared engine option/handle types
  (`resolveEngineFormat`) plus a lower-level Nunjucks-backed renderer
  (`createRenderer`/`createRendererFromConfig`) retained for template
  rendering outside the `SittirEngineLike` surface; it no longer hosts a
  `SittirEngineLike`-conforming JS engine.
- **Generated `@sittir/<grammar>` packages** — per-grammar surface. Each
  one exposes `createEngine()` (native-only), an `ir.*` namespace, `.from()`
  coercion, `wrapNode`, `readTreeNode`, the `is.*` / `assert.*` guards, kind
  constants, and the native template-bundle hash.

#### NodeData shape

`NodeData` is plain frozen data — not an ES class. Every node carries
`$type` (numeric `TSKindId`), `$source` (`0=ts`, `1=sg`, `2=factory`),
`$named`, plus either `_<field>` storage and `$children` (branch) or
`$text` (leaf). Field storage is enumerable and lower-cased
(`_visibilityModifier`, not `_visibility_modifier`). Arrays in storage are
themselves frozen.

#### Construction surface

Each kind ships in three forms with the same output type:

```ts
ir.functionItem.strict({ /* every field explicit, no coercion */ })
ir.functionItem.from({   /* loose input — strings / arrays / plain objects */ })
ir.functionItem({         /* alias for .from() */ })
```

`.from()` coercion is closed-form: it walks the expected slot type and
never guesses. The slot taxonomy splits cleanly into:

- **Single-slot kinds** (one unnamed `$children` slot, no named fields):
  the factory takes the child(ren) directly — singular for one slot,
  variadic for arrays, non-empty variadic when the rule requires `repeat1`.
- **Multi-slot kinds** (named fields, with or without `$children`): the
  factory takes a config object whose keys map to field names.

Strings only resolve when the slot expects a single concrete kind with a
no-arg factory. Arrays auto-wrap when the slot is a `$children`
container. Plain objects resolve recursively against the slot type.
Required slots whose type has a parameterless factory default to the
empty form when omitted.

#### Cursor / value duality

The generated surface separates the cursor (a handle into the rule tree)
from the resolved value (the underlying NodeData):

```ts
fn.name        // cursor — handle into the tree, lazy
fn.name()      // value  — resolved NodeData (or hoisted leaf text)
fn.$with.name(ir.identifier('greet'))     // returns a new frozen node
fn.$with.body(ir.block.strict())           // chainable, immutable
```

Accessor functions (`fn.name()`) are non-enumerable; they don't appear in
`Object.keys` or JSON serialization. Storage (`fn._name`) is enumerable
and represents the canonical persisted state. `$with` is the immutable
update namespace; for kinds with a single unnamed slot it exposes
`$with.$child(v)` and `$with.$children([...])` instead of named keys.

#### Render pipeline

```
NodeData ──▶ render rule ──▶ Jinja template ──▶ source text
              (raw rule)      (per kind)
```

Render reads `_<field>` and `$children` directly off `NodeData`. Templates
are emitted from the *raw* post-Optimize rule, deliberately ahead of
Simplify, so anonymous delimiters and separator placement survive.
Field/child derivation reads the simplified rule; templates and derivation
are two views of the same tree.

`createEngine()` returns an engine that delegates to the native binding
when its `templateBundleHash` matches the JS-side hash, and to
`@sittir/core` otherwise. The native FFI path is N-API direct — no
`serde_json` round-trip on either side — and streams `Renderable::Transport`
references through Askama templates rather than materializing
per-field intermediate strings. The fallback to JS is silent (no throw,
no log) unless `SITTIR_BACKEND_DEBUG=1` is set; force a backend with
`SITTIR_BACKEND=native` or `SITTIR_BACKEND=js`. Inspect the resolved
engine with `getActiveBackend()`.

#### Read pipeline

```
source ──▶ tree-sitter parse ──▶ TreeHandle ──▶ readNode(tree) ──▶ NodeData
                                                                       │
                                                              wrapNode(node, tree)
                                                                       ▼
                                                       NodeData + fluent getters
                                                       + lazy drill-in via $nodeHandle
```

`readNode` is the shared parse-tree reader: it maps field children into
`_<field>` slots and unfielded children into `$children`, recurses to a
configurable depth, and produces the same `NodeData` shape whether the
parse tree came from `web-tree-sitter` or `@ast-grep/napi`. `wrapNode`
attaches the typed accessor surface and resolves lazy `$nodeHandle`
references back through the engine's reader on demand.

#### Edit pipeline

```
TreeNode + replacement NodeData ──▶ replace(target, replacement) ──▶ Edit { startPos, endPos, insertedText }
[Edit] + source ──▶ engine.applyEdits(source, edits) ──▶ new source
```

Edits are byte-range patches keyed off the original tree's spans.
Multiple edits on disjoint ranges are sorted and applied right-to-left so
positions stay valid; overlapping edits throw. `replace`, `replaceField`,
and `bindRange` live in `@sittir/common`; `engine.applyEdits` is the
boundary used by codemods.

### Generated package layout

Every `@sittir/<grammar>` package is regenerated as a unit. Hand edits to
generated files are reverted on the next run; language-specific knowledge
lives in `packages/<lang>/overrides.ts`.

| File                                          | Contents                                                                                       |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `types.ts`                                    | Per-kind interfaces, `TSKindId` const enum, `KIND_NAMES`, `ConfigFor<K>`, `NamespaceMap`, supertype unions |
| `factories.ts`                                | One factory per kind: `kind.strict(config)` and `kind.from(input)` with shared output          |
| `from.ts`                                     | Closed-form `.from()` resolver — no runtime inference                                          |
| `wrap.ts`                                     | `wrapNode(node, tree)` / `readTreeNode(node)` — typed accessors with lazy drill-in             |
| `ir.ts`                                       | `ir.*` namespace + grouped supertype namespaces (`expression`, `statement`, ...)               |
| `is.ts`                                       | Type guards (`is.*`, `isNode`, `isTree`, `assert.*`)                                           |
| `consts.ts`                                   | Discoverable arrays/maps: kind names, keywords, operators                                      |
| `utils.ts`                                    | Per-grammar resolution helpers and transport coercion                                          |
| `engine.ts`                                   | `createEngine()` — native first, JS fallback                                                   |
| `backend.ts` / `boundary.ts` / `hash.ts`      | Backend selection, dispatching shims, baked template-bundle hash                               |
| `grammar.ts`, `node-model.json5`              | Grammar literal type and a debug snapshot of the assembled model                               |
| `templates/*.jinja`                           | One render template per renderable kind                                                        |

## Quickstart

The compile-checked examples live under [`examples/`](examples/) and are
type-checked by `pnpm run type-check:examples`. The four below are the
ones backed by the current public API; the rest of the directory documents
target surfaces in flight.

### Construct and render

```ts
import { ir } from '@sittir/rust';

// Strict construction — every slot explicit.
const fn = ir.functionItem.strict({
  visibilityModifier: ir.visibilityModifier.pub(),
  name: ir.identifier('main'),
  parameters: ir.parameters.strict(),
  body: ir.block.strict()
});

fn.$render();      // "pub fn main () {}"
fn.name();         // typed value — leaf-hoisted to its $text
fn.body();         // returns the Block NodeData
```

```ts
// .from() coercion — strings, arrays, and plain objects resolve to their
// expected slot kind.
import { ir } from '@sittir/rust';

const fn = ir.functionItem.from({
  visibilityModifier: 'pub',                                       // string → VisibilityModifier
  name: 'greet',                                                   // string → Identifier
  parameters: ir.parameters.strict(
    ir.parameter.from({ pattern: 'name', type: 'String' })         // nested .from()
  ),
  body: ir.block.strict()
});
```

### Read source into NodeData

```ts
import { createEngine, ir, is, wrapNode } from '@sittir/rust';

const engine = createEngine();
const { root, tree } = engine.reader!.parseAndRead(source);

for (const stmt of root.$children ?? []) {
  if (is.functionItem(stmt)) {
    const fn = wrapNode(stmt, tree) as ReturnType<typeof ir.functionItem>;
    console.log(fn.name(), fn.body());
  }
}
```

`engine.reader` is `undefined` for render-only backends; guard before
calling `parseAndRead`.

### Round-trip

```ts
import { createEngine, wrapNode } from '@sittir/rust';

const engine = createEngine();
const { root, tree } = engine.reader!.parseAndRead(source);
(wrapNode(root, tree) as { $render(): string }).$render() === source;
// true for well-formed input
```

For the broader target surface — `.$trivia()`, construction templates,
find-and-edit codemods, cross-language migration — see
[`docs/use-cases-and-examples.md`](docs/use-cases-and-examples.md). Each
section there is annotated with whether it tracks shipped behavior or a
target API in flight.

## Packages

| Package                                     | Purpose                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| [`@sittir/types`](packages/types)           | Pure TypeScript types — zero runtime                                                 |
| [`@sittir/common`](packages/common)         | Backend-neutral runtime: `readNode`, `applyEdits`, native boundary, engine interface |
| [`@sittir/core`](packages/core)             | JS render engine (Nunjucks); reference implementation                                |
| [`@sittir/codegen`](packages/codegen)       | Seven-phase compiler, emitters, and CLI                                              |
| [`@sittir/tools`](packages/tools)           | Diagnostics + validation facade: `probe-*`, `counts`, `probe-factory`, `history`, `walk`, `exercise`, `inspect-*` (CLI + run APIs) |
| [`@sittir/rust`](packages/rust)             | Generated Rust package                                                               |
| [`@sittir/typescript`](packages/typescript) | Generated TypeScript package                                                         |
| [`@sittir/python`](packages/python)         | Generated Python package                                                             |

## Development

```bash
pnpm install                  # install workspace
pnpm test                     # run all vitest suites
pnpm -r run type-check        # type-check every package
pnpm run type-check:examples  # type-check the example modules
pnpm run validate:all         # cross-backend validator counts (native + JS, recursive)

# Regenerate one grammar package
pnpm --filter @sittir/rust run regenerate

# Or invoke the codegen CLI directly
npx tsx packages/codegen/src/cli.ts --grammar rust       --all --output packages/rust/src
npx tsx packages/codegen/src/cli.ts --grammar typescript --all --output packages/typescript/src
npx tsx packages/codegen/src/cli.ts --grammar python     --all --output packages/python/src
```

## License

MIT
