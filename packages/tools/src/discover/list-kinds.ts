/**
 * discover/list-kinds -- enumerate grammar kinds by structural category.
 *
 * Merges two scratch scripts:
 *   - list-groups.ts         (groups from the assembled nodeMap)
 *   - find-unaliased-groups.ts (groups without a visible non-group twin)
 *
 * And integrates the shared phantom-kinds tool in-process (no subprocess).
 *
 * Usage:
 *   list-kinds [--grammar <g>] [--groups] [--unaliased] [--phantom]
 *
 * Options:
 *   --grammar    grammar name (default: rust)
 *   --groups     list all group-modelled kinds
 *   --unaliased  list groups that have no visible non-group twin
 *   --phantom    list phantom kinds (nodeMap without a parser symbol)
 *
 * When no mode flag is given, --groups is assumed.
 */

import { buildNodeMap } from '../codegen-surface.ts';
import type { AssembledNodeMap as NodeMap } from '../codegen-surface.ts';

// ---------------------------------------------------------------------------
// Options interface
// ---------------------------------------------------------------------------

export interface ListKindsOptions {
	grammar: string;
	groups: boolean;
	unaliased: boolean;
	phantom: boolean;
}

// ---------------------------------------------------------------------------
// Mode: groups
// ---------------------------------------------------------------------------

function listGroups(nm: NodeMap): void {
	const groups = [...nm.nodes.entries()]
		.filter(([, n]) => n.modelType === 'group')
		.map(([k]) => k)
		.sort();
	process.stdout.write(`${groups.length} group kinds\n`);
	for (const k of groups) process.stdout.write(`  ${k}\n`);
}

// ---------------------------------------------------------------------------
// Mode: unaliased groups
// ---------------------------------------------------------------------------

/**
 * A group is "unaliased" when no visible (non-group, non-polymorph-form)
 * node exists whose kind name is the group's name with the leading underscore
 * stripped. Unaliased groups surface via bare hidden-symbol references -- the
 * case that `inlineGroupRefs` handles.
 */
function listUnaliased(nm: NodeMap): void {
	const groups = [...nm.nodes.entries()].filter(
		([k, n]) => n.modelType === 'group' && k.startsWith('_') && !k.includes('__form_') && !/_form\d+$/.test(k)
	);

	const unaliased: string[] = [];
	for (const [k] of groups) {
		const visibleTwinKey = k.slice(1); // strip leading underscore
		const twin = nm.nodes.get(visibleTwinKey);
		if (!twin || twin.modelType === 'group') unaliased.push(k);
	}
	unaliased.sort();

	process.stdout.write(`${unaliased.length} unaliased group kinds (surface via bare hidden symbol):\n`);
	for (const k of unaliased) process.stdout.write(`  ${k}\n`);
}

// ---------------------------------------------------------------------------
// Mode: phantom kinds
// ---------------------------------------------------------------------------

/**
 * List phantom kinds for the requested grammar in-process by delegating to
 * the shared phantom-kinds tool. No subprocess is spawned -- the tool's
 * `run()` export is imported dynamically and called directly.
 */
async function listPhantom(grammar: string): Promise<void> {
	const { run: runPhantomKinds } = await import('./phantom.ts');
	await runPhantomKinds({ grammars: [grammar] });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function run(opts: ListKindsOptions): Promise<number> {
	const { grammar, unaliased: showUnaliased, phantom: showPhantom } = opts;
	const showGroups = opts.groups || (!opts.groups && !opts.unaliased && !opts.phantom);

	let nm: NodeMap | null = null;

	if (showGroups || showUnaliased) {
		process.stdout.write(`\n=== ${grammar} ===\n`);
		try {
			nm = await buildNodeMap(grammar);
		} catch (e) {
			process.stderr.write(`${grammar}: ERROR building nodeMap -- ${(e as Error).message}\n`);
			return 1;
		}
	}

	if (showGroups && nm) {
		process.stdout.write('\n-- groups --\n');
		listGroups(nm);
	}

	if (showUnaliased && nm) {
		process.stdout.write('\n-- unaliased groups --\n');
		listUnaliased(nm);
	}

	if (showPhantom) {
		process.stdout.write(`\n-- phantom kinds (${grammar}) --\n`);
		try {
			await listPhantom(grammar);
		} catch (e) {
			process.stderr.write(`phantom: ERROR -- ${(e as Error).message}\n`);
			return 1;
		}
	}

	return 0;
}
