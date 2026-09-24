import { PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';

function raw(rules: Record<string, Rule<'evaluate'>>, externals: string[]): RawGrammar {
	return {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals,
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

const body: Rule<'evaluate'> = { type: PATTERN, value: '[^]*' };

function contentOf(linked: ReturnType<typeof link>) {
	const members = (linked.rules['root'] as { members: Rule<'link'>[] }).members;
	return members[members.length - 1]!;
}

describe('link inlines a hidden reference to its body', () => {
	it('splices the body of a hidden rule', () => {
		expect(contentOf(link(raw({ root, _content: body }, [])))).toMatchObject({ type: PATTERN });
	});

	it('keeps the symbol when the hidden rule is an external that carries a body', () => {
		expect(contentOf(link(raw({ root, _content: body }, ['_content'])))).toMatchObject({ type: SYMBOL, name: '_content' });
	});
});
