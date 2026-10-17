# Codegen Format Stability Design

## Problem

The current codegen workflow produces broad incidental diffs after routine `pnpm format` and `pnpm lint` runs. The biggest churn comes from generated TypeScript and generated artifacts that do not represent hand-authored source code:

- some emitters produce layout and quoting patterns that `oxfmt` rewrites aggressively
- repo-wide `oxfmt .` and `oxlint .` sweep generated tests, snapshots, baselines, and other volatile outputs
- the result is large review noise that obscures semantic changes and makes it harder to keep regeneration diffs surgical

This is a tooling-boundary problem, not a renderer or runtime-correctness problem.

## Decision

Adopt a hybrid fix:

1. stabilize emitted TypeScript in the highest-churn emitters so generated TS is already close to the repo formatter's preferred shape
2. narrow default formatter and linter coverage so routine repo-wide passes stop rewriting volatile generated artifacts that do not benefit from being treated as hand-authored source
3. keep codegen as the single source of truth; never hand-edit generated outputs to compensate for formatting churn

## Goals

1. Reduce quote-only and layout-only churn in generated TypeScript after regeneration.
2. Keep routine `pnpm format` and `pnpm lint` focused on hand-authored code and intentionally stable generated TS.
3. Prevent high-volume formatter rewrites of generated tests, snapshots, baselines, and `.sittir` artifacts.
4. Preserve existing runtime behavior and generated API semantics.

## Non-Goals

- No renderer behavior changes.
- No grammar or package API redesign.
- No switch away from `oxfmt` or `oxlint`.
- No manual cleanup strategy that relies on editing generated outputs after each regen.
- No attempt to eliminate all generated diffs; real semantic regeneration changes should still appear.

## Current Churn Sources

### Emitter-side instability

Some emitters assemble imports, arrays, objects, and inline placeholder values in shapes that are valid but not stable under `oxfmt`. The formatter then rewrites those files in bulk, even when the semantic generator change is small.

The first implementation targets should be the known churn hot spots:

- `packages/codegen/src/emitters/test.ts`
- `packages/codegen/src/emitters/wrap.ts`
- any small shared emitter helpers those files depend on

### Tooling overreach

The root scripts currently run:

- `oxfmt .`
- `oxlint .`

That scope is too broad for this repository because it treats generated source, generated tests, snapshots, baselines, spec artifacts, and `.sittir` outputs as one uniform formatting surface.

## Proposed Approach

### 1. Stabilize generated TS where it matters most

Adjust the TypeScript emitters so their output is already aligned with repo style:

- prefer single-quote output where emitter-controlled string literals generate code
- avoid manually expanded layouts that `oxfmt` predictably collapses or rewrites
- normalize emitted object and array literals in frequently regenerated files
- keep imports and simple statements in the shape the formatter already prefers

The goal is not to outsmart `oxfmt`. The goal is to stop emitting shapes that invite needless rewrites.

### 2. Split source-like outputs from volatile artifacts

Routine repo scripts should distinguish between:

- **hand-authored code and stable generated TS** that should stay under normal format/lint coverage
- **volatile generated artifacts** that should not be part of the default repo sweep

Volatile generated artifacts include, at minimum:

- generated `tests/nodes.test.ts` fixtures if they continue to produce large formatter churn
- snapshot files
- baseline files
- `.sittir/` generated artifacts
- spec and plan documents that are not part of code-style enforcement

The exact implementation can use scoped CLI globs or ignore files, but the outcome should be the same: default format/lint commands stop touching high-churn non-source artifacts.

### 3. Keep regeneration deterministic

Generation must remain deterministic without relying on a follow-up formatter pass to make files reviewable. A second `pnpm format` run after regeneration should be a no-op or close to it for the targeted generated TS surfaces.

## Script and Boundary Changes

### Format

Replace the current repo-wide format script with a narrower default scope that covers:

- hand-authored workspace TypeScript
- intentionally stable generated TS surfaces that are meant to be checked in as readable source

Do not include volatile generated artifacts in the default formatter sweep.

### Lint

Apply the same narrowing principle to `lint`:

- keep lint focused on files where warnings are actionable
- stop reporting repo-wide warnings from generated artifacts whose structure is codegen-owned

### Generated-output ownership

The generator remains the only place where generated formatting is fixed. If a generated file is noisy, the fix belongs in the emitter or in tooling scope, not in the generated file itself.

## Error Handling and Safety

- Do not introduce silent fallbacks in generation.
- Do not weaken existing validation or boundary checks.
- If a file remains unstable under formatter passes, treat that as a generator-shape issue and fix the emitter rather than excluding increasingly large source surfaces.
- Trim incidental existing formatter churn before implementation so the resulting diff isolates the design change itself.

## Verification Plan

1. Capture the current broad-churn baseline from the existing worktree.
2. Update the selected emitters and root format/lint scopes.
3. Regenerate the touched generated outputs.
4. Run the default format command twice and confirm the second pass is a no-op or near-no-op for targeted generated TS.
5. Run the default lint command and confirm volatile generated artifacts no longer dominate warnings.
6. Run the existing workspace type-check and test suite to confirm no semantic regression.

## Success Criteria

- Small codegen changes no longer explode into large quote/layout-only diffs across generated TS.
- `pnpm format` does not rewrite volatile generated artifacts by default.
- `pnpm lint` no longer spends most of its output budget on generated-artifact warnings.
- Generated runtime code remains semantically unchanged aside from intended formatting-shape cleanup.

## Risks

### Over-excluding files

If formatter and linter scope becomes too narrow, genuinely useful coverage may be lost on generated TS that behaves like checked-in source. The implementation should exclude only the unstable, low-signal artifact classes and keep stable generated source in scope when practical.

### Under-fixing the emitter layer

If the implementation only narrows script scope, codegen churn will still show up whenever targeted generated TS is formatted explicitly. The emitter changes are necessary to make the stable generated TS surfaces hold shape.

## Recommendation

Implement the hybrid fix in this order:

1. trim current incidental formatter churn from the worktree
2. stabilize the highest-churn TS emitters
3. narrow default format/lint scope away from volatile generated artifacts
4. verify regen plus repeated formatter runs stay stable
