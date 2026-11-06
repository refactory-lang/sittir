import { describe, expect, it } from 'vitest';
import { excessOf } from '../src/portable/admission.ts';

describe('excessOf', () => {
	it('counts a role-armed member whose exact set is one kind as admitting the rest of the role', () => {
		expect(excessOf(new Set(['expression.call', 'expression.binary']), { kinds: ['expression.call'] })).toEqual(['expression.binary']);
	});

	it('finds no excess where the member admits only its exact set', () => {
		expect(excessOf(new Set(['statement.block', 'statement.if']), { kinds: ['statement.block', 'statement.if'] })).toEqual([]);
	});
});
