import { describe, expect, it } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

describe('a kind id after a built list is an element, not options (strict)', () => {
	it('builds a list whose element is a kind id after a built list', async () => {
		await using py = await createEngine(python, { api: 'strict' });
		const existing = py.build.list();
		expect(() => (py.build.list as (...a: unknown[]) => unknown)(existing, py.kinds.None)).not.toThrow();
	});
});
