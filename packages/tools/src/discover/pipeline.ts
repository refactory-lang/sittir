/**
 * discover/pipeline -- shared codegen-pipeline loader for read-only discover
 * tools (list-kinds, classify, polymorph-census).
 *
 * The compiler stages are loaded via dynamic import rather than a static
 * cross-project import: the tools package and codegen package are separate TS
 * projects, and a static `import { evaluate } from '@sittir/codegen/...'`
 * trips TS6307 (file not in the tools project's file list). Loading at runtime
 * + narrowing to the local `CodegenModules` interface keeps callers fully typed
 * without the project-reference coupling.
 *
 * Single source of truth for the `evaluate -> link -> normalize -> assemble`
 * walk — previously copy-pasted into list-kinds.ts and classify.ts, where the
 * `optimize -> normalizeGrammar` (PR-H) rename left the copies importing a
 * symbol that no longer exists (`mods.optimize is not a function`).
 */

import { existsSync } from 'node:fs';

/** Minimal mirror of the assembled-node surface the discover tools read.
 *  Permissive index signature so consumers can narrow to the fields they
 *  need (`modelType`, `rule`, `forms`, …) without importing the real classes. */
export interface AssembledNode {
	readonly modelType: string;
	readonly [key: string]: unknown;
}

export interface NodeMap {
	readonly nodes: Map<string, AssembledNode>;
}

type PipelineStage = unknown;

export interface CodegenModules {
	evaluate: (path: string) => Promise<PipelineStage>;
	link: (raw: PipelineStage) => PipelineStage;
	/** The post-link normalization stage (formerly `optimize`, renamed
	 *  `normalizeGrammar` in PR-H). */
	normalize: (linked: PipelineStage) => PipelineStage;
	assemble: (normalized: PipelineStage) => NodeMap;
	resolveGrammarJsPath: (grammar: string) => string;
	resolveOverridesPath: (grammar: string) => string;
}

const CODEGEN_PATHS = {
	evaluate: '../../../codegen/src/compiler/evaluate.ts',
	link: '../../../codegen/src/compiler/link.ts',
	normalize: '../../../codegen/src/compiler/normalize.ts',
	assemble: '../../../codegen/src/compiler/assemble.ts',
	resolve: '../../../codegen/src/compiler/resolve-grammar.ts',
} as const;

/** Dynamically load the codegen compiler stages and narrow to CodegenModules. */
export async function loadCodegen(): Promise<CodegenModules> {
	const [evalMod, linkMod, normMod, assembleMod, resolveMod] = await Promise.all([
		import(CODEGEN_PATHS.evaluate),
		import(CODEGEN_PATHS.link),
		import(CODEGEN_PATHS.normalize),
		import(CODEGEN_PATHS.assemble),
		import(CODEGEN_PATHS.resolve),
	]);
	return {
		// cast-at-the-boundary: dynamic import returns untyped modules.
		evaluate: evalMod.evaluate as CodegenModules['evaluate'],
		link: linkMod.link as CodegenModules['link'],
		normalize: normMod.normalizeGrammar as CodegenModules['normalize'],
		assemble: assembleMod.assemble as CodegenModules['assemble'],
		resolveGrammarJsPath: resolveMod.resolveGrammarJsPath as CodegenModules['resolveGrammarJsPath'],
		resolveOverridesPath: resolveMod.resolveOverridesPath as CodegenModules['resolveOverridesPath'],
	};
}

/** Resolve the grammar entry path (overrides.ts preferred over grammar.js). */
function resolveEntryPath(
	grammar: string,
	mods: Pick<CodegenModules, 'resolveGrammarJsPath' | 'resolveOverridesPath'>,
): string {
	const overrides = mods.resolveOverridesPath(grammar);
	return existsSync(overrides) ? overrides : mods.resolveGrammarJsPath(grammar);
}

/** Run evaluate -> link -> normalize -> assemble and return the NodeMap. */
export async function buildNodeMap(grammar: string, mods: CodegenModules): Promise<NodeMap> {
	const entryPath = resolveEntryPath(grammar, mods);
	const raw = await mods.evaluate(entryPath);
	const linked = mods.link(raw);
	const normalized = mods.normalize(linked);
	return mods.assemble(normalized);
}

/** Convenience: load codegen + build one grammar's NodeMap in a single call. */
export async function buildNodeMapForGrammar(grammar: string): Promise<NodeMap> {
	const mods = await loadCodegen();
	return buildNodeMap(grammar, mods);
}
