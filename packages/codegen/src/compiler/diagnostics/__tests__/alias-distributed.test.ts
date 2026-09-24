import { describe, it, expect } from 'vitest';
import { diagnoseDistributedAliases, diagnoseMixedDisplayUnions } from '../alias-distributed.ts';
import { tokenUseCounts, type ParserSymbolCtx } from '../../../dsl/rule-patterns.ts';
import type { AnyRule } from '../../../types/rule.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const alias = (content: unknown, value: string, named = true) => ({ type: 'ALIAS', named, value, content });

function symbolsOf(rules: Record<string, unknown>, opts: { inline?: string[]; externals?: string[] } = {}): ParserSymbolCtx {
	const r = rules as Record<string, AnyRule>;
	return { rules: r, externals: new Set(opts.externals ?? []), inline: new Set(opts.inline ?? []), tokenUses: tokenUseCounts(r) };
}
const distributed = (rules: Record<string, unknown>, opts?: { inline?: string[] }) =>
	diagnoseDistributedAliases({ grammar: 'demo', symbols: symbolsOf(rules, opts) });

describe('alias-distributed', () => {
	it('fires on a named alias over a sequence of two or more members', () => {
		const out = distributed({ p: alias({ type: 'SEQ', members: [S('a'), S('b')] }, 't') });
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ code: 'alias-distributed', ownerKind: 'p', canProceed: false });
		expect(out[0]!.message).toMatch(/alias\('t'\) over a sequence of 2 members/);
	});
	it('fires on an alias over a repeat, and through optional and precedence wrappers', () => {
		expect(distributed({ p: alias({ type: 'REPEAT', content: sym('x') }, 't'), x: S('x') }).map((d) => d.code)).toEqual(['alias-distributed']);
		const wrapped = { type: 'PREC', value: 1, content: { type: 'OPTIONAL', content: { type: 'SEQ', members: [S('a'), S('b')] } } };
		expect(distributed({ p: alias(wrapped, 't') })).toHaveLength(1);
	});
	it('looks through an inlined rule, because the parser substitutes its body', () => {
		expect(distributed({ p: alias(sym('_body'), 't'), _body: { type: 'SEQ', members: [S('a'), S('b')] } }, { inline: ['_body'] })).toHaveLength(1);
	});
	it('does not look through a hidden rule that is not inlined, whatever its use count', () => {
		expect(distributed({ p: alias(sym('_body'), 't'), _body: { type: 'SEQ', members: [S('a'), S('b')] } })).toEqual([]);
	});
	it('does not look through a token, which lexes as one', () => {
		expect(distributed({ p: alias({ type: 'TOKEN', content: { type: 'SEQ', members: [S('a'), S('b')] } }, 't') })).toEqual([]);
	});
	it('is silent on an unnamed alias, which mints no kind (typescript `unique symbol`)', () => {
		expect(distributed({ p: alias({ type: 'SEQ', members: [S('unique'), S('symbol')] }, 'unique symbol', false) })).toEqual([]);
	});
	it('is silent on a symbol, a literal, a pattern, a choice and a one-member sequence', () => {
		const rules = {
			a: alias(sym('x'), 't'),
			b: alias(S('s'), 't'),
			c: alias(P('p'), 't'),
			d: alias({ type: 'CHOICE', members: [S('1'), S('2')] }, 't'),
			e: alias({ type: 'SEQ', members: [sym('x')] }, 't'),
			x: S('x')
		};
		expect(distributed(rules)).toEqual([]);
	});
});

describe('display-union-mixed', () => {
	const rules = { tok: { type: 'TOKEN', content: P('[a-z]+') }, node: { type: 'SEQ', members: [sym('tok'), S(';')] }, user: sym('tok'), other: sym('tok') };
	it('fires when one display sits over a terminal and a nonterminal', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: false }]]]),
			symbols: symbolsOf(rules)
		});
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ code: 'display-union-mixed', ownerKind: 'shown', canProceed: false, details: { terminals: ['tok'], nonterminals: ['node'] } });
	});
	it('classifies a literal member by its stamp, even when a rule has the same spelling', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: true }]]]),
			symbols: symbolsOf(rules)
		});
		expect(out).toEqual([]);
	});
	it('refuses a member that is neither a rule, an external nor a literal', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'ghost', literal: false }]]]),
			symbols: symbolsOf(rules)
		});
		expect(out.map((d) => [d.code, d.details])).toEqual([['display-union-unknown-member', { display: 'shown', member: 'ghost' }]]);
	});
});
