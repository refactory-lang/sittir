/**
 * polymorph-golden-inventory.test.ts — Task 0 guard
 *
 * Validates the committed partition inventory against the live grammar:
 * - All 36 polymorph kinds are source='override'
 * - 0 shared-signature (every form has a distinct named CST discriminator)
 * - 0 carve-outs
 * - Partition table matches what the nodeMap produces
 *
 * This test ensures the inventory.json stays in sync with the grammar as
 * overrides evolve. It does NOT test render output (that's Task 1's job).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { evaluate } from '../compiler/evaluate.ts';
import { link } from '../compiler/link.ts';
import { normalizeGrammar } from '../compiler/normalize.ts';
import { assemble } from '../compiler/assemble.ts';
import { resolveOverridesPath } from '../compiler/resolve-grammar.ts';
import { loadRawEntries } from '../validate/node-types-loader.ts';
import type { AssembledPolymorph, AssembledGroup } from '../compiler/node-map.ts';

const FIXTURES_DIR = fileURLToPath(new URL('./fixtures/polymorph-golden', import.meta.url));

interface InventoryEntry {
	grammar: string;
	kind: string;
	partition: 'ROUTE-EXISTING' | 'MUST-CONSTRUCT';
	forms: string[];
	note?: string;
}

interface Inventory {
	totalPolymorphKinds: number;
	counts: { rust: number; typescript: number; python: number };
	allSourceOverride: boolean;
	sharedSignatureCount: number;
	carveOutCount: number;
	partitionTable: InventoryEntry[];
	carveOutSet: string[];
	baseline: { rustAstMatch: number; typescriptAstMatch: number; pythonAstMatch: number };
}

const GRAMMARS = ['rust', 'typescript', 'python'] as const;

describe('polymorph golden inventory — Task 0 guard', () => {
	let inventory: Inventory;

	it('inventory.json is readable and well-formed', () => {
		const raw = readFileSync(resolve(FIXTURES_DIR, 'inventory.json'), 'utf-8');
		inventory = JSON.parse(raw) as Inventory;
		expect(inventory.totalPolymorphKinds).toBe(36);
		expect(inventory.allSourceOverride).toBe(true);
		expect(inventory.sharedSignatureCount).toBe(0);
		expect(inventory.carveOutCount).toBe(0);
		expect(inventory.carveOutSet).toHaveLength(0);
		expect(inventory.partitionTable).toHaveLength(36);
	});

	for (const grammar of GRAMMARS) {
		it(`${grammar}: polymorph kinds match inventory`, async () => {
			const rawEntries = loadRawEntries(grammar);
			const cstKinds = new Set(rawEntries.map(e => e.type));

			const overridePath = resolveOverridesPath(grammar);
			const raw = await evaluate(overridePath);
			const linked = link(raw);
			const optimized = normalizeGrammar(linked);
			const nodeMap = assemble(optimized);

			// Collect live polymorph kinds
			const livePolyKinds = new Set<string>();
			for (const [kind, node] of nodeMap.nodes) {
				if (node.modelType !== 'polymorph') continue;
				livePolyKinds.add(kind);

				const poly = node as AssembledPolymorph;
				// All must be source=override
				expect(poly.source, `${grammar}/${kind} source`).toBe('override');
			}

			// Verify inventory entries for this grammar
			const inventoryEntries = inventory.partitionTable.filter(e => e.grammar === grammar);
			const inventoryKinds = new Set(inventoryEntries.map(e => e.kind));

			// Count must match
			expect(livePolyKinds.size, `${grammar} polymorph kind count`).toBe(inventoryEntries.length);

			// All live kinds must be in inventory
			for (const kind of livePolyKinds) {
				expect(inventoryKinds.has(kind), `${grammar}/${kind} in inventory`).toBe(true);
			}

			// Verify partition: ROUTE-EXISTING = all form-group CST kinds in node-types.json
			for (const entry of inventoryEntries) {
				const poly = nodeMap.nodes.get(entry.kind) as AssembledPolymorph;
				const formGroupCstKinds = (poly.forms as AssembledGroup[]).map(
					f => f.kind.replace('__form_', '_')
				);

				if (entry.partition === 'ROUTE-EXISTING') {
					// All form-group CST kinds should be in node-types.json
					for (const cstKind of formGroupCstKinds) {
						expect(
							cstKinds.has(cstKind),
							`${grammar}/${entry.kind} form CST kind '${cstKind}' in node-types.json`
						).toBe(true);
					}
					// All distinct
					expect(
						new Set(formGroupCstKinds).size,
						`${grammar}/${entry.kind} form-group CST kinds are distinct`
					).toBe(formGroupCstKinds.length);
				}
			}
		});
	}
});
