# Validation and Project Workflow

Use this file for routine validation, branch/spec conventions, and repo-level workflow checks.

## Validation commands

Full dev-command reference: [DEVELOPMENT.md](../DEVELOPMENT.md). Routine checks:

- `pnpm test`
- `pnpm type-check`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build` when the task changes emitted/runtime code broadly enough to justify a full rebuild

Workspace packages use `tsc` under their local `type-check`/`build` scripts; the root `pnpm type-check` and `pnpm build` commands fan out across the workspace. `pnpm run validate:native` (regen all three grammars + `sittir validate counts`) is the primary gate for codegen-affecting work; `sittir validate history [n]` compares runs objectively.

## Diagnostic tools (`@sittir/tools`)

Developer diagnostics live behind the unified `sittir` CLI (`@sittir/cli`). Prefer these over ad-hoc scripts. Invoke as `pnpm exec tsx packages/cli/src/cli.ts tool <tool> [flags]`. Run with `--help` for the full list. Highlights:

- `diff-failures` — per-kind validator failure listing
- `dump-ast-mismatches` — read-render-parse AST gap diagnostic with `--mode diff`, `--cluster` (bug-class histogram), `--filter`, `--all-grammars`, `--format json`
- `probe-kind` — parse → read → render → reparse trace for a single source string
- `probe-stages` — rule shape at every compiler phase (wire/evaluate/link/normalize/assemble)
- `probe-parity` — template coverage for one kind
- `profile` — unified failure aggregation across validators
- `check-baseline` / `check-perf` / `check-jinja` — regression gates and invariant checks
- `propose-14` — signature-conformance ratchet: per-module classification table (`--table`), committed-baseline regression gate (`--update` to lower the baseline in a sweep PR)
- `list-kinds`, `classify`, `phantom-kinds`, `field-provenance`, `grammar-diagnostics`, `assemble-shape-census` (per-modelType histogram of the rule shape each `Assembled*` constructor receives) — discovery tools
- `inspect-type`, `inspect-refs`, `compare-overrides` — inspection tools
- `walk`, `exercise` — round-trip exercise harnesses

Timing tools (`bench`, `bench-storage`, `trivia-timing`, and `check-baseline --collect --metrics`) measure built code: run `pnpm build`, then `node packages/cli/dist/cli.js tool <tool> [flags]`. Under tsx (which forces esbuild's `keepNames`) or against a build older than its sources, they refuse to run.

Validator entry points live under `sittir validate` (not `tool`): `validate counts` — per-grammar validator pass/total (rrp / shallow / factory-rp + AST match); `validate history [n]` — objective before/after comparison of recorded runs; `validate probe-factory`; `validate trace-rt`.

When adding a new diagnostic, implement it as `export async function run(opts: <Name>Options)` in `packages/tools/src/<category>/<name>.ts`, re-export it from `packages/tools/src/index.ts` (`export { run as <camelName>, type <Name>Options }`), add a `CommandModule` in `packages/cli/src/commands/tool/<name>.ts` (using the option mixins from `packages/cli/src/framework/options.ts`), and register it in the `toolModules` array in `packages/cli/src/commands/tool/index.ts`. A tool that times work calls `measureBuilt(<name>)` (`packages/tools/src/built.ts`) before it measures.

## Specs and branches

- Specs and plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/` as dated documents (`YYYY-MM-DD-<slug>.md`). The historical `specs/NNN-feature-name/` tree no longer exists.
- **The plan file on master is the tracker.** A task's PR ticks that task's steps (`- [x]`) and adds a line under its heading: `**Status:** merged as #N (<merge sha>), <date>.` A parked, superseded or reworked task says so in its own status line. The superpowers ledger (`.superpowers/sdd/<plan>/progress.md`, git-ignored) holds in-progress detail only, and nothing in it is the record.
- **Spec amendments and the maintainer's rulings go to master directly,** in the spec's Decided section and the plan task, quoting the ruling, in their own docs commit. They never ride a code branch. Fix every other spec or plan that builds on an overturned shape in the same commit.
- Feature branches use short kebab-case names (older branches carry the historical `NNN-short-name` form).

## Conventions for messages, PR bodies and docs

- **A task number names its plan:** "arena plan Task 6", "file I/O plan Task 3", never a bare "Task 6". Several plans run at once, each with its own numbering.
- **"Parse" is a verb.** Write "the parsed tree", "the tree's data" or "the read call", never "a parse" as a thing.
- **A PR body's first line is `Owner: <session>`,** the session that fixes what its checks and reviews find.
- **Follow-ups are issues,** one per item, labeled with a type and an area. A PR body links them and doesn't carry them.
- **Bookkeeping** (plan status lines, the queue, CI watching, after-merge cleanup) belongs to sittir-maint: [maint-responsibilities.md](maint-responsibilities.md).

## Quality gate context

`.claude/hooks/quality-gate.sh` is the repo hook path for the stop-hook checks referenced by the project instructions. The key enforced ideas are:

- fix the generator, not generated output
- no type-escape-hatch workaround fixes
- wave-style decomposition for long narrated TS functions
