/**
 * codegen-surface — the single coupling point between `@sittir/tools` and
 * `@sittir/codegen`'s internals.
 *
 * Tools (the discover/inspect diagnostics, and the validators relocated in R9)
 * need to invoke codegen phases/loaders and reference codegen's types — WITHOUT
 * codegen exposing those internals as public API and WITHOUT a static
 * `codegen → tools` package cycle. This module gives both, with codegen
 * unchanged:
 *
 *   - Runtime: `invoke(module, method, ...args)` dynamically imports the codegen
 *     module and calls the export. A dynamic `import()` is the allowed
 *     `tools → codegen` direction resolved lazily, so it creates no static
 *     package edge.
 *   - Types: the `CodegenSurface` map is built from `typeof import('…')` queries,
 *     which give `invoke` the REAL codegen signatures (args checked, return
 *     inferred); the `import('…').T` aliases below surface codegen's REAL shapes.
 *     Both forms are fully runtime-erased, so they add no runtime dependency.
 *
 * The brittleness is the set of internal relative paths — `import()` requires
 * string literals, so the paths live in two lockstep places (the `MODULES`
 * runtime map and the `CodegenSurface` type). Both are CENTRALIZED here, so a
 * codegen file move is a one-file fix rather than a scattered break.
 *
 * Supersedes the hand-cast `loadCodegen` in `discover/pipeline.ts` and the
 * duplicated `loadCodegenModules` helpers in `inspect/`.
 */

import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Runtime module map — the ONLY place tools spells out codegen file paths.
// Relative paths (not `@sittir/codegen/...` subpaths) so no package export is
// required. Keep in lockstep with the `CodegenSurface` literals below.
// ---------------------------------------------------------------------------
const MODULES = {
	evaluate: '../../codegen/src/compiler/evaluate.ts',
	link: '../../codegen/src/compiler/link.ts',
	normalize: '../../codegen/src/compiler/normalize.ts',
	assemble: '../../codegen/src/compiler/assemble.ts',
	resolveGrammar: '../../codegen/src/compiler/resolve-grammar.ts',
	grammarDiagnostics: '../../codegen/src/compiler/diagnostics/grammar-diagnostics.ts',
	opaqueFacts: '../../codegen/src/compiler/opaque-facts.ts',
	nodeTypesLoader: '../../codegen/src/validate/node-types-loader.ts',
	nativeBinaryFreshness: '../../codegen/src/scripts/native-binary-freshness.ts',
	renderModulePaths: '../../codegen/src/emitters/render-module-paths.ts',
	engineLoader: '../../codegen/src/engine-loader.ts',
	modelNodeMap: '../../codegen/src/compiler/model/node-map.ts',
	generatedManifest: '../../codegen/src/scripts/generated-manifest.ts',
	suggested: '../../codegen/src/emitters/suggested.ts',
	variantStructural: '../../codegen/src/compiler/variant-structural.ts'
} as const;

// ---------------------------------------------------------------------------
// Typed surface — `typeof import()` queries give `invoke` the REAL codegen
// signatures. Runtime-erased. The import() path literals MUST match `MODULES`.
// ---------------------------------------------------------------------------
export interface CodegenSurface {
	evaluate: typeof import('../../codegen/src/compiler/evaluate.ts');
	link: typeof import('../../codegen/src/compiler/link.ts');
	normalize: typeof import('../../codegen/src/compiler/normalize.ts');
	assemble: typeof import('../../codegen/src/compiler/assemble.ts');
	resolveGrammar: typeof import('../../codegen/src/compiler/resolve-grammar.ts');
	grammarDiagnostics: typeof import('../../codegen/src/compiler/diagnostics/grammar-diagnostics.ts');
	opaqueFacts: typeof import('../../codegen/src/compiler/opaque-facts.ts');
	nodeTypesLoader: typeof import('../../codegen/src/validate/node-types-loader.ts');
	nativeBinaryFreshness: typeof import('../../codegen/src/scripts/native-binary-freshness.ts');
	renderModulePaths: typeof import('../../codegen/src/emitters/render-module-paths.ts');
	engineLoader: typeof import('../../codegen/src/engine-loader.ts');
	modelNodeMap: typeof import('../../codegen/src/compiler/model/node-map.ts');
	generatedManifest: typeof import('../../codegen/src/scripts/generated-manifest.ts');
	suggested: typeof import('../../codegen/src/emitters/suggested.ts');
	variantStructural: typeof import('../../codegen/src/compiler/variant-structural.ts');
}

type AnyFn = (...args: never[]) => unknown;
/** Keys of `T` whose value is callable — so `invoke`'s `method` only offers functions. */
type FunctionKeys<T> = { [K in keyof T]-?: NonNullable<T[K]> extends AnyFn ? K : never }[keyof T];

/**
 * Invoke a codegen phase/method by name. Fully typed: `module` and `method`
 * autocomplete, `args` are checked against — and the result is inferred from —
 * the real codegen signature (`Awaited` since the import resolves lazily). The
 * dynamic `import()` keeps this the allowed `tools → codegen` direction with no
 * static package edge.
 */
/**
 * Resolve a `MODULES` path to an absolute file URL anchored at THIS module, so
 * the variable-specifier dynamic import resolves identically under tsx
 * (production) and vitest (tests). A bare relative specifier resolves correctly
 * under tsx but mis-resolves under vitest's transform (it drops the package
 * prefix → `/codegen/...`), so anchoring to `import.meta.url` is required.
 */
