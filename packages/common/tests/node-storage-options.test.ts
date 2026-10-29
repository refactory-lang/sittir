import { describe, expect, it } from 'vitest';
import { nodeStorageOf } from '../src/engine-scope.ts';

describe('paired node backends', () => {
	it.each([
		[undefined, { nodeStorage: 'arena', nodeConstruction: 'record' }],
		[{}, { nodeStorage: 'arena', nodeConstruction: 'record' }],
		[{ nodeStorage: 'arena' }, { nodeStorage: 'arena', nodeConstruction: 'record' }],
		[{ nodeStorage: 'object' }, { nodeStorage: 'object', nodeConstruction: 'object' }],
		[{ nodeConstruction: 'record' }, { nodeStorage: 'arena', nodeConstruction: 'record' }],
		[
			{ nodeStorage: 'arena', nodeConstruction: 'record' },
			{ nodeStorage: 'arena', nodeConstruction: 'record' }
		],
		[
			{ nodeStorage: 'object', nodeConstruction: 'object' },
			{ nodeStorage: 'object', nodeConstruction: 'object' }
		]
	] as const)('selects the whole backend for %j', (options, expected) => {
		expect(nodeStorageOf(options)).toEqual(expected);
	});

	it.each([{ nodeStorage: 'arena', nodeConstruction: 'object' }, { nodeConstruction: 'object' }] as const)(
		'refuses the retired hybrid instead of silently changing its meaning: %j',
		(options) => {
			expect(() => nodeStorageOf(options)).toThrow(/nodeConstruction 'object'.*nodeStorage.*'object'/);
		}
	);

	it('refuses records without arena storage', () => {
		expect(() => nodeStorageOf({ nodeStorage: 'object', nodeConstruction: 'record' })).toThrow(
			/nodeConstruction 'record'.*nodeStorage 'arena'/
		);
	});
});
