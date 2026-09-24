import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { rule } from '../primitives/rule.ts';
import { applyTransformForTest, installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';
import { wire } from '../wire/wire.ts';
import type { GrammarJson } from '../../grammar-shapes/grammar-json.ts';

const S = (value: string) => ({ type: 'STRING', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const clauses = ($: Record<string, unknown>) => ({ type: 'REPEAT1', content: { type: 'CHOICE', members: [$.for_in_clause, $.if_clause] } }) as never;

beforeAll(() => installFakeDsl());
afterAll(() => restoreFakeDsl());

describe('rule() declares a real rule at a path', () => {
	it('replaces the content with a symbol and deposits the authored body without a hoisted annotation', () => {
		const original = { type: 'SEQ', members: [sym('for_in_clause'), { type: 'REPEAT', content: sym('if_clause') }] };
		const { result, deposits } = applyTransformForTest('list_comprehension', { type: 'SEQ', members: [S('['), original] }, {
			1: rule('comprehension_clauses', clauses)
		});
		expect((result as { members: unknown[] }).members[1]).toMatchObject(sym('comprehension_clauses'));
		const body = deposits.get('comprehension_clauses') as { type: string; annotations?: { hoisted?: true } };
		expect(body.type).toBe('REPEAT1');
		expect(body.annotations?.hoisted).toBeUndefined();
	});

	it('does not wrap the body in the precedence of the path it replaces', () => {
		const { deposits } = applyTransformForTest('demo', { type: 'PREC', value: 2, content: { type: 'SEQ', members: [sym('a'), sym('b')] } }, {
			1: rule('x', clauses)
		});
		expect((deposits.get('x') as { type: string }).type).toBe('REPEAT1');
	});

	it('the same name with an equal body at two paths is one rule', () => {
		const { deposits } = applyTransformForTest('demo', { type: 'SEQ', members: [sym('a'), sym('b')] }, { 0: rule('x', clauses), 1: rule('x', clauses) });
		expect([...deposits.keys()]).toEqual(['x']);
	});

	it('the same name at two paths must carry equal bodies', () => {
		const body = ($: Record<string, unknown>) => ({ type: 'REPEAT1', content: $.if_clause }) as never;
		const other = ($: Record<string, unknown>) => ({ type: 'REPEAT1', content: $.for_in_clause }) as never;
		expect(() =>
			applyTransformForTest('demo', { type: 'SEQ', members: [sym('a'), sym('b')] }, { 0: rule('x', body), 1: rule('x', other) })
		).toThrow(/rule\('x'\): bodies differ at demo\/0 and demo\/1/);
	});
});

describe('wire() installs a rule() name as a rule of the grammar', () => {
	const run = (patches: Record<string, Record<string, unknown>>, rules: Record<string, (...a: never[]) => unknown> = {}) => {
		const wired = wire<GrammarJson>({ name: 'test', rules: rules as never, patches: patches as never });
		const $ = new Proxy({}, { get: (_t, name: string) => ({ type: 'SYMBOL', name }) });
		const out: Record<string, unknown> = {};
		for (const [name, fn] of Object.entries(wired.rules)) out[name] = (fn as (d: unknown, p?: unknown) => unknown)($, bases[name]);
		return { names: Object.keys(wired.rules), out };
	};
	const bases: Record<string, unknown> = {
		list_comprehension: { type: 'SEQ', members: [S('['), sym('expression'), sym('_comprehension_clauses'), S(']')] },
		set_comprehension: { type: 'SEQ', members: [S('{'), sym('expression'), sym('_comprehension_clauses'), S('}')] }
	};

	it('one rule serves every path that declares it with an equal body', () => {
		const { names, out } = run({
			list_comprehension: { 2: rule('comprehension_clauses', clauses) },
			set_comprehension: { 2: rule('comprehension_clauses', clauses) }
		});
		expect(names).toContain('comprehension_clauses');
		expect((out.comprehension_clauses as { type: string }).type).toBe('REPEAT1');
		expect((out.set_comprehension as { members: unknown[] }).members[2]).toMatchObject(sym('comprehension_clauses'));
	});

	it('refuses a name the grammar already has', () => {
		expect(() => run({ list_comprehension: { 2: rule('expression', clauses) } }, { expression: () => sym('x') })).toThrow(
			/rule\('expression'\): 'expression' is already a rule of this grammar/
		);
	});
});
