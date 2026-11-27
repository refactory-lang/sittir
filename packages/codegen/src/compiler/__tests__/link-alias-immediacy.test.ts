import { ALIAS, IMMEDIATE_TOKEN, REPEAT, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Rule, RuleId } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';

const quoted = (close: Rule<'evaluate'>): Rule<'evaluate'> => ({
	type: SEQ,
	members: [{ type: STRING, value: '"' }, { type: REPEAT, content: { type: SYMBOL, name: 'content' } }, { type: ALIAS, content: close, named: false, value: '"' }]
});

function raw(close: Rule<'evaluate'>, renderAs?: Record<string, Rule<'evaluate'>>, rules: Record<string, Rule<'evaluate'>> = {}): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules: { text: quoted(close), ...rules },
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [{ type: SYMBOL, name: 'content' }, { type: SYMBOL, name: 'close' }],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		...(renderAs === undefined ? {} : { renderAs })
	};
}

const closeOf = (grammar: RawGrammar): Rule<'link'> => (linkPredicted(grammar).rules['text'] as { members: Rule<'link'>[] }).members.at(-1)!;
const immediateQuote: Rule<'evaluate'> = { type: TOKEN, immediate: true, content: { type: STRING, value: '"' } } as Rule<'evaluate'>;

describe('an anonymous alias of an immediate token', () => {
	it('stays immediate when renderAs declares the aliased external immediate', () => {
		expect(closeOf(raw({ type: SYMBOL, name: 'close' }, { close: immediateQuote }))).toMatchObject({ type: TOKEN, immediate: true, content: { type: STRING, value: '"' } });
	});

	it('stays immediate when its content is an immediate token', () => {
		expect(closeOf(raw(immediateQuote))).toMatchObject({ type: TOKEN, immediate: true, content: { type: STRING, value: '"' } });
	});

	it("stays immediate when the aliased rule is tree-sitter's IMMEDIATE_TOKEN", () => {
		const rules = { quote: { type: IMMEDIATE_TOKEN, content: { type: STRING, value: '"' } } as Rule<'evaluate'> };
		expect(closeOf(raw({ type: SYMBOL, name: 'quote' }, undefined, rules))).toMatchObject({ type: TOKEN, immediate: true, content: { type: STRING, value: '"' } });
	});

	it('is plain text when nothing declares the aliased external immediate', () => {
		expect(closeOf(raw({ type: SYMBOL, name: 'close' }))).toMatchObject({ type: STRING, value: '"' });
	});
});

describe('an anonymous alias lowered to its literal', () => {
	const aliasId = 'rule:text:members.1' as RuleId;
	const contentId = 'rule:text:members.1/content' as RuleId;
	const text = (close: Rule<'evaluate'>): Record<string, Rule<'evaluate'>> => ({
		text: { type: SEQ, members: [{ type: STRING, value: '"' }, { type: ALIAS, content: close, named: false, value: '"', id: aliasId } as Rule<'evaluate'>] }
	});

	it('keeps the alias id on the immediate token and absorbs the content id', () => {
		const close = { ...immediateQuote, id: contentId } as Rule<'evaluate'>;
		expect(closeOf(raw(close, undefined, text(close)))).toMatchObject({ type: TOKEN, immediate: true, id: aliasId, absorbedIds: [contentId] });
	});

	it('keeps the alias id on the plain literal and absorbs the content id', () => {
		const close = { type: SYMBOL, name: 'close', id: contentId } as Rule<'evaluate'>;
		expect(closeOf(raw(close, undefined, text(close)))).toMatchObject({ type: STRING, value: '"', id: aliasId, absorbedIds: [contentId] });
	});
});
