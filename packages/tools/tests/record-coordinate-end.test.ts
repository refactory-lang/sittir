import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { coordinateOf, decodeIndex, isCoordinate } from '@sittir/common/utils';
import { languageByName } from '../src/languages.ts';
import { findWrappedNode, loadKindNameFromId, loadSlotReaders, materializeShallow, type ReadNodeLike } from '../src/validate/common.ts';

const SOURCE = 'from .. import x\ndef f():\n    return 1\n';

/** How many rows the subtree of the first node of `kind` spans, as its coordinate names it. */
async function rowsOf(nodeStorage: 'object' | 'arena', kind: string, depth?: number): Promise<number | undefined> {
	const engine = await createEngine(await languageByName('python'), { nodeStorage });
	const root = engine.parse(SOURCE, depth === undefined ? undefined : { depth });
	const node = findWrappedNode(root, await loadSlotReaders('python'), kind, await loadKindNameFromId('python'));
	const at = node === undefined ? undefined : coordinateOf(node);
	engine.dispose();
	return at === undefined ? undefined : at.$end - decodeIndex(at.$treeHandle);
}

describe("a parsed node's coordinate names the end of its subtree on either wire", () => {
	for (const nodeStorage of ['object', 'arena'] as const) {
		it(`${nodeStorage}: a leaf whose node has children, and one whose node has none`, async () => {
			expect(await rowsOf(nodeStorage, 'import_prefix')).toBe(3);
			expect(await rowsOf(nodeStorage, 'identifier')).toBe(1);
		});

		it(`${nodeStorage}: a compound child past the read's depth`, async () => {
			expect(await rowsOf(nodeStorage, 'function_definition', 1)).toBe(await rowsOf('object', 'function_definition'));
			expect(await rowsOf(nodeStorage, 'function_definition', 1)).toBeGreaterThan(1);
		});

		it(`${nodeStorage}: an unread compound child, held as its coordinate one level down`, async () => {
			const engine = await createEngine(await languageByName('python'), { nodeStorage });
			const shallow = materializeShallow(engine.parse(SOURCE, { depth: 1 }) as unknown as ReadNodeLike, await loadSlotReaders('python')) as unknown as {
				readonly _statements: readonly unknown[];
			};
			const unread = shallow._statements[1];
			if (!isCoordinate(unread)) throw new Error('the function definition is held as its coordinate');
			expect(unread.$end - decodeIndex(unread.$treeHandle)).toBe(await rowsOf('object', 'function_definition'));
			engine.dispose();
		});
	}
});
