import { describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../__tests__/helpers/temp-grammar.ts';

const withoutIds = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(withoutIds);
	if (value === null || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'id')
			.map(([key, inner]) => [key, withoutIds(inner)])
	);
};

type Rules = Readonly<Record<string, { readonly members: readonly unknown[] }>>;

const inPlace = (rules: Rules, index: number, name: string): unknown => {
	const members = [...rules.k!.members];
	const member = members[index] as { readonly type: string; readonly content?: unknown; readonly metadata?: { readonly fieldSource?: string } };
	const symbol = member.type === 'FIELD' && member.metadata?.fieldSource === 'enriched' ? member.content : member;
	members[index] = { type: 'ALIAS', content: symbol, named: true, value: name };
	return withoutIds({ ...rules, k: { ...rules.k, members } });
};

describe('alias(name) in an entry aliases a symbol member in place', () => {
	it('wraps a symbol member of a seq as alias(member, $.name), through the field enrich gave it, and records the alias effect', async () => {
		const rules = "k: ($) => seq('x', $.y), y: () => /y/";
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const named = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { k: { '1': alias('w') } }" });
		expect(withoutIds(named.rules)).toEqual(inPlace(base.rules as unknown as Rules, 1, 'w'));
		expect(named.bindingEffects).toEqual([{ kind: 'alias', from: 'y', to: 'w' }]);
	}, 60_000);

	it('keeps a choice arm\'s variant label when it aliases the arm, addressed by a negative index', async () => {
		const rules = "k: ($) => choice($.a, $.y), a: () => 'a', y: () => /y/";
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const named = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { k: { '-1': alias('w') } }" });
		expect(withoutIds(named.rules)).toEqual(inPlace(base.rules as unknown as Rules, 1, 'w'));
		expect(named.bindingEffects).toEqual([{ kind: 'alias', from: 'y', to: 'w' }]);
	}, 60_000);
});
