import { describe, expect, it } from 'vitest';
import { register, registered } from '../src/identity.ts';
import type { TreeHandle } from '../src/read.ts';

describe('the registry', () => {
	it('answers what was registered, per tree, index and role', () => {
		const a: TreeHandle = { id: 1 };
		const b: TreeHandle = { id: 2 };
		const envelope = {};
		const content = {};
		register(a, 7, 'node', envelope);
		register(a, 7, 'aliasContent', content);
		expect(registered(a, 7, 'node')).toBe(envelope);
		expect(registered(a, 7, 'aliasContent')).toBe(content);
		expect(registered(b, 7, 'node')).toBeUndefined();
		expect(registered(a, 8, 'node')).toBeUndefined();
	});
});
