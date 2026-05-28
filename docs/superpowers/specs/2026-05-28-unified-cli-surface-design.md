# Unified CLI surface — `@sittir/cli`

**Date:** 2026-05-28
**Status:** Design approved; pending spec review → implementation plan

## Problem

sittir has three independent CLI entry points with three different
argument-parsing styles and overlapping responsibilities:

| CLI | Lines | Arg parsing | Role |
|-----|-------|-------------|------|
| `packages/codegen/src/cli.ts` | 757 | hand-rolled `switch` over `--grammar/--nodes/--all/...` | codegen **and** dispatches to tools via a hardcoded `TOOL_NAMES` set (duplicates the tools registry); mirrors `runRt/runFactory/runFrom` from the validator |
| `packages/tools/src/cli.ts` | 127 | per-tool ad-hoc (each tool loops over `argv` itself) | registry of 23 tools → module specifiers; most thin-delegate to `codegen/src/scripts/*.ts` |
| `packages/validator/src/cli.ts` | 387 | **`commander`** (already), with reusable `makeBackendOption()`/`makeRecursiveOption()` Option factories | `counts`, `probe-factory`, `history`, `trace-rt` |

Concrete DRY violations this causes:

- **Triple-registered command names.** `TOOL_NAMES` (codegen) duplicates the
  `TOOLS` registry (tools). `counts` is referenced in all three surfaces.
- **A 4-hop indirection for `counts`:**
  `codegen cli` (`TOOL_NAMES`) → `tools cli` → `tools/validate/counts.ts` →
  `codegen/scripts/counts.ts` (compat shim) → `validator runCountsCli` (real impl).
- **Shared options reimplemented per surface.** `--grammar`, `--backend`,
  `--recursive`, `--output` exist in three forms; only the validator has
  reusable Option factories.
- **Mirrored library functions.** `runRt/runFactory/runFrom` are duplicated in
  `codegen/src/cli.ts` (acknowledged in code comments) to dodge the
  `validator → codegen` dependency direction.
- **`_isMain` entry-guard boilerplate** repeated in every CLI and every tool.

**Goal:** one `sittir <namespace> <command>` surface with a single,
consistent configuration/options approach (commander + composable option
mixins + a light command interface), zero duplicated command registries, and
the orchestration logic living in reusable library entries rather than CLI
files.

## What this spec is (two things)

1. **A new `@sittir/cli` package** exposing one `sittir` binary with grouped
   namespaces.
2. **A refactor of codegen's library surface.** `codegen/src/cli.ts` is ~700
   lines of *orchestration logic*, not arg-parsing — the `--all` chain
   (transpile → tree-sitter generate → compile-parser → codegen → native build
   → emit-diff), the grammar-diagnostics preflight gate, manifest writing, and
   parity-fixture extraction. This logic must move into reusable codegen library
   entries (`runCodegen(config)`, `runFullRegen(grammar, opts)`) that the new
   `gen` command *calls*. Without this extraction, the cutover would copy-paste
   logic into `@sittir/cli` — the opposite of the DRY goal driving the effort.

The validator and tools CLIs are genuinely thin; codegen's is not. The spec is
written as both a new-package spec and a codegen-library refactor.

## Package topology

```
core/common → codegen → validator → tools → cli   (linear; no dependency cycle)
```

`@sittir/cli` depends on `@sittir/codegen`, `@sittir/validator`, and
`@sittir/tools`. It is the new top of the stack. The existing dependency order
already makes `tools` the de-facto top (it depends on both codegen and
validator); `cli` sits just above it.

**Invocation / bin story.** Everything runs from source today via `tsx` +
tsconfig `@sittir/*` path mapping (no dist build required; see
`project_tsconfig_paths_source_resolution`). The new package keeps this model:

- `package.json` → `"bin": { "sittir": "src/cli.ts" }`, run via `tsx`.
- Workspace link so `pnpm exec sittir <...>` resolves to source.
- Root npm scripts call `pnpm exec sittir <...>` (or `tsx packages/cli/src/cli.ts`)
  — no compiled artifact in the loop.

## Command surface (grouped namespaces)

