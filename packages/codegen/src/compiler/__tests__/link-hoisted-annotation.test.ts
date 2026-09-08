import { FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';

function raw(rules: Record<string, Rule<'evaluate'>>): RawGrammar {
	return {
		name: 'synth',
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		word: null,
		references: []
	};
}

const fielded: Rule<'evaluate'> = {
	type: SEQ,
	members: [
		{ type: STRING, value: '(' },
		{ type: FIELD, name: 'x', content: { type: PATTERN, value: '[a-z]+' } }
	]
};

const root: Rule<'evaluate'> = {
	type: SEQ,
	members: [
		{ type: STRING, value: 'r' },
		{ type: SYMBOL, name: '_g' }
	]
};

describe('link hoistedKinds', () => {
	it('collects a hidden rule that carries the hoisted annotation', () => {
		const linked = link(raw({ root, _g: { ...fielded, annotations: { hoisted: true } } }));

		expect([...(linked.hoistedKinds ?? [])]).toEqual(['_g']);
	});

	it('does not hoist a hidden sequence for carrying a field', () => {
		const linked = link(raw({ root, _g: fielded }));

		expect([...(linked.hoistedKinds ?? [])]).toEqual([]);
	});
});
