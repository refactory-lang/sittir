import { describe, expect, it } from 'vitest';
import type { AnyUntypedNode } from '@sittir/types';
import { structuralDiff, validateFrom } from '../src/validate/from.ts';

const node = (fields: Record<string, unknown>): AnyUntypedNode => ({ $type: 7, ...fields }) as unknown as AnyUntypedNode;

describe('structuralDiff compares stored slot values', () => {
	it('reports a differing text slot and a slot only one side holds', () => {
		expect(structuralDiff(node({ _content: 'a' }), node({ _content: 'b' }))).toEqual(['_content: "a" vs "b"']);
		expect(structuralDiff(node({ _content: '-' }), node({ _content: undefined }))).toEqual(['_content: "-" vs undefined']);
	});

	it('is silent when the slots agree, and ignores read metadata', () => {
		expect(structuralDiff(node({ _content: 'a', $text: '\\a' }), node({ _content: 'a' }))).toEqual([]);
	});
});

describe('validateFrom — a read leaf whose stored kind differs from its shown kind', () => {
	it('regex identity_escape (`\\-` in a class reads as the anonymous token) passes on projected content', async () => {
		const result = await validateFrom('regex');
		expect(result.errors.filter((e) => e.kind === 'identity_escape')).toEqual([]);
		expect(result.pass).toBe(result.total);
	}, 120000);
});
