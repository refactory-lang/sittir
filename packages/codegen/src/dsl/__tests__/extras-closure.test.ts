import { describe, expect, it } from 'vitest';
import { extrasClosure } from '../extras.ts';

describe('extrasClosure', () => {
	it('adds the members of a supertype in extras, through nested supertypes', () => {
		const subtypes: Record<string, readonly string[]> = {
			_comment: ['line_comment', '_block'],
			_block: ['block_comment']
		};
		expect([...extrasClosure(['_comment', 'shebang'], Object.keys(subtypes), (name) => subtypes[name])].sort()).toEqual(
			['_block', '_comment', 'block_comment', 'line_comment', 'shebang']
		);
	});

	it('adds a supertype whose members are all extras, through nested supertypes', () => {
		const subtypes: Record<string, readonly string[]> = {
			comment: ['line_comment', '_block'],
			_block: ['block_comment'],
			expression: ['identifier', 'line_comment']
		};
		expect(
			[...extrasClosure(['line_comment', 'block_comment'], Object.keys(subtypes), (name) => subtypes[name])].sort()
		).toEqual(['_block', 'block_comment', 'comment', 'line_comment']);
	});

	it('terminates on a supertype cycle', () => {
		const subtypes: Record<string, readonly string[]> = { _a: ['_b'], _b: ['_a'] };
		expect([...extrasClosure(['_a'], Object.keys(subtypes), (name) => subtypes[name])].sort()).toEqual(['_a', '_b']);
	});
});
