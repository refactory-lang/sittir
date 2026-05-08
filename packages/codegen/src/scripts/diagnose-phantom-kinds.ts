/**
 * diagnose-phantom-kinds — enumerate every codegen kind that has no parser
 * symbol entry (TSGrammar-only phantoms) across all three grammars.
 *
 * A "phantom kind" is one that exists in nodeMap.nodes but has no entry
 * in generatedIdTables.kindIds — i.e. tree-sitter inlined/removed it
 * during parser compilation and it will never carry a runtime $type.
 *
 * Usage:
 *   npx tsx packages/codegen/src/scripts/diagnose-phantom-kinds.ts [grammar...]
 */

import { generate } from '../compiler/generate.ts';
import { loadGeneratedIdTables } from '../compiler/generated-metadata.ts';
import { collectCatalogKinds } from '../emitters/kind-discriminant.ts';

interface PhantomReport {
	grammar: string;
	phantoms: string[];
	catalogKinds: Set<string>;
	nodeMapKinds: Set<string>;
	symbolNameCollisions: SymbolNameCollision[];
}

interface SymbolNameCollision {
	catalogKey: string; // e.g. "_as_pattern"
	symbolName: string; // e.g. "as_pattern"
	catalogKeyId: number;
	collidingKindId?: number; // id of the real kind whose name === symbolName
}

async function diagnoseGrammar(grammar: string): Promise<PhantomReport> {
	const result = await generate({ grammar, outputDir: '/dev/null' });
	const { nodeMap } = result;

	const tables = await loadGeneratedIdTables(grammar);

	const nodeMapKinds = new Set(nodeMap.nodes.keys());
	const catalogKinds = new Set<string>();

	if (tables) {
		for (const k of collectCatalogKinds(tables)) {
			catalogKinds.add(k);
		}
	}

	// Phantoms = in nodeMap but NOT in catalog (no parser symbol)
	const phantoms = [...nodeMapKinds].filter((k) => !catalogKinds.has(k)).sort();

	// Find symbolName collisions: catalog entries where symbolName matches
	// another real catalog key (or nodeMap key).
	const symbolNameCollisions: SymbolNameCollision[] = [];
	if (tables?.kindIds) {
		const ids = tables.kindIds;
		const entries = ids instanceof Map ? [...ids.entries()] : Object.entries(ids);

		// Build id lookup by key
		const idByKey = new Map<string, number>();
		for (const [key, value] of entries) {
			const id = typeof value === 'number' ? value : value.id;
			if (id !== undefined) idByKey.set(key, id);
		}

		for (const [key, value] of entries) {
			if (typeof value === 'number') continue;
			const entry = value as { id?: number; parser?: { symbolName?: string } };
			if (!entry.id || !entry.parser?.symbolName) continue;
			const symbolName = entry.parser.symbolName;
			if (symbolName === key) continue; // no collision when same

			// Check if another catalog key uses symbolName as its key
			const collidingId = idByKey.get(symbolName);
			if (collidingId !== undefined && collidingId !== entry.id) {
				symbolNameCollisions.push({
					catalogKey: key,
					symbolName,
					catalogKeyId: entry.id,
					collidingKindId: collidingId
				});
			}
		}
	}

	return { grammar, phantoms, catalogKinds, nodeMapKinds, symbolNameCollisions };
}

const args = process.argv.slice(2);
const grammars = args.length ? args : ['rust', 'typescript', 'python'];

for (const grammar of grammars) {
	try {
		console.log(`\n=== ${grammar.toUpperCase()} ===`);
		const report = await diagnoseGrammar(grammar);

		console.log(`nodeMap kinds:    ${report.nodeMapKinds.size}`);
		console.log(`catalog kinds:    ${report.catalogKinds.size}`);
		console.log(`phantom kinds:    ${report.phantoms.length}`);

		if (report.phantoms.length > 0) {
			console.log('\nPhantom kinds (in nodeMap, no parser symbol):');
			for (const k of report.phantoms) {
				console.log(`  ${k}`);
			}
		}

		if (report.symbolNameCollisions.length > 0) {
			console.log('\nSymbolName collisions (symbolName === another catalog key):');
			for (const c of report.symbolNameCollisions) {
				console.log(
					`  ${c.catalogKey} (id=${c.catalogKeyId}) symbolName="${c.symbolName}" ` +
						`collides with catalog key id=${c.collidingKindId}`
				);
			}
		} else {
			console.log('\nNo symbolName collisions found.');
		}
	} catch (e) {
		console.log(`${grammar}: ERROR ${(e as Error).message}`);
		console.log((e as Error).stack);
	}
}
