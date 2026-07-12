// @sittir/legacy-core — JS backend runtime implementation
// All type definitions live in @sittir/types.
//
// Renamed from @sittir/core to @sittir/legacy-core so the deprecated-as-
// production status is a structural fact of the package name/path, not
// just a comment — a broad text/spec search for "createRenderer" or
// "@sittir/core" can otherwise surface historical migration-plan docs and
// give the false impression this is still the live render engine. It is
// not: generated `createEngine()` (see packages/{rust,typescript,python}/
// src/engine.ts) has been native-only since the JS-engine-fallback removal
// (Task 17, PR #144) and throws "no JS-engine fallback" rather than ever
// routing here. This package is NOT orphaned, though: `createRenderer`
// (loader.ts) is still the live, intentionally-kept JS/Nunjucks renderer
// behind `tool bench`'s native-vs-JS comparison, `tool probe-kind --engine
// js`, `tool walk --render`, and the corpus validators' `backend: 'js'`
// mode (packages/tools/src/validate/*) — confirmed live diagnostic/
// validator tooling, not debt, per Task 18 (PR #144). Do not delete this
// package or route new production code through it; do keep it working for
// the validator/diagnostic callers above.

export { resolveEngineFormat } from './engine.ts';
export { createRenderer } from './loader.ts';
export { createRendererFromConfig } from './render.ts';
export type { BoundRenderer, RulesConfig } from './render.ts';
export { validateFull } from './validate.ts';
