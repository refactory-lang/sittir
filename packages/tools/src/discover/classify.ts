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

import { buildNodeMap } from '../codegen-surface.ts';
import type { AssembledNodeMap as NodeMap, AssembledNode } from '../codegen-surface.ts';

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
// Display
// ---------------------------------------------------------------------------

/** Print classification details for one assembled node. */
function printNode(kind: string, node: AssembledNode): void {
// `rule` is present on structural nodes (branch, group, polymorph, multi);
// token/keyword/pattern/enum nodes carry rule-adjacent data differently.
// `node.rule` is now the real `Rule` type (via codegen-surface), so `.type`
// is directly accessible — no cast needed.
const ruleObj = node['rule'];
const ruleType =
ruleObj !== undefined && typeof ruleObj === 'object' && ruleObj !== null
? ruleObj.type ?? '-'
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

	let nm: NodeMap;
	try {
		nm = await buildNodeMap(grammar);
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
