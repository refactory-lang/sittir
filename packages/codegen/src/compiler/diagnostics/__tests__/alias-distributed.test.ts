import { describe, it, expect } from 'vitest';
import { diagnoseDistributedAliases, diagnoseInlineTokenAliases, diagnoseMixedDisplayUnions } from '../alias-distributed.ts';
import { symbolFactsOf, type SymbolSource } from '../../../dsl/rule-patterns.ts';
import { catalogSymbolSource, predictedSymbolSourceOf, type KindEntryLike } from '../../../dsl/symbol-table.ts';
import type { AnyRule } from '../../../types/rule.ts';

const S = (value: string) => ({ type: 'STRING', value });
const P = (value: string) => ({ type: 'PATTERN', value });
const sym = (name: string) => ({ type: 'SYMBOL', name });
const alias = (content: unknown, value: string, named = true) => ({ type: 'ALIAS', named, value, content });

function symbolsOf(
	rules: Record<string, unknown>,
	opts: { inline?: string[]; externals?: string[]; kindEntries?: KindEntryLike[] } = {}
): SymbolSource {
	const grammar = {
		rules: rules as Record<string, AnyRule>,
		externals: (opts.externals ?? []).map((name) => ({ type: 'SYMBOL' as const, name })),
		inline: opts.inline ?? [],
		supertypes: [],
		extras: [],
		word: null
	};
	return opts.kindEntries === undefined
		? predictedSymbolSourceOf(grammar)
		: catalogSymbolSource({ ...symbolFactsOf(grammar), kindEntries: opts.kindEntries });
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
	const rules = {
		source: { type: 'CHOICE', members: [sym('node'), sym('user'), sym('other')] },
		tok: { type: 'TOKEN', content: P('[a-z]+') },
		node: { type: 'SEQ', members: [sym('tok'), S(';')] },
		user: sym('tok'),
		other: sym('tok')
	};
	const kindEntries: KindEntryLike[] = [{ kind: 'tok', terminal: true }, { kind: 'node' }];
	it('fires when one display sits over a terminal and a nonterminal', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: false }]]]),
			symbols: symbolsOf(rules, { kindEntries })
		});
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ code: 'display-union-mixed', ownerKind: 'shown', canProceed: false, details: { terminals: ['tok'], nonterminals: ['node'] } });
	});
	it('classifies a literal member by its stamp, even when a rule has the same spelling', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: true }]]]),
			symbols: symbolsOf(rules, { kindEntries })
		});
		expect(out).toEqual([]);
	});
	it('with no parser catalog yet, files a member by the predicted class of its rule shape', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: false }]]]),
			symbols: symbolsOf(rules)
		});
		expect(out[0]).toMatchObject({ code: 'display-union-mixed', details: { terminals: ['tok'], nonterminals: ['node'] } });
	});
	it("files a member by the parser catalog's terminal fact, not by its rule shape", () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'tok', literal: false }, { storage: 'node', literal: false }]]]),
			symbols: symbolsOf(rules, { kindEntries: [{ kind: 'tok' }, { kind: 'node' }] })
		});
		expect(out).toEqual([]);
	});
	it('files an inlined member by its body, since the parser substitutes it', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: '_word', literal: false }, { storage: 'node', literal: false }]]]),
			symbols: symbolsOf({ ...rules, _word: sym('tok') }, { inline: ['_word'], kindEntries })
		});
		expect(out[0]).toMatchObject({ code: 'display-union-mixed', details: { terminals: ['_word'], nonterminals: ['node'] } });
	});
	it('refuses a member that is neither a rule, an external nor a literal', () => {
		const out = diagnoseMixedDisplayUnions({
			grammar: 'demo',
			displayUnions: new Map([['shown', [{ storage: 'ghost', literal: false }]]]),
			symbols: symbolsOf(rules, { kindEntries })
		});
		expect(out.map((d) => [d.code, d.details])).toEqual([['display-union-unknown-member', { display: 'shown', member: 'ghost' }]]);
	});
});

