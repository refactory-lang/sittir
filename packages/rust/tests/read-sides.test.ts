import { describe, expect, it } from 'vitest';
import { nativeEngineOf } from '@sittir/common/engine';
import { getActiveBackend } from '../src/backend.ts';

const backend = getActiveBackend();

describe.skipIf(backend.name !== 'native')("a read node's sides in one call", () => {
	it('answers what the side calls answer one by one', () => {
		if (backend.name !== 'native') return;
		const engine = nativeEngineOf(backend.native);
		try {
			if (engine.parseRecords === undefined) return;
			if (engine.readSides === undefined) throw new Error('an addon with the record codec has no readSides');
			const { root } = JSON.parse(engine.parseRecords('// only\n')) as { root: number };
			const inner = engine.readSides(root).inner;
			expect(inner).toHaveLength(1);
			const entry = (inner[0] as { readonly $node?: unknown }).$node;
			if (typeof entry !== 'number') throw new Error('the comment is not named by a key');
			for (const node of [root, entry]) {
				expect(engine.readSides(node)).toEqual({
					leading: engine.readTriviaSide!(node, 'leading'),
					trailing: engine.readTriviaSide!(node, 'trailing'),
					inner: engine.readTriviaSide!(node, 'inner'),
					units: engine.readUnitSides!(node)
				});
			}
		} finally {
			engine.dispose();
		}
	});
});
