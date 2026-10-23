import { describe, it, expect } from 'vitest';
import python from '../src/index.ts';
import { createEngine } from '@sittir/common';

const py = await createEngine(python);

// Upstream's grammar admits several iterables and a trailing comma in a for clause, which CPython rejects;
// these cases pin upstream's current acceptance, and issue 901 tracks authoring it as one disjunction.
describe('the trailing comma after a comprehension for clause is an optional-field spelling', () => {
	it('a parsed comprehension keeps the spelling it was written with', () => {
		for (const source of ['[x for x in a, b]\n', '[x for x in a, b,]\n']) expect(py.parse(source).$render()).toBe(source);
	});

	it('the render option chooses the comma and defaults to none', () => {
		expect(py.build.forInClause({ left: 'x', rights: ['a', 'b'] }).$render()).toBe('for x in a, b');
		expect(py.build.forInClause({ left: 'x', rights: ['a', 'b'] }, { trailingComma: py.kinds.Comma }).$render()).toBe('for x in a, b,');
		expect(py.build.forInClause({ left: 'x', rights: ['a', 'b'] }, { trailingComma: null }).$render()).toBe('for x in a, b');
	});
});
