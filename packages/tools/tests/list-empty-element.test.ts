import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { findWrappedNode, loadKindNameFromId, loadSlotAccessorOf, slotValuesOf } from '../src/validate/common.ts';

/** The items of the list slot of the first node of `kind` in `source`, read `depth` levels at parse, as its slot reader returns them. */
async function itemsOf(grammar: string, nodeStorage: 'object' | 'arena', source: string, kind: string, depth?: number): Promise<readonly unknown[]> {
	const engine = await createEngine(await languageByName(grammar), { nodeStorage });
	const accessorOf = await loadSlotAccessorOf(grammar);
	const node = findWrappedNode(engine.parse(source, depth === undefined ? undefined : { depth }), accessorOf, kind, await loadKindNameFromId(grammar));
	if (node === undefined) throw new Error(`no ${kind} in ${JSON.stringify(source)}`);
	const list = slotValuesOf(node, accessorOf).find(([, value]) => Array.isArray(value))?.[1];
	if (!Array.isArray(list)) throw new Error(`${kind} holds no list slot`);
	const items = [...(list as readonly unknown[])];
	engine.dispose();
	return items;
}

/** An array holding a hole beside a nesting deeper than the wire encoder's recursion limit (24): read whole, the encoder writes it frame by frame. */
const PAST_RECURSION_LIMIT = `[${'['.repeat(30)}1${']'.repeat(30)},,b];\n`;

describe("a list's empty element is null on either wire", () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`typescript, a hole beside a nesting past the encoder's recursion limit (${nodeStorage})`, async () => {
			const items = await itemsOf('typescript', nodeStorage, PAST_RECURSION_LIMIT, 'array', Infinity);
			expect(items).toHaveLength(3);
			expect(items).toContain(null);
			expect(items).not.toContain(undefined);
		});

		for (const [grammar, source, kind] of [
			['regex', 'a||b', 'alternation'],
			['typescript', '[a,,b];\n', 'array']
		] as const) {
			it(`${grammar} ${JSON.stringify(source)} (${nodeStorage})`, async () => {
				const items = await itemsOf(grammar, nodeStorage, source, kind);
				expect(items).toContain(null);
				expect(items).not.toContain(undefined);
			});
		}
	}
});
