# Project workflow

[Development](../DEVELOPMENT.md) owns the command reference. This file describes how to choose and report the work.

## Verification

- Establish the base revision and relevant baseline before a behavior change.
- Run focused checks from the repository root. Do not run tests while generation is rewriting their inputs.
- For a compiler refactor, prove unchanged generated output. For a behavior change, name the intended movement and investigate anything else.
- Compare corpus counts per grammar, including their denominators and AST matches. Preserve the validation universe.
- Report checks that actually ran, their result, and unresolved failures. A build is not a corpus round-trip result.
- Before merging, verify the current target/head and the checks applicable to that exact result. Preserve dirty or active worktrees.

## Diagnostics

Use the unified CLI before creating another probe. Useful entry points include:

| Question | Tool |
| --- | --- |
| Parse/read/render/reparse one case | `tool probe-kind` |
| Inspect a kind through compiler phases | `tool probe-stages` |
| Identify failing kinds or AST mismatches | `tool diff-failures`, `tool dump-ast-mismatches` |
| Inspect grammar diagnostics or phantom kinds | `tool grammar-diagnostics`, `tool phantom-kinds` |
| Compare validator runs | `validate history` |

Run a command's `--help` for its actual flags. The [CLI reference](../docs/cli-command-glossary.md) is generated from the command tree.

Diagnostic implementations live in `packages/tools`; CLI modules live in `packages/cli/src/commands/`. Follow the existing command modules and option helpers rather than adding an independent command parser or a dependency from codegen back to tools.

## Plans and branches

Active designs and plans live under `docs/superpowers/specs/` and `docs/superpowers/plans/`. Read the document named by the task; the newest filename is not automatically its authority. Distinguish a design's intended contract from the implementation on the base revision.

Use a descriptive branch name; Codex-created branches use `codex/`. Do not impose historical numbered-feature conventions on new work.
