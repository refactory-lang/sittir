import { PATTERN, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';
import { linkPredicted } from '../../__tests__/helpers/linked.ts';

function raw(rules: Record<string, Rule<'evaluate'>>, externals: string[]): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: externals.map((name) => ({ type: SYMBOL, name })),
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: []
	};
}

const root: Rule<'evaluate'> = {
	type: SEQ,
	members: [
		{ type: STRING, value: 'r' },
		{ type: SYMBOL, name: '_content', inline: true }	]
};

const body: Rule<'evaluate'> = { type: SEQ, members: [{ type: STRING, value: '<' }, { type: PATTERN, value: '[^>]*' }] };

const externalContent = raw(
	{
		root: { type: SEQ, members: [{ type: SYMBOL, name: 'word' }, { type: SYMBOL, name: '_content', inline: true }] },
		word: { type: PATTERN, value: '[a-z]+' },
		_content: { type: TOKEN, content: body }
	},
	['_content']
);

function contentOf(linked: ReturnType<typeof link>) {
	const members = (linked.rules['root'] as { members: Rule<'link'>[] }).members;
	return members[members.length - 1]!;
}

describe('link inlines a hidden reference to its body', () => {
	it('splices the body of a hidden rule', () => {
		expect(contentOf(linkPredicted(raw({ root, _content: body }, [])))).toMatchObject({ type: SEQ });
	});

	it('records the name of every rule it splices', () => {
		expect(linkPredicted(raw({ root, _content: body }, [])).splicedNames).toEqual(new Set(['_content']));
		expect(linkPredicted(externalContent).splicedNames).toEqual(new Set());
	});

	it('keeps the symbol when the hidden rule is an external that carries a body', () => {
		expect(contentOf(linkPredicted(externalContent))).toMatchObject({ type: SYMBOL, name: '_content' });
	});
});