| Namespace | Commands |
|-----------|----------|
| `sittir gen` | `--grammar <g> [--all \| --nodes <list>] --output <dir>` plus `--transpile`, `--compile-parser`, `--ts-generate`, `--skip-ts-chain`, `--no-build-native`, `--no-emit-diff`, `--allow-diagnostic <code>` |
| `sittir validate` | `counts`, `probe-factory`, `history`, `trace-rt` |
| `sittir tool` | the 22 remaining tools, **each rewritten** onto the framework: `probe-kind`, `probe-stages`, `probe-parity`, `profile`, `profile-factory`, `bench`, `bench-codemod`, `diff-failures`, `dump-ast-mismatches`, `check-baseline`, `check-perf`, `check-jinja`, `list-kinds`, `classify`, `phantom-kinds`, `field-provenance`, `inspect-type`, `inspect-refs`, `compare-overrides`, `grammar-diagnostics`, `walk`, `exercise` |

The tools registry has 23 entries today; the 23rd, `counts` (a compat alias),
is **removed** from the `tool` namespace along with the
`codegen/src/scripts/counts.ts` shim. The canonical counts is `sittir validate
counts`, which calls `validator`'s `runCountsCli` directly — the 4-hop
indirection collapses to one call.

`sittir validate --help` lists only validation commands; `sittir tool --help`
lists only tools. Discoverability without a flat 30-command wall.

## Framework (light interface + composable mixins)

No class hierarchy — commander already provides the command tree. The shared
structure is a thin interface plus option mixins and resolver functions.

```ts
interface CommandModule {
  name: string;
  describe: string;
  register(parent: Command): void;
}

// composable option mixins — generalize the validator's existing
// makeBackendOption()/makeRecursiveOption() into a shared module.
withGrammar(cmd)    // -g/--grammar, choices: rust|typescript|python
withBackend(cmd)    // -b/--backend, choices: native|js|all, default: native
withRecursive(cmd)  // -r/--recursive
withOutput(cmd)     // -o/--output

// shared resolvers (plain functions, lifted out of validator/cli.ts):
resolveGrammars(args)   // unknown names dropped; defaults to all three
resolveBackends(mode)   // native|js|all → Backend[]
defaultTemplatesPath(g) // per-grammar templates dir
```

