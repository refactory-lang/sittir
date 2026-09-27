import { describe, expect, it } from 'vitest';
import { extrasClosure } from '../extras.ts';

describe('extrasClosure', () => {
	it('adds the members of a supertype in extras, through nested supertypes', () => {
		const subtypes: Record<string, readonly string[]> = {
			_comment: ['line_comment', '_block'],
			_block: ['block_comment']
		};
		expect([...extrasClosure(['_comment', 'shebang'], (name) => subtypes[name])].sort()).toEqual([
			'_block',
			'_comment',
			'block_comment',
			'line_comment',
			'shebang'
		]);
	});

	it('terminates on a supertype cycle', () => {
		const subtypes: Record<string, readonly string[]> = { _a: ['_b'], _b: ['_a'] };
		expect([...extrasClosure(['_a'], (name) => subtypes[name])].sort()).toEqual(['_a', '_b']);
	});
});
