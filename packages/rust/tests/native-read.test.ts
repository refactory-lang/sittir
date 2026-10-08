// The native read: a node read by its descendant index into its transport,
// which names the node it came from.
import { describe, expect, it } from 'vitest';
import { getActiveBackend } from '../src/backend.js';

type Coordinate = { $treeHandle: number; $span: { start: number; end: number }; $type: number };
type Read = { $_layout?: { at?: Coordinate }; _statements?: Coordinate[] };

function engine() {
	const status = getActiveBackend();
	if (status.name !== 'native') throw new Error(`native backend unavailable: ${status.reason}`);
	return new status.native.SittirEngine();
}

describe('a node read through the native read', () => {
	it('carries its own coordinate as $_layout.at', () => {
		const native = engine();
		const source = 'use a;\nfn f(x: u8) {}\n';
		const { treeId } = JSON.parse(native.parse(source)) as { treeId: number };
		const root = native.read(treeId, 0) as Read;
		const rootAt = root.$_layout?.at;
		const coord = root._statements?.[1];
		if (rootAt === undefined || coord === undefined) throw new Error('the root read names neither itself nor the function');
		// The root is index 0, so a handle's distance from the root's handle is its node's index.
		const read = native.read(treeId, coord.$treeHandle - rootAt.$treeHandle, 1) as Read;
		const span = { start: source.indexOf('fn'), end: source.indexOf('}') + 1 };
		expect(read.$_layout?.at).toEqual({ $treeHandle: coord.$treeHandle, $span: span, $type: coord.$type });
	});

	it('refuses an index past the last node of the tree', () => {
		const native = engine();
		const { treeId } = JSON.parse(native.parse('fn f() {}')) as { treeId: number };
		expect(() => native.read(treeId, 99)).toThrow(`index 99 names no node of tree ${treeId}`);
	});
});
