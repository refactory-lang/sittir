# sittir

Sittir derives typed syntax APIs and native renderers from tree-sitter grammars. Read the [README](README.md) for the project overview and [architecture](docs/architecture.md) for its boundaries.

## Rules for every task

- **DRY is the primary correctness rule:** every fact has one source and one derivation. Fix the owning source rather than adding a second representation or inference path.
- Read and follow the [working standards](.claude/coding-standards.md).
- Use Infigraph first for code discovery, symbol context, references, and refactor impact. Non-code documents may be read directly. See [tool routing and session continuity](.claude/infigraph.md).
- Never hand-edit generated language or native render output. Change codegen or `packages/<grammar>/grammar.sittir.ts`, then regenerate.
- Preserve unrelated edits and active worktrees. Report failed gates and retain the evidence; do not make a failure disappear by loosening a ratchet.
- Document the API that exists on the task's base revision. Mark planned capabilities explicitly.

## Commands

Use pnpm and the repository's pinned Node/Rust requirements. [DEVELOPMENT.md](DEVELOPMENT.md) is the command reference for setup, checks, generation, and native builds.

## Task-specific guidance

| Work | Read |
| --- | --- |
| Compiler, emitters, generated TypeScript | [Codegen conventions](.claude/codegen-conventions.md) and [compiler glossary](docs/compiler-phase-glossary.md) |
| Grammar authoring, parser or render gaps | [Grammar workflow](.claude/grammar-workflow.md) |
| Tests, diagnostics, branches, verification | [Project workflow](.claude/project-workflow.md) |
| Rust lint or allocation policy | [Clippy policy](docs/clippy-policy.md) |

Internal codegen function documentation belongs in the [function glossaries](docs/glossary/README.md). Handwritten public API declarations carry usage JSDoc; longer design explanations belong in linked documentation. Comments state live constraints rather than development history.
