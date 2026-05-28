/**
 * discover/phantom — enumerate every codegen kind that has no parser
 * symbol entry (TSGrammar-only phantoms) across all three grammars.
 *
 * A "phantom kind" is one that exists in nodeMap.nodes but has no entry
 * in generatedIdTables.kindIds — i.e. tree-sitter inlined/removed it
 * during parser compilation and it will never carry a runtime $type.
 */

import { generate } from '../../../codegen/src/compiler/generate.ts';
import { loadGeneratedIdTables } from '../../../codegen/src/compiler/generated-metadata.ts';
import { collectCatalogKinds } from '../../../codegen/src/emitters/kind-discriminant.ts';

export interface PhantomKindsOptions {
	grammars: string[];
}

interface PhantomReport {
	grammar: string;
	phantoms: string[];
	catalogKinds: Set<string>;
	nodeMapKinds: Set<string>;
	symbolNameCollisions: SymbolNameCollision[];
}

interface SymbolNameCollision {
	catalogKey: string;
	symbolName: string;
	catalogKeyId: number;
	collidingKindId?: number;
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

	const phantoms = [...nodeMapKinds].filter((k) => !catalogKinds.has(k)).sort();

	const symbolNameCollisions: SymbolNameCollision[] = [];
	if (tables?.kindIds) {
		const ids = tables.kindIds;
		const entries = ids instanceof Map ? [...ids.entries()] : Object.entries(ids);

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
			if (symbolName === key) continue;

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

export async function run(opts: PhantomKindsOptions): Promise<number> {
	const grammars = opts.grammars.length ? opts.grammars : ['rust', 'typescript', 'python'];

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
	return 0;
}
