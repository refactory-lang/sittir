import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { enrich } from '../enrich.ts';
import { installFakeDsl, restoreFakeDsl } from './_test-helpers.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });
const seq = (...members: unknown[]) => ({ type: 'SEQ', members });
const choice = (...members: unknown[]) => ({ type: 'CHOICE', members });
const token = (content: unknown, annotations?: unknown) => ({ type: 'TOKEN', content, ...(annotations ? { annotations } : {}) });
const numberBody = () =>
	choice(
		seq(choice(S('0x'), S('0X')), P('[0-9a-f]+')),
		choice(seq(P('\\d+'), S('.')), P('\\d+')),
		seq(choice(S('0b'), S('0B')), P('[01]+'))
	);
const grammarWith = (rules: Record<string, unknown>, supertypes: unknown = []) => ({ name: 'demo', rules, supertypes, extras: [] });
const rulesOf = (g: unknown) => (g as { rules: Record<string, any> }).rules;

describe('enrich: token forms', () => {
	beforeAll(() => installFakeDsl());
	afterAll(() => restoreFakeDsl());

	it('a token rule with a form alternation becomes a choice of minted arms and a supertype', () => {
		const out = enrich(grammarWith({ number: token(numberBody()), source: seq({ type: 'SYMBOL', name: 'number' }) }));
		const rules = rulesOf(out);
		expect(rules.number.type).toBe('CHOICE');
		expect(rules.number.members.map((m: any) => m.name)).toEqual(['number_arm1', 'number_arm2', 'number_arm3', 'number_arm4']);
		expect(rules.number_arm1.type).toBe('TOKEN');
		expect(rules.number_arm1.annotations?.hoisted).toBe(true);
		expect(rules.number_arm2.content.type).toBe('SEQ');
		expect((out as any).supertypes).toContain('number');
	});

	it('a token with only spelling and presence choices is untouched', () => {
		const rule = token(seq(P('[0-9]+'), choice(choice(S('u8'), S('i8')), { type: 'BLANK' })));
		const out = enrich(grammarWith({ suffixed: rule }));
		expect(rulesOf(out).suffixed.type).toBe('TOKEN');
		expect((out as any).supertypes).toEqual([]);
	});

	it('appends to a function-valued supertypes list', () => {
		const out = enrich(grammarWith({ number: token(numberBody()) }, ($: any) => [$._whitespace]));
		const dollar = new Proxy({}, { get: (_t, prop) => ({ type: 'SYMBOL', name: String(prop) }) });
		const names = ((out as any).supertypes as (d: unknown) => any[])(dollar).map((r) => r.name);
		expect(names).toEqual(['_whitespace', 'number']);
	});

	it('mints the arms as enrich group lifts, so a variant() on the parent renames them', () => {
		const out = enrich(grammarWith({ number: token(numberBody()) }));
		const arm = rulesOf(out).number.members[0];
		expect(arm.metadata).toMatchObject({ symbolSource: 'group-lift' });
	});

	it('leaves the grammar word rule alone: keyword extraction needs one token', () => {
		const grammar = { ...grammarWith({ number: token(numberBody()) }), word: ($: any) => $.number };
		const out = enrich(grammar);
		expect(rulesOf(out).number.type).toBe('TOKEN');
		expect((out as any).supertypes).toEqual([]);
	});

	it('leaves a rule the grammar declares as an external token alone', () => {
		const grammar = { ...grammarWith({ number: token(numberBody()) }), externals: ($: any) => [$.number] };
		const out = enrich(grammar);
		expect(rulesOf(out).number.type).toBe('TOKEN');
		expect((out as any).supertypes).toEqual([]);
	});
});
