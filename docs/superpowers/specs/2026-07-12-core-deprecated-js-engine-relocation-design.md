# Relocate @sittir/core's JS-engine internals into a `deprecated-js-engine/` subdirectory

## Goal

Make `@sittir/core`'s deprecated-as-production status physically unmissable in the file tree, not just documented in a comment — so agents (and humans) stop mis-asserting that the JS/Nunjucks engine is live in production.

## Background

`packages/core/src/index.ts` already carries an accurate `@deprecated` doc comment (added earlier this session): native `createEngine()` has been production-only since PR #144's JS-fallback removal, and `@sittir/core`'s `createRenderer` survives only as intentionally-kept diagnostic/validator tooling (`tool bench`, `tool probe-kind --engine js`, `tool walk --render`, corpus validators' `backend: 'js'` mode).

Despite that comment sitting in the exact file a careful check would land on, a research subagent this session still asserted the JS engine was live in production — because it searched broadly (spec docs, historical migration plans) rather than reading the actual call sites, and nothing in the file *tree* signaled "this is deprecated" independent of reading prose. Docs alone already failed once; this spec makes the deprecated status a structural fact instead.

## Scope

Move the JS-engine implementation files from `packages/core/src/` into `packages/core/src/deprecated-js-engine/`:

`render.ts`, `loader.ts`, `validate.ts`, `cst.ts`, `edit.ts`, `format.ts`, `metrics.ts`, `native-boundary.ts`, `native-read.ts`, `nodeData.ts`, `readNode.ts`, `types.ts`

Stay at the top level (unchanged):
- `index.ts` — the public barrel. Its internal `from './loader.ts'` etc. imports get repointed to `./deprecated-js-engine/loader.ts` etc.; its existing `@deprecated` doc comment is kept as-is.
- `engine.ts`, `engine-boundary.ts` — thin re-exports of the shared `SittirEngineLike` family from `@sittir/common/engine`, plus one small JS-engine-specific helper (`resolveEngineFormat`). These aren't JS-engine-specific implementation, just a boundary shim; no reason to move them.

## Why this scope, not a full package rename

`@sittir/core`'s `package.json` `exports` field only publishes two subpaths: `.` (→ `index.ts`) and `./engine` (→ `engine-boundary.ts`). No consumer anywhere in the real source tree (verified via search) deep-imports `render.ts`/`loader.ts` directly — they all go through the barrel. So this move touches zero consumer-facing import specifiers; it's purely internal reorganization within the package, which is why a full package rename (`@sittir/core` → something else, cascading through every dependent `package.json` + import site) isn't needed to get the same signaling benefit.

## Mechanism

Use `lsproxy` (this repo's established convention for moves/renames — see `.claude/skills/lsproxy-cli`) to perform the actual file moves, so internal import statements across the moved files update automatically rather than via manual `Edit`. Sequence:
1. `lsproxy` move each of the 12 files from `packages/core/src/<file>.ts` to `packages/core/src/deprecated-js-engine/<file>.ts`, one at a time (or batched if lsproxy supports multi-file move), always with `--dry-run` first to preview.
2. Manually verify/repoint `index.ts`'s `from './loader.ts'` / `from './render.ts'` / `from './validate.ts'` imports to the new subpath (lsproxy's import-rewriting should already handle files that import *into* the moved files, but the barrel's re-export lines are worth a direct check).
3. Full rebuild + type-check of `packages/core` and every consumer package.
4. `pnpm test` for the affected packages (core, tools — the diagnostic tooling that still calls `createRenderer`).
5. `SITTIR_NATIVE_DEBUG=0 pnpm run validate:native` — confirm the rust=117/typescript=75/python=102 floor holds (this move touches zero production behavior, so it must hold exactly).

## Non-goals

- Not deleting any code — everything keeps working exactly as before, just relocated.
- Not renaming the `@sittir/core` package or changing its public API surface.
- Not touching `engine.ts`/`engine-boundary.ts` (shared boundary types, not JS-engine-specific).
- Not addressing TODO.md item 5 (actually removing the JS engine) — that's separate, deliberately deferred work.

## Testing

- Type-check clean across `packages/core` and all consumers (tools, rust/typescript/python packages that import `@sittir/core`).
- `pnpm test` green for `packages/core` and `packages/tools` (diagnostic tooling exercises `createRenderer`).
- `validate:native` floor unchanged (rust=117/typescript=75/python=102) — this is a pure file-move, zero behavior change expected.
