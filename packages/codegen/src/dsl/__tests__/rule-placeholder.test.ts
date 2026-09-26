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
	it('replaces the content with a reference and deposits nothing: the declared rule builds its own body', () => {
		const original = { type: 'SEQ', members: [sym('for_in_clause'), { type: 'REPEAT', content: sym('if_clause') }] };
		const { result, deposits } = applyTransformForTest('list_comprehension', { type: 'SEQ', members: [S('['), original] }, {
			1: rule('comprehension_clauses', clauses)
		});
		expect((result as { members: unknown[] }).members[1]).toMatchObject(sym('comprehension_clauses'));
		expect(deposits.has('comprehension_clauses')).toBe(false);
	});

	it('the same name with an equal body at two paths is one rule', () => {
		const { result } = applyTransformForTest('demo', { type: 'SEQ', members: [sym('a'), sym('b')] }, { 0: rule('x', clauses), 1: rule('x', clauses) });
		expect((result as { members: unknown[] }).members).toMatchObject([sym('x'), sym('x')]);
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
	const dollarOf = (owner: string) => new Proxy({}, { get: (_t, name: string) => ({ type: 'SYMBOL', name, owner }) });
	const run = (patches: Record<string, Record<string, unknown>>, rules: Record<string, (...a: never[]) => unknown> = {}) => {
		const wired = wire<GrammarJson>({ name: 'test', rules: rules as never, patches: patches as never });
		const out: Record<string, unknown> = {};
		for (const [name, fn] of Object.entries(wired.rules)) out[name] = (fn as (d: unknown, p?: unknown) => unknown)(dollarOf(name), bases[name]);
		return { names: Object.keys(wired.rules), out };
	};
	const bases: Record<string, unknown> = {
		list_comprehension: { type: 'SEQ', members: [S('['), sym('expression'), sym('_comprehension_clauses'), S(']')] },
		set_comprehension: { type: 'SEQ', members: [S('{'), sym('expression'), sym('_comprehension_clauses'), S('}')] },
		demo: { type: 'PREC', value: 2, content: { type: 'SEQ', members: [sym('a'), sym('b')] } }
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

	it("builds the body from the declared rule's own $, so its references belong to it and not to a patching parent", () => {
		const { out } = run({
			list_comprehension: { 2: rule('comprehension_clauses', clauses) },
			set_comprehension: { 2: rule('comprehension_clauses', clauses) }
		});
		const arms = (out.comprehension_clauses as { content: { members: { owner: string }[] } }).content.members;
		expect(arms.map((arm) => arm.owner)).toEqual(['comprehension_clauses', 'comprehension_clauses']);
	});

	it('carries no hoisted annotation and is not wrapped in the precedence of the path it replaces', () => {
		const { out } = run({ demo: { 1: rule('x', clauses) } });
		const body = out.x as { type: string; annotations?: { hoisted?: true } };
		expect(body.type).toBe('REPEAT1');
		expect(body.annotations?.hoisted).toBeUndefined();
	});

	it('refuses a name the grammar already has', () => {
		expect(() => run({ list_comprehension: { 2: rule('expression', clauses) } }, { expression: () => sym('x') })).toThrow(
			/rule\('expression'\): 'expression' is already a rule of this grammar/
		);
	});
});
