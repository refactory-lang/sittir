import { describe, expect, expectTypeOf, it } from 'vitest';
import { createEngine } from '@sittir/common';
import python from '../src/index.ts';
import type { ComprehensionClauses, StringContent } from '../src/types.ts';

const py = await createEngine(python);

describe('required repeated content', () => {
	it('rejects empty comprehension clauses', () => {
		expectTypeOf<[]>().not.toMatchTypeOf<ComprehensionClauses.BuildArgs>();
		expect(() => Reflect.apply(py.build.comprehensionClauses, undefined, [])).toThrow('requires at least one element');
		expect(() => Reflect.apply(py.build.comprehensionClauses.strict, undefined, [])).toThrow(
			'requires at least one element'
		);
	});

	it('rejects empty string content', () => {
		expectTypeOf<[]>().not.toMatchTypeOf<StringContent.BuildArgs>();
		expect(() => Reflect.apply(py.build.stringContent, undefined, [])).toThrow('requires at least one element');
	});

	it('rejects a comprehension without its required clauses', () => {
		expect(() => Reflect.apply(py.build.listComprehension, undefined, [{ body: 'x' }])).toThrow(
			/comprehensionClauses|content/
		);
	});

	it('builds non-empty clauses and their parent', () => {
		const clause = py.build.forInClause({ left: 'x', right: ['xs'] });
		const clauses = py.build.comprehensionClauses(clause);
		expect(clauses.$render().toString()).toBe('for x in xs');
		expect(py.build.listComprehension({ body: 'x', comprehensionClauses: clauses }).$render().toString()).toBe(
			'[x for x in xs]'
		);
	});

	it('keeps empty strings valid', () => {
		expect(py.build.string({ stringStart: '"', stringEnd: '"' }).$render().toString()).toBe('""');
	});

	it('keeps an empty module valid', () => {
		expect(py.build.module().$render().toString().trim()).toBe('');
	});
});
