# Architecture

Sittir derives a grammar-specific syntax API and renderer from a shared compiler model. The public surface is TypeScript; parsing and rendering use grammar-owned Rust N-API bindings.

## Grammar and compiler

`packages/<grammar>/grammar.sittir.ts` composes the upstream grammar with Sittir's authored structure. `sittirGrammar` enriches and wires that structure before handing it to the active grammar implementation.

The entry runs twice: tree-sitter runs it to generate its parser, and Sittir evaluates it into the compiler's rule model. The `.sittir/grammar.js` entry re-exports the TypeScript grammar; Node's type stripping therefore requires erasable syntax in that import graph.

The compiler runs evaluate → link → normalize → simplify → assemble, then emits the language package and native render module. Parser metadata supplies physical grammar identities. Reference-site facts preserve aliases and storage routing; display names are not interchangeable with grammar identities.

| Stage | Principal responsibility |
| --- | --- |
| Evaluate | Execute the grammar DSL and retain authored structure |
| Link | Resolve references, identities, attributes, and provenance |
| Normalize / simplify | Turn wrappers and structural patterns into canonical facts |
| Assemble | Build the model consumed by emitters |
| Emit | Derive TypeScript APIs, native transports, and render code from that model |

Detailed phase contracts and function references live in the [compiler glossary](compiler-phase-glossary.md).

## Generated language package

A grammar package's public entry exports its descriptor and types. Calling the descriptor's `createEngine()` loads its implementation and binds the generated surface to an engine.

| Artifact | Purpose |
| --- | --- |
| `src/types.ts`, `src/grammar.ts` | Per-kind type families, discriminants, and grammar projections |
| `src/factories/` | Strict constructors, coercing resolvers, and composed construction paths |
| `src/wrap.ts`, `src/is.ts` | Typed readers/accessors and kind guards |
| `src/engine.ts`, `src/api.ts`, `src/index.ts` | Language implementation and descriptor boundary |
| `src/node-model.json5` | Inspectable compiler model |
| `src/portable.ts` | Vocabulary kind IDs and guards for languages with authored bindings |
| `.sittir/src/`, `.sittir/parser.wasm` | Parser artifacts and metadata used by generation and tooling |
| `.sittir/render-bodies.json` | Render-body catalog used by diagnostics |
| `rust/crates/sittir-<grammar>/src/render/` | Generated native transports, options, and render functions |
| `native/` | N-API loader, declarations, and platform binary |

There is no template engine in the active render path. Render bodies are generated from rules and compiled into Rust.

## Portable vocabulary preview

`packages/<grammar>/grammar.bindings.ts` authors vocabulary claims and member routes against the grammar model. The binding compiler resolves them once and emits the portable classification surface alongside the grammar-specific API.

Selecting `api: 'portable'` currently returns language identity, vocabulary `kinds`, and language-scoped `is` guards. It classifies grammar-specific nodes; construction, parsing, queries, and rendering remain on the grammar-specific engine. Portable node projections, readers, and builders are planned. See the [usage guide](use-cases-and-examples.md#portable-preview) for the executable preview example.

## Runtime and node families

The engine binds builders, readers, guards, and render operations to one language and lifecycle. Construct through `engine.build`; parsing and reading through the engine produce nodes with the same language-specific accessor surface.

Per-kind families distinguish construction inputs, built nodes, and parsed nodes. The generated declarations are the contract: use the package's exported types or derive them from `Engine<API>`, rather than reconstructing a node's storage by hand.

Internally, kind identity is numeric. Slot storage uses generated `_<storage_name>` properties; leaves may carry `$text`, and source/layout state lives in `$_layout`. This internal representation is not a public JSON construction protocol. Accessors, `$with`, and the engine's builders preserve the required metadata.

Parsing returns the root directly. Its `$errors` contains parse-error regions; `{ errors: 'throw' }` rejects a parse with errors. Hydration is lazy by default, and the parse depth changes when children are materialized rather than the meaning of the tree.

## Rendering and editing

An untouched parsed node can render from its original source span. A constructed or updated node renders through its generated grammar body while retaining reusable source/layout information on unchanged children. Thus source-preserving edits and canonical construction share the same render machinery.

`$with` is immutable. Replacing a child does not mutate its parent; reconstruct the ancestor path to obtain an updated root. Queries are views over parsed structure. To query an updated root with the implemented engine surface, render it and parse the result again. The reserved `Project.save` operation writes project files to disk; that project API remains planned.

Use `using` to dispose an engine at scope exit, after its parsed trees and query views are no longer needed. A parsed view's lifetime depends on its engine.

## Packages and boundaries

- `packages/types`: shared type contracts and projections
- `packages/common`: engine ownership, node operations, query evaluation, and native integration
- `packages/codegen`: grammar DSL, compiler model, and emitters
- `packages/{rust,typescript,python,regex,scm}`: generated language packages
- `rust/crates/sittir-core`: native parsing, typed reading, layout, and rendering infrastructure
- `rust/crates/sittir-transport-macros`: generated transport derivation and compile-time checks
- `packages/tools` and `packages/cli`: diagnostics, validation, generation orchestration, and the command interface

Codegen must not depend on diagnostic tooling. A fact belongs at the earliest phase that can determine it once; downstream consumers use that fact. See the [working standards](../.claude/coding-standards.md).