describe('alias-inline-token', () => {
	const body = { type: 'IMMEDIATE_TOKEN', content: { type: 'PATTERN', value: 'x+' } };
	const other = { type: 'TOKEN', content: { type: 'PATTERN', value: 'y+' } };
	const inlineToken = (rules: Record<string, unknown>, word?: string) =>
		diagnoseInlineTokenAliases({ grammar: 'demo', symbols: symbolsOf(rules), word });

	it('names a display that is also a terminal rule', () => {
		const out = inlineToken({ p: alias(body, 'content'), content: P('z') });
		expect(out).toHaveLength(1);
		expect(out[0]).toMatchObject({ code: 'alias-inline-token', ownerKind: 'p', canProceed: false, details: { display: 'content', reason: 'display-is-rule' } });
		expect(out[0]!.message).toMatch(/'content' is also a rule of this grammar/);
	});
	it('names a display that is a nonterminal rule too, which display-union-mixed does not report', () => {
		const out = inlineToken({ p: alias(body, 'content'), content: { type: 'SEQ', members: [S('a'), sym('p')] } });
		expect(out).toHaveLength(1);
		expect(out[0]!.details).toMatchObject({ reason: 'display-is-rule' });
	});
	it('names a display of the word rule', () => {
		const out = inlineToken({ p: alias(body, 'content'), q: alias(sym('ident'), 'content'), ident: P('[a-z]+') }, 'ident');
		expect(out).toHaveLength(1);
		expect(out[0]!.details).toMatchObject({ reason: 'word-display' });
		expect(out[0]!.message).toMatch(/'content' is a display of the word rule/);
	});
	it('names a hidden name taken with a different body and proposes another name', () => {
		const out = inlineToken({ p: alias(body, 'content'), _content: P('y') });
		expect(out).toHaveLength(1);
		expect(out[0]!.details).toMatchObject({ reason: 'storage-name-taken' });
		expect(out[0]!.message).toMatch(/the rule '_content' already exists with a different body/);
		expect(out[0]!.proposal).toMatch(/_content_token/);
	});
	it('proposes one hidden rule per distinct body when the bodies disagree, each site aliasing its own', () => {
		const out = inlineToken({ p: alias(body, 'content'), q: alias(other, 'content') });
		expect(out.map((d) => d.details)).toMatchObject([{ reason: 'bodies-disagree', bodyCount: 2 }, { reason: 'bodies-disagree', bodyCount: 2 }]);
		expect(out[0]!.proposal).toMatch(/alias\(\$\._content_1, \$\.content\)/);
		expect(out[1]!.proposal).toMatch(/alias\(\$\._content_2, \$\.content\)/);
		expect(out[0]!.proposal).toMatch(/no site changes what it accepts/);
	});
	it('does not fire when the mint covers the site: free name, or an identical body already there', () => {
		expect(inlineToken({ p: alias(body, 'content') })).toEqual([]);
		expect(inlineToken({ p: alias(body, 'content'), _content: body })).toEqual([]);
	});
	it('fires on a bare pattern and through precedence', () => {
		expect(inlineToken({ p: alias(P('x'), 'c'), c: P('z') })).toHaveLength(1);
		expect(inlineToken({ p: alias({ type: 'PREC', value: 1, content: body }, 'c'), c: P('z') })).toHaveLength(1);
	});
	it('does not fire on an alias of a symbol or of a literal', () => {
		expect(inlineToken({ p: alias(sym('_c'), 'c'), _c: body })).toEqual([]);
		expect(inlineToken({ p: alias(S('x'), 'c') })).toEqual([]);
	});
	it('is silent on a literal alias whose display is a terminal rule or the word rule, which reads as the display kind', () => {
		expect(inlineToken({ p: alias(S('a'), 'content'), content: P('z') })).toEqual([]);
		expect(inlineToken({ p: alias(S('a'), 'content'), q: alias(sym('ident'), 'content'), ident: P('[a-z]+') }, 'ident')).toEqual([]);
	});
});
