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
- Hand-written source in the trees the glossary covers (`packages/codegen/src/`, `packages/common/src/`, `packages/tools/src/`, `packages/types/src/`) carries no explanatory comments. An author puts the why of a non-obvious decision in the commit message; a PR that adds an exported declaration there writes its entry in the per-directory glossary under `docs/glossary/` in the same PR, because the key ratchet (`sittir tool glossary-keys`) fails master's CI on any rise in undocumented declarations; the docs peer rekeys, deletes and fills in the rest after the merge ([how to look one up / add one](docs/glossary/README.md)). Before editing a function, read its glossary entry and the commit messages that touched it.
- Exception — the public API: hand-written declarations reachable through the engine (`createEngine` and what it returns — engine methods, node surface, factories, exported types) carry JSDoc in source (the usage contract: what it does, parameters, returns, throws). Detailed exposition (rationale, design, internals) still lives in the glossary, and the two do not repeat each other. Generated public surfaces are not covered yet. Everything else stays glossary-only.
- Comments and documentation (glossary entries, ADRs, JSDoc, inline) must not reference spec/plan/PR/task numbers (e.g. "PR-137", "ADR-0009", "spec 026", "R11", "task 8"). Those planning artifacts get archived, renamed, or deleted — a numbered reference rots into a dangling pointer nobody can resolve. Describe the actual constraint, invariant, or rationale directly instead of citing where it was decided.
- Don't introduce new jargon. Name a thing with the word the architecture, the specs, the glossary and the code already use for it, with the meaning they give it: a kind's portable name is its path; a path holds slots, options (a slot bound to a preference) and flags; a preference is the grammar layer's declared choice among equal forms; a token of a parse is slot content, trivia or a fixed token. This covers identifiers, type names, diagnostic codes, comments, specs, plans and reports alike. If no existing word fits, say so and ask before coining one; a label needed for one comparison is marked as shorthand where it is introduced and does not travel into code or a spec.
- The grammar executes TWICE: tree-sitter's CLI runs `grammar.sittir.ts` through the `.sittir/grammar.js` re-export (Node strips the types, so every file it imports must use erasable syntax only), and sittir's `evaluate()` runs its own implementation of the tree-sitter DSL — both call the same enrich/wire modules, so DSL-layer synthesis reaches parser AND IR, while anything minted only in compile-time post-passes exists only on the sittir side (a phantom kind: a name with no parser-issued kindId). Ground truth for "did tree-sitter see it" is `.sittir/src/grammar.json`. Full model: [Codegen glossary](docs/compiler-phase-glossary.md).

## Working standards

@.claude/coding-standards.md

## Peer sessions

A session named `sittir-<role>` reads [.claude/peers.md](.claude/peers.md), then its spec and plan task, before anything else, on start and after a restart or compaction. The spec and plan are the authority.

## Detailed instructions

- [Codegen glossary](docs/compiler-phase-glossary.md) — DSL layer + dual-pipeline execution model + compiler-phase narrative, with an index into the per-directory function glossaries (`docs/glossary/`).
- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)