function moduleUrl(module: keyof typeof MODULES): string {
	return new URL(MODULES[module], import.meta.url).href;
}

export async function invoke<M extends keyof CodegenSurface, F extends FunctionKeys<CodegenSurface[M]> & string>(
	module: M,
	method: F,
	...args: Parameters<Extract<CodegenSurface[M][F], AnyFn>>
): Promise<Awaited<ReturnType<Extract<CodegenSurface[M][F], AnyFn>>>> {
	// Single boundary cast: a variable-specifier dynamic import is untyped, and
	// the public signature above is what enforces correctness at every call site.
	const mod = (await import(moduleUrl(module))) as Record<string, unknown>;
	const fn = mod[method] as (...a: readonly unknown[]) => unknown;
	return fn(...(args as readonly unknown[])) as Awaited<ReturnType<Extract<CodegenSurface[M][F], AnyFn>>>;
}

/**
 * Load a whole codegen module, fully typed. Use when a consumer needs SEVERAL
 * exports from one module — destructure once and call synchronously — where a
 * per-call `invoke` would force gratuitous `await`s (e.g. `opaqueFacts`/`readFacts`
 * called inline throughout `nodeToConfig`). `invoke` is for one-offs; `load` is
 * for "give me this module". Same lazy dynamic import (the allowed `tools→codegen`
 * direction), and the result is the module's REAL type — no cast at the call site.
 */
export async function load<M extends keyof CodegenSurface>(module: M): Promise<CodegenSurface[M]> {
	return (await import(moduleUrl(module))) as CodegenSurface[M];
}

// ---------------------------------------------------------------------------
// Type aliases — codegen's REAL shapes, surfaced for consumers without codegen
// exporting anything. `import().T` is runtime-erased. Stage types are derived
// from the phase signatures so they can never drift from the real pipeline.
// ---------------------------------------------------------------------------
export type NodeMap = import('../../codegen/src/compiler/types.ts').NodeMap;
export type AssembledNode = import('../../codegen/src/compiler/model/node-map.ts').AssembledNode;
export type RawGrammar = Awaited<ReturnType<CodegenSurface['evaluate']['evaluate']>>;
export type LinkedGrammar = ReturnType<CodegenSurface['link']['link']>;
export type SimplifiedGrammar = ReturnType<CodegenSurface['normalize']['normalizeGrammar']>;
export type AssembledNodeMap = ReturnType<CodegenSurface['assemble']['assemble']>;
export type GrammarDiagnostic =
	import('../../codegen/src/compiler/diagnostics/grammar-diagnostics.ts').GrammarDiagnostic;
export type PolymorphVariantDescriptor = import('../../codegen/src/polymorph-variant.ts').PolymorphVariantDescriptor;
export type PolymorphVariantMap = import('../../codegen/src/polymorph-variant.ts').PolymorphVariantMap;
export type FactoryShape = import('../../codegen/src/emitters/factory-map.ts').FactoryShape;
export type FactorySlotMeta = import('../../codegen/src/emitters/factory-map.ts').FactorySlotMeta;
export type RawNodeEntry = import('../../codegen/src/validate/node-types-loader.ts').RawNodeEntry;
export type OpaqueFacts = import('../../codegen/src/compiler/opaque-facts.ts').OpaqueFacts;
export type RoundTripDiagnostic = import('../../codegen/src/emitters/suggested.ts').RoundTripDiagnostic;

// ---------------------------------------------------------------------------
// Convenience: the canonical evaluate → link → normalize → assemble walk.
// (Generalizes the former `discover/pipeline.ts` `buildNodeMap`.)
// ---------------------------------------------------------------------------

/** Resolve a grammar's entry path, preferring `overrides.ts` over `grammar.js`. */
export async function resolveEntryPath(grammar: string): Promise<string> {
	const overrides = await invoke('resolveGrammar', 'resolveOverridesPath', grammar);
	const grammarJs = await invoke('resolveGrammar', 'resolveGrammarJsPath', grammar);
	return existsSync(overrides) ? overrides : grammarJs;
}

/** Run evaluate → link → normalize for one grammar, returning its SimplifiedGrammar. */
export async function buildSimplifiedGrammar(grammar: string): Promise<SimplifiedGrammar> {
	const entryPath = await resolveEntryPath(grammar);
	const raw = await invoke('evaluate', 'evaluate', entryPath);
	const linked = await invoke('link', 'link', raw);
	return invoke('normalize', 'normalizeGrammar', linked);
}

/** Run evaluate → link → normalize → assemble for one grammar, returning its NodeMap. */
export async function buildNodeMap(grammar: string): Promise<AssembledNodeMap> {
	const normalized = await buildSimplifiedGrammar(grammar);
	// `assemble()` takes the caller-owned AssembleCtx (§2: the grammar container
	// folds into the ctx) — `load` (not `invoke`) because we need BOTH `assemble`
	// and `AssembleCtx` from the module, matching the pattern in
	// tools/src/probe/variant-derivation.ts.
	const { assemble, AssembleCtx } = await load('assemble');
	return assemble(AssembleCtx.from(normalized));
}
