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
- Generated artifacts are derived outputs. Do not hand-edit `packages/{rust,python,typescript}/src/*`, `packages/{rust,python,typescript}/templates/*.jinja`, `packages/{rust,python,typescript}/.sittir/*`, `packages/{rust,python,typescript}/factory-map.json5`, or `packages/{rust,python,typescript}/overrides.suggested.ts`; fix codegen or `packages/<lang>/overrides.ts` and regenerate.
- TypeScript is ESM; local imports use `.ts` extensions.


## Detailed instructions

- [Compiler phase glossary](docs/compiler-phase-glossary.md) — per-function reference for every phase.
- [Architecture and data model](.claude/architecture.md)
- [TypeScript and codegen conventions](.claude/codegen-conventions.md)
- [Grammar, templates, and overrides workflow](.claude/grammar-workflow.md)
- [Validation and project workflow](.claude/project-workflow.md)


### Override parser comparison

Comparing base tree-sitter WASM vs `packages/<grammar>/.sittir/parser.wasm` on the corpus:

- rust: base parser errors `2`, override parser errors `12`, override-only regressions `10`
- typescript: base parser errors `2`, override parser errors `31`, override-only regressions `29`
- python: base parser errors `0`, override parser errors `1`, override-only regressions `1`

So the remaining skip debt is primarily **override parser regression**, not validator/read-render-parse logic.
