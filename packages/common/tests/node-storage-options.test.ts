import { describe, expect, it } from 'vitest';
import { nodeStorageOf } from '../src/engine-scope.ts';

describe('node storage', () => {
	it.each([
		[undefined, 'arena'],
		[{}, 'arena'],
		[{ nodeStorage: 'arena' }, 'arena'],
		[{ nodeStorage: 'object' }, 'object']
	] as const)('selects the backend for %j', (options, expected) => {
		expect(nodeStorageOf(options)).toBe(expected);
	});
});
