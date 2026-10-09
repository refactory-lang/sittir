# Development

Contributor workflow for the sittir monorepo. This file is the single
source for dev commands; other docs link here instead of restating them.

## Setup

Prerequisites: Node 20+, [pnpm](https://pnpm.io), and a Rust toolchain
(the native render engines are N-API crates built with `napi`).

```bash
pnpm run setup
```

`setup` installs dependencies, installs the tracked git hooks from
`.githooks/` (the generated-output pre-commit gate, and a post-checkout hook), and
builds every grammar's native binding. Git never copies hooks into a clone, so
a fresh clone runs it once by hand; after that, every new worktree sets
itself up on checkout when its commit is already on a local or origin branch. A
worktree of anything else, such as a fork's pull request, skips it until you
have reviewed the code and run `pnpm run setup` yourself. Set
`SITTIR_NO_SETUP=1` to skip it for a throwaway checkout, and re-run
`pnpm run setup` by hand after pulling a lockfile or native crate change.
An existing hook sittir does not manage is kept as `<name>.pre-sittir`.

`pnpm exec tsx packages/cli/src/cli.ts tool sync-base [--base origin/master]` brings a branch up to date with its base: it merges, and when the only conflicts are generated files it takes the base's side; after any merge it verifies every grammar and regenerates the grammars whose files conflicted or went stale, then commits the merge. Any other conflict, or a regeneration that changes a file outside the generated roots, stops it for review.

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

## Documentation gates

Two acceptance tests keep the documentation honest, and both run under `pnpm test`:

- `tests/acceptance/examples-run.test.ts` calls every function the compile-checked `examples/` export and renders every node they return. A function that takes an argument needs a sample input in that test.
- `tests/acceptance/readme-snippets.test.ts` runs and type-checks every `ts` snippet in the root README and the four package READMEs. A statement `expr; // "text"` (or `// true`, `// false`) is asserted to equal that value. A snippet that shows a shape rather than a program is marked with `<!-- snippet: illustrative -->` on the line above its fence and is skipped; nothing else is.

The snippet type-check resolves `@sittir/*` through `node_modules`, so a git worktree needs its own `pnpm install`. A `node_modules` symlinked to another checkout resolves the packages to that checkout's sources and reports unrelated type errors.

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

### The local generated-output check

Validators, probes and the pre-commit hook refuse to run on generated files
that did not come from the current source. Nothing about this is committed.
`gen` records what it produced in
`node_modules/.cache/sittir/generated-manifest/<grammar>.json`: a hash per
generated file and the last eight (source, output) pairs it has seen. The
check passes when the tree is one of those pairs, or when its source inputs
and generated files equal HEAD (or, during a merge, the commit being merged;
both must equal the same one). So a fresh clone, a branch switch, and a merge
of a base that regenerated all pass without regenerating. Editing codegen
source, a grammar, or a generated file by hand does not, until you regenerate.

The file is per worktree and survives `pnpm install`. Deleting it, or
`node_modules`, loses nothing: the tree is compared with HEAD instead.

### The CI drift check

The `generated output drift` job regenerates every grammar and fails when the
tree differs from the commit: a changed generated file, or an untracked one.
So a pull request that changes codegen source or a grammar must commit its
regenerated output. Regeneration is deterministic across platforms, so output
generated on macOS matches the Linux runner.

The job runs on pull requests against the merge result, and on master after
each merge. Two pull requests that each change generated output can merge
cleanly and still leave master stale for the combined source; the master run
catches that. A red master run is fixed by a pull request that regenerates.
CI never commits.

## Validation

```bash
pnpm run validate:native      # regen all grammars + native validator counts
pnpm run validate:history     # compare recorded validation runs (objective before/after)
cargo test --workspace --no-default-features   # every crate's tests, grammar crates included
```

`cargo test -p sittir-core` alone misses the grammar crates' own tests
(`rust/crates/sittir-<lang>/tests/`), which build against the generated
transports; `--no-default-features` is what lets their test binaries link
without a Node runtime.

`validate:native` is the primary gate for codegen-affecting work. For
corpus-affecting changes report raw per-grammar counts (from, cov,
read-render-parse and its shallow run, factory-storage, ir-storage,
built-render-parse; `pnpm run validate:history` prints them), compared
against a recorded baseline — not eyeballed.

Two committed ratchets back the run (both only ever tighten):

- `packages/tools/baselines/native.json` — exact per-grammar validator
  floors (pass counts, AST-match counts, parity fixtures, per-validator
  `failingKinds` = the documented exclusions). Refresh with
  `sittir tool check-baseline --collect --backend native`; CI diffs a fresh
  head collection against the base commit's copy via
  `sittir tool check-baseline --base <base.json> --head <head.json>`.
- `packages/tools/sclass-ceilings.json` — per-grammar ceilings on
  round-trip-fidelity S-class counts in `validation-report.json`. Every
  `validate counts` run fails when a class exceeds its ceiling (new debt in
  a tracked source class); a class absent from the file has ceiling 0, so
  cleared classes stay cleared. When a run reports a class below its
  ceiling, lower the ceiling in the same commit.
- `packages/tools/validation-report.json` — the report the committed
  ceilings are checked against (a unit test pins the committed pair).
  Commit it, as `validate` wrote it, in the same commit as any change to
  `sclass-ceilings.json` or to the validated rows; otherwise leave it out,
  since every run rewrites it.

## Native engine build

Each grammar's render engine is a Rust N-API crate under
`rust/crates/sittir-<lang>/` (shared core in `rust/crates/sittir-core/`).

```bash
cd rust/crates/sittir-rust
pnpm run build                # release binding, written into packages/rust/native
pnpm run build:debug          # debug binding (dev only)
```

Both go through `scripts/build-native.mts <lang>`, which writes the loader
(`index.cjs`), its typings (`index.d.ts`) and the host's `.node` into
`packages/<lang>/native/` — the directory the grammar package ships. The loader
and typings are committed; the binaries are git-ignored.

Prefer release builds when running the validators; the validation load is
sized for the optimized binding.

Rebuild natives through `pnpm exec tsx packages/cli/src/cli.ts gen --grammar
<lang> --all --output packages/<lang>/src` (or `pnpm run validate:native`), not
by running cargo and copying the dylib: only the `napi build` step regenerates
`packages/<lang>/native/index.d.ts`, so a hand-copied binary leaves it stale.
The workspace `[profile.release] strip = "none"` keeps the binding loadable on
macOS (see the comment in `Cargo.toml`).

### Published shape

A grammar package ships its native binaries inside itself (`files` lists
`native`), so a consumer installs one package per grammar. Check what would be
published with:

```bash
pnpm run build
pnpm run check:published                 # pack, install outside the workspace, createEngine + parse + render
pnpm run check:published --release       # also require a binary for every declared target
```

The default run accepts a pack holding only the host's binary; `--release`
fails unless every target in `NATIVE_TARGETS`
(`packages/codegen/src/grammars.ts`) has one.

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
- [docs/compiler-phase-glossary.md](docs/compiler-phase-glossary.md) — codegen glossary: DSL layer, dual-pipeline model, phase narrative, function-glossary index
