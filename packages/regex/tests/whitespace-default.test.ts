import { describe, expect, it } from 'vitest';
import { createEngine } from '../src/engine.js';

describe('a grammar whose extras admit no space renders its seams tight', () => {
	const engine = createEngine();
	for (const source of ['^$', '^|$', '(a)|b', 'a{1,2}']) {
		it(JSON.stringify(source), () => {
			const { root } = engine.diagnostics.parseAndRead(source);
			expect(String(engine.render(root))).toBe(source);
		});
	}
});
