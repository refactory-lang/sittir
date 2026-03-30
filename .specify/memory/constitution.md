<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0 (initial ratification)
- Added principles: I. Grammar Alignment, II. Fewer Abstractions,
  III. Generated vs Hand-Written, IV. Test-First, V. Library-First,
  VI. Deterministic Output
- Added sections: Technology Stack, Development Workflow
- Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no changes needed
    (Constitution Check references this file dynamically)
  - .specify/templates/spec-template.md — ✅ no changes needed
  - .specify/templates/tasks-template.md — ✅ no changes needed
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

## Technology Stack

- **Language**: TypeScript (ESM, `.ts` extensions in imports)
- **Package manager**: pnpm (workspaces)
- **Testing**: Vitest
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Type checking**: tsc / tsgo (strict mode)
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

**Version**: 1.0.0 | **Ratified**: 2026-03-24 | **Last Amended**: 2026-03-24
