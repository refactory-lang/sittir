import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { languageByName } from '../src/languages.ts';
import { findWrappedNode, loadKindNameFromId, loadSlotReaders, slotValuesOf } from '../src/validate/common.ts';

/** The items of the list slot of the first node of `kind` in `source`, as its slot reader returns them. */
async function itemsOf(grammar: string, nodeStorage: 'object' | 'arena', source: string, kind: string): Promise<readonly unknown[]> {
	const engine = await createEngine(await languageByName(grammar), { nodeStorage });
	const readers = await loadSlotReaders(grammar);
	const node = findWrappedNode(engine.parse(source), readers, kind, await loadKindNameFromId(grammar));
	if (node === undefined) throw new Error(`no ${kind} in ${JSON.stringify(source)}`);
	const list = slotValuesOf(node, readers).find(([, value]) => Array.isArray(value))?.[1];
	if (!Array.isArray(list)) throw new Error(`${kind} holds no list slot`);
	const items = [...(list as readonly unknown[])];
	engine.dispose();
	return items;
}

describe("a list's empty element is undefined on either wire", () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		for (const [grammar, source, kind] of [
			['regex', 'a||b', 'alternation'],
			['typescript', '[a,,b];\n', 'array']
		] as const) {
			it(`${grammar} ${JSON.stringify(source)} (${nodeStorage})`, async () => {
				const items = await itemsOf(grammar, nodeStorage, source, kind);
				expect(items).toContain(undefined);
				expect(items).not.toContain(null);
			});
		}
	}
});
