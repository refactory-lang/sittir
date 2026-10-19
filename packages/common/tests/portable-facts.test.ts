import { describe, expect, it } from 'vitest';
import { portablePathHasFacts } from '../src/portable/facts.ts';

describe('portablePathHasFacts', () => {
	it('holds when the read path names every fact of the guard path, in order, other facts between', () => {
		expect(portablePathHasFacts('declaration.method.public', 'declaration.method.getter.public')).toBe(true);
		expect(
			portablePathHasFacts('declaration.method.public.internal', 'declaration.method.getter.public.internal')
		).toBe(true);
		expect(portablePathHasFacts('declaration.method', 'declaration.method')).toBe(true);
	});

	it('requires every fact, its whole segment, its order, and the same namespace', () => {
		for (const read of [
			'declaration.method.getter',
			'declaration.method.getter.publicity',
			'modifier.declaration.method.getter.public',
			'expression.method.getter.public'
		])
			expect(portablePathHasFacts('declaration.method.public', read), read).toBe(false);
		expect(
			portablePathHasFacts('declaration.method.public.internal', 'declaration.method.internal.getter.public')
		).toBe(false);
	});

	it('holds for no read path when there is none', () => {
		expect(portablePathHasFacts('declaration', undefined)).toBe(false);
	});
});
