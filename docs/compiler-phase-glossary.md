# Compiler and codegen reference

The compiler turns a tree-sitter-compatible grammar into the model used by TypeScript and native emitters. This page describes the phase boundaries and indexes the function glossaries. For runtime/package structure, read [Architecture](architecture.md).

## Pipeline order

```text
grammar.sittir.ts
  → sittirGrammar: enrich → wire → active grammar implementation
  → evaluate
  → link
  → normalize
  → simplify
  → assemble
  → emit TypeScript APIs + Rust transports/render bodies
```

`packages/codegen/src/run-codegen.ts` orchestrates generation; `compiler/generate.ts` drives the compiler and emitter boundary. Parser metadata is an input to this process, not an identity table independently reconstructed by each emitter.

## Dual-pipeline execution model

The grammar entry executes in two environments:

1. Tree-sitter loads the `.sittir/grammar.js` re-export and executes the entry with its grammar DSL to generate parser artifacts.
2. Sittir evaluates the entry with its own DSL implementation to obtain the compiler's rule graph.

`sittirGrammar` applies enrichment and authored wiring before calling the active `grammar` implementation. Both executions therefore see those structural edits. A kind minted only after the parser boundary cannot acquire a parser-issued identity merely by appearing in the TypeScript model.

The DSL encounters lowercase Sittir shapes and tree-sitter's uppercase/normalized shapes. Use `types/runtime-shapes.ts` predicates at this boundary. The generated `.sittir/src/grammar.json` and a CST probe establish the parser's actual structure.

## Phase contracts

| Phase | Source | Responsibility |
| --- | --- | --- |
| Enrich / wire | `dsl/enrich.ts`, `dsl/wire/`, `dsl/sittir-grammar.ts` | Apply mechanical grammar structure and authored changes in both executions |
| Evaluate | `compiler/evaluate.ts` | Execute the DSL and establish the compiler grammar boundary |
| Link | `compiler/link.ts` | Resolve references, parser identities, aliases, and canonical facts |
| Normalize | `compiler/normalize.ts` | Normalize structure and flatten wrappers into phase-appropriate attributes |
| Simplify | `compiler/simplify.ts` | Produce the derivation view used for slot/model construction |
| Assemble | `compiler/assemble.ts`, `compiler/model/`, `compiler/collect-slots.ts` | Materialize kinds, slots, references, and construction/render facts |
| Emit | `emitters/emit.ts`, `emitters/` | Derive the language package and native render module |

### Rule views

The discriminated rule union lives in `types/rule.ts`. Phase-specific views retain different information for different consumers:

- The linked view retains wrapped structure and reference provenance.
- The normalized render view retains the syntax needed for rendering, with wrapper meaning represented by attributes.
- The simplified derivation view supports slot and construction-model derivation.

`normalizeGrammar` uses the canonical `flattenRules` path and invokes `computeSimplifiedRules` with the attribute builder. It processes alias bodies through the corresponding views as well. Consumers should read the view/fact they need rather than reconstructing it from another view.

### Identity and aliases

A reference occurrence can carry an alias identity different from its source rule's isolated identity. Storage identity, parser grammar identity, display identity, and emitted names are separate facts. Resolve them where the reference and parser metadata are available, then carry them downstream.

Native storage and routing use grammar IDs; the parser's display ID has specific alias/envelope uses. See [Clippy policy](clippy-policy.md#kind-ids).

### Slot and construction facts

Assemble produces the model consumed by types, factories, readers, and render emission. Slot content, cardinality, names, and construction routes must have one owner and one derivation. A consumer-local walker or a parallel name table creates another correctness boundary.

A missing fact should be added at the earliest phase that can determine it honestly. Reaching back from an emitter to infer a fact again is not a substitute for that model change.

## Render emission

`emitAll` resolves shared render rules and spacing/site facts, dispatches the model to the emitters, and finalizes the generated outputs. The render-body IR (`emitters/render-body.ts`) represents literals, slots, conditions, indentation, and seams. The native emitter prints Rust code from those bodies and the model's transport facts.

`TemplateEmitter` is an internal codegen name: its finalized body catalog also feeds native emission and diagnostics. It is not a JavaScript template-rendering backend. There is no Jinja/Askama engine in the supported runtime.

The generated `.sittir/render-bodies.json` is a diagnostic catalog; the runtime uses compiled grammar-owned Rust code. Fix a rule/model/emitter defect at its source, not by editing the catalog or emitted Rust.

## Diagnostics and verification

Grammar diagnostics identify unsupported shapes or authoring conflicts. Compiler invariants belong to the phase that owns them. Keep a source witness and inspect the first boundary at which its structure, identity, or routing differs.

Use `tool probe-stages`, `tool probe-kind`, and `tool grammar-diagnostics` through the unified CLI. The exact commands and required generation/native/corpus gates are in [Development](../DEVELOPMENT.md).

A compiler refactor claiming no behavior change must preserve generated output. A behavior change needs an explicit witness and comparable per-grammar validation counts. A source-preserving parse/render result is distinct from a fresh build/render/reparse result.

## Function reference index

The source implementation is authoritative. Each function's detailed contract and rationale live in its directory glossary.

| Source area | Reference |
| --- | --- |
| Compiler phases and contexts | [compiler](glossary/compiler.md) |
| Assembled model and slots | [compiler model](glossary/compiler-model.md) |
| Grammar and shape diagnostics | [compiler diagnostics](glossary/compiler-diagnostics.md) |
| Enrichment and DSL transforms | [DSL](glossary/dsl.md) |
| DSL primitives | [primitives](glossary/dsl-primitives.md) |
| Path-addressed transforms | [transform](glossary/dsl-transform.md) |
| Authored wiring | [wire](glossary/dsl-wire.md) |
| TypeScript and native emission | [emitters](glossary/emitters.md) |
| Construction overlays | [overlays](glossary/emitters-overlays.md) |
| Grammar-shape projections | [grammar shapes](glossary/grammar-shapes.md) |
| Parser scaffolding | [transpile](glossary/transpile.md) |
| Rule and diagnostic types | [types](glossary/types.md) |
| SCM support | [SCM](glossary/scm.md) |
| Codegen diagnostics/scripts | [scripts](glossary/scripts.md) |
| Shared utilities | [utilities](glossary/util.md) |
| Codegen validation helpers | [validation](glossary/validate.md) |
| Codegen orchestration | [root](glossary/root.md) |
