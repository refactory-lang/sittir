# sittir

Sittir derives typed syntax APIs and native renderers from tree-sitter grammars. Read the [README](README.md) for the project overview and [architecture](docs/architecture.md) for its boundaries.

## Universal rules

- **DRY is the primary correctness rule:** every fact has one source and one derivation. Fix the owning source rather than adding a second representation or inference path.
- Read and follow the working standards imported below.
- Use Infigraph first for code discovery, symbol context, references, and refactor impact. Non-code documents may be read directly. Follow the global Infigraph instructions and the installed `infigraph-tool-routing` skill.
- Never hand-edit generated language or native render output. Change codegen or `packages/<grammar>/grammar.sittir.ts`, then regenerate.
- Preserve unrelated edits and active worktrees. Report failed gates and retain the evidence; do not make a failure disappear by loosening a ratchet.
- Document the API that exists on the task's base revision. Mark planned capabilities explicitly.
- Read a function's [glossary entry](docs/glossary/README.md) before editing it; document new internal code there rather than in source.
- Comments and docs never reference spec/plan/PR/task numbers or planning documents, because planning artifacts get deleted. State the constraint directly.
- Public API exception: handwritten declarations reachable through `createEngine` and its returned surface carry source JSDoc for the usage contract (parameters, returns, and throws). Detailed rationale stays in the glossary without duplication; generated public declarations are not covered by this exception yet.
- The runtime is native-only. Rust parsing and rendering are the source of truth; `createEngine` throws rather than falling back to a JavaScript renderer.
- TypeScript is ESM; local imports use `.ts` extensions.

The grammar executes twice: tree-sitter's CLI loads `.sittir/grammar.js`, and Sittir's `evaluate()` executes the same entry.
DSL-layer synthesis reaches parser AND IR; `.sittir/src/grammar.json` is parser ground truth. See [architecture](docs/architecture.md#grammar-and-compiler).

## Working standards

@.claude/coding-standards.md

## Commands

Use pnpm and the repository's pinned Node/Rust requirements. [DEVELOPMENT.md](DEVELOPMENT.md) is the command reference for setup, checks, generation, and native builds.

## Task-specific guidance

| Work | Read |
| --- | --- |
| Compiler, emitters, generated TypeScript | [Codegen conventions](.claude/codegen-conventions.md) and [compiler glossary](docs/compiler-phase-glossary.md) |
| Grammar authoring, parser or render gaps | [Grammar workflow](.claude/grammar-workflow.md) |
| Tests, diagnostics, branches, verification | [Project workflow](.claude/project-workflow.md) |
| Rust lint or allocation policy | [Clippy policy](docs/clippy-policy.md) |

Internal codegen function documentation belongs in the [function glossaries](docs/glossary/README.md). Apply the engine-surface JSDoc exception above; longer design explanations belong in linked documentation. Comments state live constraints rather than development history.
