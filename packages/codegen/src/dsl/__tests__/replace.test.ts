import { afterEach, describe, expect, it } from 'vitest';
import { evaluateTempGrammar } from '../../compiler/__tests__/_temp-grammar.ts';

const rules = "k: ($) => seq($.word, ',', $.word)";
const bare = 'k: ($) => $.word';
const ALIAS_OF_WORD = '{ type: "ALIAS", named: true, value: "shown", content: { type: "SYMBOL", name: "word" } }';

const membersOf = (grammar: { readonly rules: Readonly<Record<string, unknown>> }): readonly unknown[] =>
	(grammar.rules.k as { readonly members: readonly unknown[] }).members;

const withoutIds = (rule: unknown): unknown =>
	Array.isArray(rule)
		? rule.map(withoutIds)
		: rule !== null && typeof rule === 'object'
			? Object.fromEntries(Object.entries(rule).flatMap(([key, value]) => (key === 'id' ? [] : [[key, withoutIds(value)]])))
			: rule;

afterEach(() => {
	Reflect.deleteProperty(globalThis, '__seen');
});

describe('a rule entry replaces its member', () => {
	it('replaces a member with a literal value, as the literal patch always has', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { k: { '1': ';' } }" });
		expect(membersOf(raw)[1]).toEqual({ type: 'STRING', value: ';', id: 'rule:k:members.1' });
		expect(membersOf(raw)[0]).toEqual(membersOf(base)[0]);
		expect(membersOf(raw)[2]).toEqual(membersOf(base)[2]);
		expect(raw.patchSites).toEqual([{ ownerKind: 'k', path: '1', form: 'literal' }]);
		expect(raw.bindingEffects).toEqual([]);
	}, 60_000);

	it('an ALIAS rule over a bare symbol replaces it as written, and records no alias effect', async () => {
		const raw = await evaluateTempGrammar({ extras: '', rules: bare }, '', { bindings: `edits: { k: { '.': ${ALIAS_OF_WORD} } }` });
		expect(raw.rules.k).toEqual({
			type: 'ALIAS',
			named: true,
			value: 'shown',
			content: { type: 'SYMBOL', name: 'word', id: 'rule:k:content' },
			id: 'rule:k:root'
		});
		expect(raw.patchSites).toEqual([{ ownerKind: 'k', path: '.', form: 'literal' }]);
		expect(raw.bindingEffects).toEqual([]);
	}, 60_000);

	it('an ALIAS rule over a fielded member replaces the field, and records no alias effect', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: `edits: { k: { '0': ${ALIAS_OF_WORD} } }` });
		expect(membersOf(raw)[0]).toEqual({
			type: 'ALIAS',
			named: true,
			value: 'shown',
			content: { type: 'SYMBOL', name: 'word', id: 'rule:k:members.0/content' },
			id: 'rule:k:members.0'
		});
		expect(membersOf(raw)[2]).toEqual(membersOf(base)[2]);
		expect(raw.patchSites).toEqual([{ ownerKind: 'k', path: '0', form: 'literal' }]);
		expect(raw.bindingEffects).toEqual([]);
	}, 60_000);
});

describe('a function entry receives the member and the layer symbols', () => {
	it('replaces the member with the rule the function returns for it, which receives the member', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "edits: { k: { '0': ($, member) => (globalThis.__seen = member, seq(member, ';')) } }"
		});
		expect(withoutIds((globalThis as { __seen?: unknown }).__seen)).toEqual(withoutIds(membersOf(base)[0]));
		expect(withoutIds(membersOf(raw)[0])).toEqual({ type: 'SEQ', members: [withoutIds(membersOf(base)[0]), { type: 'STRING', value: ';' }] });
	}, 60_000);

	it('lets the function use the layer symbols, so a member can be replaced by a choice over a rule', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const raw = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "edits: { k: { '0': ($, member) => choice(member, $.word) } }"
		});
		expect(withoutIds(membersOf(raw)[0])).toMatchObject({ type: 'CHOICE', members: [withoutIds(membersOf(base)[0]), { type: 'SYMBOL', name: 'word' }] });
	}, 60_000);
});

describe('replace() inline records what the replacing entry records', () => {
	it('gives a literal replacement the same body, patch sites and binding effects as the entry', async () => {
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "rules: { k: ($, previous) => replace(previous, '1', ';') }" });
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: "edits: { k: { '1': ';' } }" });
		expect(inline.rules.k).toEqual(keyed.rules.k);
		expect(inline.patchSites).toEqual(keyed.patchSites);
		expect(inline.bindingEffects).toEqual(keyed.bindingEffects);
	}, 60_000);

	it('gives a function replacement the same body, patch sites and binding effects as the entry, and hands it the member', async () => {
		const base = await evaluateTempGrammar({ extras: '', rules }, '', { bindings: '' });
		const inline = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "rules: { k: ($, previous) => replace(previous, '0', ($, member) => (globalThis.__seen = member, seq(member, ';'))) }"
		});
		expect(withoutIds((globalThis as { __seen?: unknown }).__seen)).toEqual(withoutIds(membersOf(base)[0]));
		Reflect.deleteProperty(globalThis, '__seen');
		const keyed = await evaluateTempGrammar({ extras: '', rules }, '', {
			bindings: "edits: { k: { '0': ($, member) => seq(member, ';') } }"
		});
		expect(inline.rules.k).toEqual(keyed.rules.k);
		expect(inline.patchSites).toEqual(keyed.patchSites);
		expect(inline.bindingEffects).toEqual(keyed.bindingEffects);
	}, 60_000);
});
