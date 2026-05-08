# Validation and Project Workflow

Use this file for routine validation, branch/spec conventions, and repo-level workflow checks.

## Validation commands

- `pnpm test`
- `pnpm type-check`
- `pnpm lint`
- `pnpm format:check`
- `pnpm build` when the task changes emitted/runtime code broadly enough to justify a full rebuild

Workspace packages use `tsgo` under their local `type-check`/`build` scripts; the root `pnpm type-check` and `pnpm build` commands fan out across the workspace.

## Specs and branches

- Specs, plans, and tasks live under `specs/NNN-feature-name/`.
- Feature branches use `NNN-short-name`.

## Quality gate context

`.claude/hooks/quality-gate.sh` is the repo hook path for the stop-hook checks referenced by the project instructions. The key enforced ideas are:

- fix the generator, not generated output
- no type-escape-hatch workaround fixes
- wave-style decomposition for long narrated TS functions

## Native/backend onboarding

For native render/backend onboarding, start with:

- `specs/012-rust-core-port/quickstart.md`
