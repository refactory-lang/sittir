<!--
Sync Impact Report
- Version change: 1.1.0 → 1.2.0 (two new principles from spec 008)
- Modified principles: none renamed
- Added sections:
  - VII. Grammar-Agnostic Pipeline (v1.1)
  - VIII. Non-lossy Transformations (v1.1)
  - IX. @sittir/core is the Rust-port surface (v1.2)
  - X. Don't hand-roll types you can import (v1.2)
- TreeNode-as-unifying-abstraction guidance stays in spec 008 only
  (scoped to that feature's validator work, not architecture-wide).
- Removed sections: none
- Technology Stack: "tsc / tsgo (strict mode)" → "tsgo (strict mode)" (v1.1)
- Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no changes needed
    (Constitution Check references this file dynamically)
  - .specify/templates/spec-template.md — ✅ no changes needed
  - .specify/templates/tasks-template.md — ✅ no changes needed
- Known violations of v1.2 principles being addressed by spec 008:
  - IX violation: generated `utils.ts::isNodeData` uses KindMap/LooseMap
    instead of NamespaceMap. Fix: US1 refactors.
  - X violation: validators/common.ts had hand-rolled TSNode/TSTree/etc.
    Fix: T004a landed, imports from web-tree-sitter now.
  - X violation: wrap.ts redeclares _NodeData locally despite importing
    WrappedNode from @sittir/types. Fix: US4 imports it.
  - X violation: types.ts emits _union_Foo_Bar_Baz auto-named aliases
    for single-use unions. Fix: US4 inlines with semantic names only
    when reused ≥2 sites.
  - X violation: types.ts emits five parallel per-kind alias families
    (XConfig, LooseX, XTree, ConfigMap, LooseMap) computable from a
    single NamespaceMap. Fix: US1 introduces NamespaceMap + NodeNs<T>.
- v1.1 violation still open:
  - emitters/types.ts:63-65 hardcodes integer_literal/float_literal/
    boolean_literal kind checks (violates VII). Tracked as tech debt.
- Follow-up TODOs: none
-->

# Sittir Constitution

## Core Principles

### I. Grammar Alignment

All terminology, naming conventions, and conceptual models MUST align
with tree-sitter and ast-grep. Use "node", "kind", "field", "named",
"anonymous", "supertype", "children" — never invent synonyms where a
well-known tree-sitter term exists. A developer familiar with
tree-sitter grammars and ast-grep rules MUST find the API intuitive
without consulting a glossary.

### II. Fewer Abstractions

Eliminate unnecessary types and indirection. Every type in
`@sittir/types` MUST justify its existence by solving a problem that
cannot be solved by an existing type. When in doubt, remove the
abstraction. Concrete examples of violations:
- A separate `LeafBuilder` class when `Builder` can handle terminals
- A `LeafOptions` discriminant when the builder type itself
  provides discrimination
- Wrapper types that add no behavior or safety

### III. Generated vs Hand-Written

Generated code and hand-written code MUST be clearly separated.
Generated files MUST carry a header comment marking them as generated
and MUST NOT be hand-edited. Hand-written files (base classes, render
context, validation) are preserved across regeneration. The codegen
system MUST be the single owner of generated files — no manual patches.

### IV. Test-First

Every generated factory MUST ship with a generated test that passes
without manual modification. Tests validate that the factory produces
correct `NodeData` (right `kind`, right fields) and that
`render(nodeData, rules)` produces valid source containing required
tokens. The generated test suite is the primary quality gate — if
tests do not pass for a grammar, the codegen is broken. Integration
tests (round-trip parse via tree-sitter) MUST cover representative
node kinds.

### V. Library-First

Sittir is a library consumed by codemod scripts and tooling. It MUST
NOT own CLI, formatting, or linting. External concerns (formatting via
oxfmt, matching via ast-grep) are accessed through hooks
(`RenderContext`) or left to the consumer. The `Edit` interface is the
integration boundary for codemod workflows.

### VI. Deterministic Output

Codegen MUST be deterministic — the same grammar version MUST produce
byte-identical output. No timestamps, random identifiers, or
order-dependent iteration. This enables diffing regenerated output
against prior versions and ensures CI reproducibility.

### VII. Grammar-Agnostic Pipeline

The codegen pipeline MUST work for any tree-sitter grammar without
modification. All language-specific knowledge — field names, external
token roles, spacing rules, formatting directives — MUST flow through
override configuration, never through hardcoded conditionals.

Concrete violations:
- `if (language === 'rust')` or `if (kind === 'function_item')` in
  pipeline code
- Hardcoded indent/dedent behavior instead of external role mapping
- Kind-specific type narrowing instead of override-driven classification

Test: would this logic break if applied to a different grammar? If
yes, it belongs in overrides, not in the pipeline.

### VIII. Non-lossy Transformations

Every optimization and transformation in the pipeline MUST preserve
all information that affects output. Merging, collapsing, factoring,
and deduplication MUST retain the data needed to reconstruct the
original output. When forms are collapsed, the original rule shapes
MUST be preserved. When variants are deduplicated, structurally
identical entries are removed but distinct content is retained.

This is distinct from Deterministic Output (same input → same output).
Non-lossy means: no transformation step silently discards data that a
downstream consumer needs.

### IX. @sittir/core is the Rust-port surface

`@sittir/core` is the runtime layer scheduled for a future port to
Rust. Every addition to core becomes a reimplementation obligation.
Keep it minimal.

**Belongs in core**: generic runtime primitives with clean Rust
analogues — `render()`, `readNode()`, `Edit` helpers, tree-walking
over structurally-compatible interfaces, path resolution, validation
passes that operate on grammar-agnostic shapes.

**Does NOT belong in core**: anything that depends on TypeScript-only
type projections (`NamespaceMap`, `ConfigOf<T>`, `FromInputOf<T, ...>`
etc.), per-grammar narrowing helpers, kind-parameterized guards. These
belong in the generated `utils.ts` per grammar (emitted by
`@sittir/codegen/src/emitters/client-utils.ts`).

**Test for additions**: before adding a new primitive to `@sittir/core`,
ask "would this port cleanly to Rust as runtime?" If the answer
involves TypeScript-only type projections, the primitive belongs in
the generated grammar package's utilities, not core.

### X. Don't hand-roll types you can import

If a type is already published by a dependency — tree-sitter,
web-tree-sitter, ast-grep, `@sittir/types`, another workspace package
— import it. Redeclaring it locally creates a second source of truth
that drifts silently from the canonical one and masks upstream API
changes.

**Applies to**:
- Tree-sitter types (`TS.Node`, `TS.Tree`, `TS.Parser`, `TS.Language`
  from `web-tree-sitter`) — never redeclare as `TSNode`, `TSTree`, etc.
- Ast-grep types (`SgNode`, `Range`, `Pos` from `@ast-grep/wasm`) —
  import, don't paraphrase.
- Sittir's own types (`NodeNs<T>`, `AnyNodeData`, `WrappedNode<K>`,
  `_NodeData` from `@sittir/types`) — import, don't redeclare in
  generated output.
