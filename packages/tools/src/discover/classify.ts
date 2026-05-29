/**
 * discover/classify -- inspect kind classification and rule shape through the
 * compiler phases.
 *
 * Promotes scratch/classify-kinds.ts to a proper tool. For each requested
 * kind, shows the assembled modelType and the rule's discriminant type so you
 * can trace why a kind is classified the way it is.
 *
 * Usage:
 *   classify [--grammar rust|typescript|python] [--kind <name>]
 *
 * Options:
 *   --grammar   grammar name (default: rust)
 *   --kind      show only this kind; without it a built-in set of interesting
 *               kinds is shown (same as the original scratch script)
 *
 * Inspect all kinds of a given modelType:
 *   classify --grammar rust --modeltype branch
 *
 * Options (extended):
 *   --modeltype  filter output to kinds matching this modelType
 *   --all        show ALL assembled kinds (can be large)
 */

import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Minimal local types -- mirrors the codegen compiler interfaces we need.
// Using local definitions avoids cross-project static imports (TS6307).
// The actual values are loaded via dynamic import at runtime.
// ---------------------------------------------------------------------------

/** Assembled node shape -- structural nodes carry an optional `rule` property. */
interface AssembledNode {
modelType: string;
[key: string]: unknown;
}

interface NodeMap {
nodes: Map<string, AssembledNode>;
}

type PipelineStage = unknown;

interface CodegenModules {
evaluate: (path: string) => Promise<PipelineStage>;
link: (raw: PipelineStage) => PipelineStage;
optimize: (linked: PipelineStage) => PipelineStage;
assemble: (optimized: PipelineStage) => NodeMap;
resolveGrammarJsPath: (grammar: string) => string;
resolveOverridesPath: (grammar: string) => string;
}

const CODEGEN_PATHS = {
evaluate: '../../../codegen/src/compiler/evaluate.ts',
link: '../../../codegen/src/compiler/link.ts',
optimize: '../../../codegen/src/compiler/optimize.ts',
assemble: '../../../codegen/src/compiler/assemble.ts',
resolve: '../../../codegen/src/compiler/resolve-grammar.ts',
} as const;

async function loadCodegen(): Promise<CodegenModules> {
const [evalMod, linkMod, optMod, assembleMod, resolveMod] = await Promise.all([
import(CODEGEN_PATHS.evaluate),
import(CODEGEN_PATHS.link),
import(CODEGEN_PATHS.optimize),
import(CODEGEN_PATHS.assemble),
import(CODEGEN_PATHS.resolve),
]);
return {
// cast-at-the-boundary: dynamic import returns untyped modules; we narrow
// to the local interface here so downstream code stays fully typed.
evaluate: evalMod.evaluate as CodegenModules['evaluate'],
link: linkMod.link as CodegenModules['link'],
optimize: optMod.optimize as CodegenModules['optimize'],
assemble: assembleMod.assemble as CodegenModules['assemble'],
resolveGrammarJsPath: resolveMod.resolveGrammarJsPath as CodegenModules['resolveGrammarJsPath'],
resolveOverridesPath: resolveMod.resolveOverridesPath as CodegenModules['resolveOverridesPath'],
};
}

// ---------------------------------------------------------------------------
// Default "interesting" kinds per grammar (from the original scratch script)
// ---------------------------------------------------------------------------

const DEFAULT_TARGETS: Record<string, string[]> = {
rust: ['mod_item', 'mod_item_external', 'mod_item_inline', 'never_type', 'struct_item_unit', 'impl_item_semi'],
typescript: ['empty_statement', 'existential_type'],
python: ['_match_block', 'match_statement'],
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface ClassifyOptions {
	grammar: string;
	kinds: string[] | null;
	modelTypeFilter: string | null;
	showAll: boolean;
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

/** Resolve the grammar entry path (overrides.ts preferred over grammar.js). */
function resolveEntryPath(
grammar: string,
mods: Pick<CodegenModules, 'resolveGrammarJsPath' | 'resolveOverridesPath'>,
): string {
const overrides = mods.resolveOverridesPath(grammar);
return existsSync(overrides) ? overrides : mods.resolveGrammarJsPath(grammar);
}

/** Run evaluate -> link -> optimize -> assemble and return the NodeMap. */
async function buildNodeMap(grammar: string, mods: CodegenModules): Promise<NodeMap> {
const entryPath = resolveEntryPath(grammar, mods);
const raw = await mods.evaluate(entryPath);
const linked = mods.link(raw);
const optimized = mods.optimize(linked);
return mods.assemble(optimized);
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

/** Print classification details for one assembled node. */
function printNode(kind: string, node: AssembledNode): void {
// `rule` is present on structural nodes (branch, group, polymorph, multi);
// token/keyword/pattern/enum nodes carry rule-adjacent data differently.
const ruleObj = node['rule'];
const ruleType =
ruleObj !== undefined && typeof ruleObj === 'object' && ruleObj !== null
? (ruleObj as Record<string, unknown>)['type'] ?? '-'
: '-';

process.stdout.write(`  ${kind}: modelType=${node.modelType} rule.type=${ruleType}\n`);

if (ruleObj !== undefined) {
const snippet = JSON.stringify(ruleObj, null, 2).slice(0, 500);
// Indent the snippet for readability.
const indented = snippet
.split('\n')
.map((l) => `    ${l}`)
.join('\n');
process.stdout.write(`    rule:\n${indented}\n`);
}
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: ClassifyOptions): Promise<number> {
	const { grammar, kinds, modelTypeFilter, showAll } = opts;

	let mods: CodegenModules;
	try {
		mods = await loadCodegen();
	} catch (e) {
		process.stderr.write(`classify: failed to load codegen -- ${(e as Error).message}\n`);
		return 1;
	}

	let nm: NodeMap;
	try {
		nm = await buildNodeMap(grammar, mods);
	} catch (e) {
		process.stderr.write(`${grammar}: ERROR building nodeMap -- ${(e as Error).message}\n`);
		return 1;
	}

	process.stdout.write(`\n=== ${grammar} ===\n`);

	let targets: string[];
	if (showAll || modelTypeFilter) {
		targets = [...nm.nodes.keys()].sort();
	} else if (kinds !== null) {
		targets = kinds;
	} else {
		targets = DEFAULT_TARGETS[grammar] ?? [];
		if (targets.length === 0) {
			process.stdout.write('(no default targets for this grammar; use --kind or --all)\n');
			return 0;
		}
	}

	for (const kind of targets) {
		const node = nm.nodes.get(kind);
		if (!node) {
			process.stdout.write(`  ${kind}: (not in nodeMap)\n`);
			continue;
		}
		if (modelTypeFilter && node.modelType !== modelTypeFilter) continue;
		printNode(kind, node);
	}

	return 0;
}
