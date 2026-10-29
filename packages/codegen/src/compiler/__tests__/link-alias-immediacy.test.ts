import { ALIAS, REPEAT, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';

const quoted = (close: Rule<'evaluate'>): Rule<'evaluate'> => ({
	type: SEQ,
	members: [{ type: STRING, value: '"' }, { type: REPEAT, content: { type: SYMBOL, name: 'content' } }, { type: ALIAS, content: close, named: false, value: '"' }]
});

function raw(close: Rule<'evaluate'>, renderAs?: Record<string, Rule<'evaluate'>>): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules: { text: quoted(close) },
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

	it('is plain text when nothing declares the aliased external immediate', () => {
		expect(closeOf(raw({ type: SYMBOL, name: 'close' }))).toMatchObject({ type: STRING, value: '"' });
	});
});