A single registrar walks the `CommandModule`s for each namespace and wires
them onto the commander program. The `_isMain` entry-guard exists once (in the
CLI's main), not per command.

Example:

```ts
export const counts: CommandModule = {
  name: 'counts',
  describe: 'Per-grammar raw pass/total counts for all four validators',
  register: (program) =>
    withBackend(program.command('counts'))
      .argument('[grammars...]', 'Grammars to validate; defaults to all')
      .action((grammars, opts) => runCountsCli(grammars, opts.backend)),
};
```

## `sittir gen` — codegen-library extraction

`codegen/src/cli.ts`'s orchestration moves into the codegen package's library
surface:

- `runCodegen(config: CodegenConfig): Promise<void>` — the core generate path
  (the body currently after arg-parsing in `mainCli`).
- `runFullRegen(grammar, opts): Promise<void>` — the `--all` chain:
  transpile → tree-sitter generate → compile-parser → `runCodegen` → native
  build → emit-diff.
- The grammar-diagnostics preflight (`runGrammarDiagnosticsPreflight`),
  manifest writing, and parity-fixture extraction move alongside as exported
  library functions (they are already largely factored; the CLI just calls them).

`sittir gen` becomes a `CommandModule` that parses flags via mixins and calls
these library entries. The `SITTIR_INTERNAL_CODEGEN_RUN` env guard semantics
are preserved.

## `sittir validate` — regen + staleness preserved (correctness, not packaging)

`scripts/run-validate.sh` today regenerates all three grammars *before*
validating, specifically so that `--backend native` counts are true-native
(see `project_native_build_and_staleness`). This is correctness behavior, not
packaging, and must be preserved:

- `sittir validate counts --backend native` keeps the auto-regen (by calling
  the extracted `runFullRegen()`) **and** the `warnIfNativeBinaryStale` guard.
- The bash wrapper `scripts/run-validate.sh` is replaced by this in-CLI
  chaining and deleted.
- Root npm scripts (`validate`, `validate:native`, `validate:js`,
  `validate:all`, `validate:probe-factory:*`, `validate:history`) repoint to
  `sittir validate …`.

## `sittir tool` — convert all 23 onto the framework

Each tool's ad-hoc argv loop becomes a `CommandModule` using the shared mixins
and resolvers. Where a tool currently thin-delegates to a
`codegen/src/scripts/*.ts` implementation, that delegation is preserved — only
the **arg-parsing layer** changes; the underlying logic is untouched.

**Execution strategy.** The 23 rewrites are mechanical and independent. They
are farmed out to **Copilot CLI subagents** (which have read-write LSP access)
in batches, per `reference_copilot_cli_connect`. Each converted tool is gated
on producing identical output to its pre-conversion behavior for representative
invocations before the batch is accepted.

## Migration (hard cutover, atomic PR)

The three old `cli.ts` files are **deleted**. Every caller is updated in the
same PR so the change lands atomically:

- **npm scripts** in root `package.json`.
- **`scripts/run-validate.sh`** — folded into `sittir validate` and deleted.
- **Agent docs** — `.claude/agents/sittir-codegen.md`,
  `.github/agents/*.agent.md`. The embedded commands are **executable
  contracts** the subagents run; the exact command strings must be updated, not
  just the prose.
- **`CLAUDE.md`** quick-reference block.
- **Tests** — `packages/validator/tests/cli.test.ts` and the codegen CLI test
  seams (`runGrammarDiagnosticsPreflight` and other exported helpers imported
  by tests) are repointed/migrated to the new library + CLI entries. The
  `_isMain`-guarded exports that tests rely on move with their logic.

## New doc: CLI command glossary

`docs/cli-command-glossary.md` — a comprehensive per-command reference covering
every `gen` / `validate` / `tool` command (purpose, flags, one example each),
mirroring the structure and depth of `docs/compiler-phase-glossary.md`.
`CLAUDE.md` links to it from the Quick Reference section.

Where feasible, the glossary is generated or consistency-checked from the
commander program tree (command names, descriptions, options) so it cannot rot
relative to the actual CLI surface.

## Phasing (one spec, phased plan)

1. **Framework + skeleton.** `@sittir/cli` package, `CommandModule` interface,
   option mixins, shared resolvers. `gen` (with the codegen-library extraction)
   and `validate` (validator commands moved in, regen+staleness preserved).
2. **Tools conversion.** All 23 tools rewritten onto the framework, parallelized
   via Copilot CLI subagents, each gated on output parity.
3. **Cutover.** Rewire all callers (npm scripts, run-validate.sh, agent docs,
   CLAUDE.md), migrate tests, delete the three old entry points, write the CLI
   command glossary.

## Alternatives considered

- **Topology:** shared `@sittir/cli-kit` library with three retained entries;
  or promote the validator's commander program as the root. Rejected — a single
  new top-of-stack package gives one surface and respects the dependency
  direction without a shared-lib indirection or a forced package move.
- **Command layout:** flat top-level commands; or grouped + flat aliases.
  Rejected — grouping gives `--help` discoverability and clear ownership without
  maintaining an alias map.
- **Abstraction:** an abstract `SittirCommand` class hierarchy
  (`CodegenCommand`/`ValidatorCommand`/`ToolCommand`). Rejected — ceremony for
  ~23 thin commands; commander already provides the tree, so a light interface
  + option mixins is sufficient.
- **Tools treatment:** passthrough-first with incremental conversion; or
  passthrough permanently. Rejected — full consistency is the stated goal, and
  the rewrites are mechanical enough to parallelize now.

## Risks / open items

- **Atomicity vs. size.** The cutover touches many files (scripts, agents,
  docs, tests). Phase 3 must land as one PR; phases 1–2 can be staged but the
  old entry points cannot be deleted until all callers are repointed.
- **Tool output parity.** Each tool conversion must be verified against its
  pre-conversion output; subtle argv-handling differences (e.g. positional vs.
  flag, default modes like `list-kinds`'s implicit `--groups`) are the main
  regression risk.
- **Glossary generation.** Auto-generating the glossary from the commander tree
  is preferred but optional; a hand-written glossary checked in CI against the
  command list is an acceptable fallback.
