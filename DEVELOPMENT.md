# Development

Contributor workflow for the sittir monorepo. This file is the single
source for dev commands; other docs link here instead of restating them.

## Setup

Prerequisites: Node 20+, [pnpm](https://pnpm.io), and a Rust toolchain
(the native render engines are N-API crates built with `napi`).

```bash
pnpm install
```

## Everyday commands

```bash
pnpm test                     # all vitest suites (records test history)
pnpm test:watch               # watch mode
pnpm type-check               # tsc --noEmit across the workspace
pnpm run type-check:examples  # type-check the example modules
pnpm lint                     # oxlint
pnpm format:check             # oxfmt
pnpm build                    # full workspace build
```

## Regenerating grammar packages

Generated packages (`packages/{rust,typescript,python}/src`, `templates/`,
`.sittir/`) are derived outputs — never hand-edit them; fix
`packages/codegen/src/` or `packages/<lang>/grammar.sittir.ts` and
regenerate.

```bash
pnpm run regen:all            # regenerate all three grammars

# One grammar via the unified sittir CLI
pnpm exec tsx packages/cli/src/cli.ts gen --grammar rust --all --output packages/rust/src
```

## Validation

```bash
pnpm run validate:native      # regen all grammars + native validator counts
pnpm run validate:history     # compare recorded validation runs (objective before/after)
```

`validate:native` is the primary gate for codegen-affecting work. For
corpus-affecting changes report raw per-grammar counts (fromPass/fromTotal,
covPass/covTotal, rtPass/rtTotal/rtAstMatchPass, factoryPass/factoryTotal),
compared against a recorded baseline — not eyeballed.

## Native engine build

Each grammar's render engine is a Rust N-API crate under
`rust/crates/sittir-<lang>/` (shared core in `rust/crates/sittir-core/`).

```bash
cd rust/crates/sittir-rust
pnpm run build                # napi build --platform --release
pnpm run build:debug          # debug binding (dev only)
```

Prefer release builds when running the validators; the validation load is
sized for the optimized binding.

## Diagnostic tooling

Developer diagnostics live behind the unified `sittir` CLI:

```bash
pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]   # tool --help lists all
pnpm exec tsx packages/cli/src/cli.ts validate counts
```

See [docs/cli-command-glossary.md](docs/cli-command-glossary.md) for the
full command reference and
[.claude/project-workflow.md](.claude/project-workflow.md) for tool
highlights and the convention for adding a new diagnostic.

## API docs

```bash
pnpm docs                     # typedoc
pnpm run docs:md              # markdown output
```

## Further reading

- [.claude/coding-standards.md](.claude/coding-standards.md) — repo-wide working standards
- [.claude/codegen-conventions.md](.claude/codegen-conventions.md) — codegen/TS conventions
- [.claude/grammar-workflow.md](.claude/grammar-workflow.md) — grammar, template, and override workflow
- [docs/compiler-phase-glossary.md](docs/compiler-phase-glossary.md) — compiler phase narrative + function-glossary index
