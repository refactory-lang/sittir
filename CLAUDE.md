# sittir

Generate typed factories, render templates, and native bindings from tree-sitter grammars.

## Quick reference

Dev commands are sourced from [DEVELOPMENT.md](DEVELOPMENT.md) — the three most-used, inline for convenience:

- Validate: `pnpm run validate:native` (compare runs: `pnpm run validate:history`)
- Generate a grammar package: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`
- Developer diagnostics: `pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]` (`--help` lists all) — see [project workflow doc](.claude/project-workflow.md#diagnostic-tools-sittirtools) for tool highlights and authoring conventions.

CLI command reference: [docs/cli-command-glossary.md](docs/cli-command-glossary.md) — every `sittir` command, generated from the commander tree.

## Universal rules

- DRY is the #1 core correctness rule for codegen work: each fact should have one source and one derivation. For example, the source of truth for node kinds is the tree-sitter grammar; the source of truth for factory signatures is the rendered template. Avoid hand-editing derived outputs, and fix the source or codegen logic instead.
- The js/dispatch-based render engine is **removed** (`@sittir/legacy-core` survives only as diagnostic/validator tooling). The Rust render engine and Rust tree-sitter bindings are the source of truth; `createEngine()` is native-only and throws rather than falling back.
- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/.sittir/*`, `rust/crates/sittir-{rust,python,typescript}/src/*`; fix codegen or `packages/<lang>/grammar.sittir.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.
- Comments and documentation (glossary entries, ADRs, JSDoc, inline) must not reference spec/plan/PR/task numbers (e.g. "PR-137", "ADR-0009", "spec 026", "R11", "task 8"). Those planning artifacts get archived, renamed, or deleted — a numbered reference rots into a dangling pointer nobody can resolve. Describe the actual constraint, invariant, or rationale directly instead of citing where it was decided.
- Explanatory comments do not live in `packages/codegen/src/` — they live in the per-directory glossaries under `docs/glossary/`, one `###` section per declaration ([how to look one up / add one](docs/glossary/README.md)). Read a function's glossary entry before editing it; document new code there, not in source.
- The grammar executes TWICE: tree-sitter's CLI runs the esbuild-bundled `.sittir/grammar.js`, and sittir's `evaluate()` re-runs the same DSL — both call the same bundled enrich/wire code, so DSL-layer synthesis reaches parser AND IR, while anything minted only in compile-time post-passes exists only on the sittir side (a phantom kind: a name with no parser-issued kindId). Ground truth for "did tree-sitter see it" is `.sittir/src/grammar.json`. Full model: [Codegen glossary](docs/compiler-phase-glossary.md).

## Working standards

@.claude/coding-standards.md

## Detailed instructions

- [Codegen glossary](docs/compiler-phase-glossary.md) — DSL layer + dual-pipeline execution model + compiler-phase narrative, with an index into the per-directory function glossaries (`docs/glossary/`).
- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)

<!-- BEGIN INFIGRAPH v2 -->
## Infigraph — Code Intelligence (auto-generated)

This project is indexed by Infigraph. Use Infigraph MCP tools FIRST for all code tasks.
Fall back to grep/Read only if Infigraph returns nothing or for non-code files.

### Tool Preferences
1. **`search`** for ALL code search — hybrid BM25+vector+grep in one call
2. **`get_doc_context`** before editing any function — returns source+callers+callees
3. **`trace_callers`** / **`find_all_references`** before refactoring — never grep for callers
4. **`trace_callees`** / **`transitive_impact`** for blast radius
5. Read files directly only for non-code files or Edit tool line-number context

### Subagent Rules
Do NOT spawn these agent types for code tasks — they lack MCP access:
- **Explore** → use `search`, `search_code`, `search_symbols` directly
- **Plan** → use `get_architecture`, `get_skeleton`, `get_stats` directly
- **code-reviewer** → use `get_doc_context`, `get_code_snippet`, `review` directly

For tasks requiring a subagent, use **general-purpose** — it has full MCP/infigraph access.

### Verbose tools — delegate to subagent
`get_architecture`, `transitive_impact`, `detect_dead_code`, `detect_clusters`,
`detect_clones`, `export_graph`, `query_graph`, `trace_callers`/`trace_callees` (deep),
`group_query`, `group_index`

### Context Compression
Tool outputs are automatically compressed to save context window budget.
- Compression scales with session length (Off → Summary → Aggressive → Minimal)
- `search` results are capped at Summary level to preserve result quality
- Security tools (`detect_security_issues`, `detect_taint_flows`, etc.) are never compressed
- `get_code_snippet` passes through uncompressed for edit accuracy
- No action needed — compression is transparent and automatic
<!-- END INFIGRAPH -->
