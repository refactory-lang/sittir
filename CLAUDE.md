# sittir

Generate typed factories, render templates, and native bindings from tree-sitter grammars.

## Quick reference

- Package manager: `pnpm`
- Validate: `pnpm test`, `pnpm type-check`, `pnpm lint`, `pnpm format:check`
- Generate a grammar package: `npx tsx packages/codegen/src/cli.ts --grammar <rust|typescript|python> --all --output packages/<lang>/src`

## Universal rules

- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, `packages/{rust,python,typescript}/factory-map.json5`, or `packages/{rust,python,typescript}/overrides.suggested.ts`; fix codegen or `packages/<lang>/overrides.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.
- Specs live under `specs/NNN-feature-name/`; feature branches use `NNN-short-name`.
- DRY is the core correctness rule for codegen work: each fact should have one source and one derivation.

## Detailed instructions

- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
