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
	grammarDiagnostics: '../../codegen/src/compiler/grammar-diagnostics.ts',
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
	grammarDiagnostics: typeof import('../../codegen/src/compiler/grammar-diagnostics.ts');
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
export async function invoke<
	M extends keyof CodegenSurface,
	F extends FunctionKeys<CodegenSurface[M]> & string,
>(
	module: M,
	method: F,
	...args: Parameters<Extract<CodegenSurface[M][F], AnyFn>>
): Promise<Awaited<ReturnType<Extract<CodegenSurface[M][F], AnyFn>>>> {
	// Single boundary cast: a variable-specifier dynamic import is untyped, and
	// the public signature above is what enforces correctness at every call site.
	const mod = (await import(MODULES[module])) as Record<string, unknown>;
	const fn = mod[method] as (...a: readonly unknown[]) => unknown;
	return fn(...(args as readonly unknown[])) as Awaited<ReturnType<Extract<CodegenSurface[M][F], AnyFn>>>;
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
export type OptimizedGrammar = ReturnType<CodegenSurface['normalize']['normalizeGrammar']>;
export type AssembledNodeMap = ReturnType<CodegenSurface['assemble']['assemble']>;
export type GrammarDiagnostic = import('../../codegen/src/compiler/grammar-diagnostics.ts').GrammarDiagnostic;

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

/** Run evaluate → link → normalize → assemble for one grammar, returning its NodeMap. */
export async function buildNodeMap(grammar: string): Promise<AssembledNodeMap> {
	const entryPath = await resolveEntryPath(grammar);
	const raw = await invoke('evaluate', 'evaluate', entryPath);
	const linked = await invoke('link', 'link', raw);
	const normalized = await invoke('normalize', 'normalizeGrammar', linked);
	return invoke('assemble', 'assemble', normalized);
}
