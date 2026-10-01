# sittir

Generate typed factories, render templates, and native bindings from tree-sitter grammars.

## Quick reference

Dev commands are sourced from [DEVELOPMENT.md](DEVELOPMENT.md) — the three most-used, inline for convenience:

- Validate (and generate): `pnpm run validate:native` (compare runs: `pnpm run validate:history`)
- Developer diagnostics: `pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]` (`--help` lists all) — see [project workflow doc](.claude/project-workflow.md#diagnostic-tools-sittirtools) for tool highlights and authoring conventions.
- Independently generate a grammar package: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`

CLI command reference: [docs/cli-command-glossary.md](docs/cli-command-glossary.md) — every `sittir` command, generated from the commander tree.

## Universal rules

- DRY is the #1 core correctness rule for codegen work: each fact should have one source and one derivation. For example, the source of truth for node kinds is the tree-sitter grammar; the source of truth for factory signatures is the rendered template. Avoid hand-editing derived outputs, and fix the source or codegen logic instead.
- Use Infigraph for code and doc search: the `infigraph-tool-routing` skill (`~/.claude/skills/infigraph-tool-routing/SKILL.md`) says which tool answers which question and how to set up a worktree.
- The js/dispatch-based render engine is **removed**. The Rust render engine and Rust tree-sitter bindings are the source of truth; `createEngine()` is native-only and throws rather than falling back.
- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/.sittir/*`, `rust/crates/sittir-{rust,python,typescript}/src/*`; fix codegen or `packages/<lang>/grammar.sittir.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.
- Explanatory comments do not live in `packages/codegen/src/` — they live in the per-directory glossaries under `docs/glossary/`, one `###` section per declaration ([how to look one up / add one](docs/glossary/README.md)). Read a function's glossary entry before editing it; document new code there, not in source.
- Exception — the public API: hand-written declarations reachable through the engine (`createEngine` and what it returns — engine methods, node surface, factories, exported types) carry JSDoc in source (the usage contract: what it does, parameters, returns, throws). Detailed exposition (rationale, design, internals) still lives in the glossary, and the two do not repeat each other. Generated public surfaces are not covered yet. Everything else stays glossary-only.
- Comments and documentation (glossary entries, ADRs, JSDoc, inline) must not reference spec/plan/PR/task numbers (e.g. "PR-137", "ADR-0009", "spec 026", "R11", "task 8"). Those planning artifacts get archived, renamed, or deleted — a numbered reference rots into a dangling pointer nobody can resolve. Describe the actual constraint, invariant, or rationale directly instead of citing where it was decided.
- The grammar executes TWICE: tree-sitter's CLI runs `grammar.sittir.ts` through the `.sittir/grammar.js` re-export (Node strips the types, so every file it imports must use erasable syntax only), and sittir's `evaluate()` runs its own implementation of the tree-sitter DSL — both call the same enrich/wire modules, so DSL-layer synthesis reaches parser AND IR, while anything minted only in compile-time post-passes exists only on the sittir side (a phantom kind: a name with no parser-issued kindId). Ground truth for "did tree-sitter see it" is `.sittir/src/grammar.json`. Full model: [Codegen glossary](docs/compiler-phase-glossary.md).

## Working standards

@.claude/coding-standards.md

## Detailed instructions

- [Codegen glossary](docs/compiler-phase-glossary.md) — DSL layer + dual-pipeline execution model + compiler-phase narrative, with an index into the per-directory function glossaries (`docs/glossary/`).
- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)