- Factored union aliases — if two or more generated files need the
  same union, emit one named alias with a semantic name; don't
  auto-generate `_union_Foo_Bar_Baz` copies.

**Corollary to II (Fewer Abstractions)**: II says every type must
justify its existence. X sharpens that: a type that redeclares an
importable canonical type has no justification at all — the
justification would need to explain why the import is worse, and
such cases are vanishingly rare.

**Test**: when adding an interface, check whether `web-tree-sitter`,
`@ast-grep/wasm`, `@sittir/types`, or any existing workspace module
already publishes the shape. If yes, import.

## Technology Stack

- **Language**: TypeScript (ESM, `.ts` extensions in imports)
- **Package manager**: pnpm (workspaces)
- **Testing**: Vitest
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Type checking**: tsgo (strict mode)
- **Grammar inputs**: `grammar.json` + `node-types.json` from
  tree-sitter grammar packages
- **Zero runtime dependencies**: generated builder packages MUST NOT
  pull in third-party runtime dependencies

## Development Workflow

- Feature branches follow `NNN-short-name` convention matching spec
  directories (e.g., `001-codegen-grammarjs-rewrite`)
- Speckit workflow for specification-driven development:
  specs, plans, tasks, checklists under `specs/NNN-feature-name/`
- Generated packages (`@sittir/rust`, `@sittir/typescript`,
  `@sittir/python`) are regenerated from `@sittir/codegen` — never
  hand-edited
- All PRs MUST pass type-check and test suite across all packages
  before merge

## Governance

This constitution supersedes ad-hoc practices. Amendments require:
1. A rationale explaining why the change is needed
2. Impact assessment on existing generated code
3. Version bump following semver (MAJOR for principle
   removal/redefinition, MINOR for additions, PATCH for clarifications)

All code reviews MUST verify compliance with these principles.
Complexity beyond what the constitution permits MUST be justified in
the plan's Complexity Tracking table.

**Version**: 1.2.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-04-17
