# sittir

Generate typed factories, render templates, and native bindings from tree-sitter grammars.

## Quick reference

- Package manager: `pnpm`
- Validate: `pnpm run validate:native`
- Generate a grammar package: `pnpm exec tsx packages/cli/src/cli.ts gen --grammar <rust|typescript|python> --all --output packages/<lang>/src`
- Developer diagnostics: `pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]` (run with `--help` for the list). Tools include `counts`, `dump-ast-mismatches`, `diff-failures`, `probe-kind`, `profile`, and others — see [project workflow doc](.claude/project-workflow.md#diagnostic-tools-sittirtools) for the full list and authoring conventions.
- CLI command reference: [docs/cli-command-glossary.md](docs/cli-command-glossary.md) — every `sittir` command, generated from the commander tree.

## Universal rules

- DRY is the #1 core correctness rule for codegen work: each fact should have one source and one derivation. For example, the source of truth for node kinds is the tree-sitter grammar; the source of truth for factory signatures is the rendered template. Avoid hand-editing derived outputs, and fix the source or codegen logic instead.
- The js/dispatch-based engine is **deprecated**. The Rust render engine, Rust Tree-Sitter bindings are the source of truth.
- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, or `packages/{rust,python,typescript}/overrides.suggested.ts`; fix codegen or `packages/<lang>/overrides.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.

## Detailed instructions

- [Compiler phase glossary](docs/compiler-phase-glossary.md) — per-function reference for every phase.
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

### Override parser comparison

Comparing base tree-sitter WASM vs `packages/<grammar>/.sittir/parser.wasm` on the corpus:

- rust: base parser errors `2`, override parser errors `12`, override-only regressions `10`
- typescript: base parser errors `2`, override parser errors `31`, override-only regressions `29`
- python: base parser errors `0`, override parser errors `1`, override-only regressions `1`

So the remaining skip debt is primarily **override parser regression**, not validator/read-render-parse logic.
