import { describe, expect, it } from 'vitest';
import { loadRenderBodies, renderBodiesPath } from '../../src/validate/render-bodies.ts';

describe('loadRenderBodies', () => {
	it('throws naming the renderBodiesPath(grammar) path when no catalog exists', () => {
		const grammar = 'nonexistent-grammar';
		expect(() => loadRenderBodies(grammar)).toThrow(renderBodiesPath(grammar));
	});
});
