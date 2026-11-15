import { describe, expect, it } from 'vitest';
import { CHOICE, FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts
import type { Rule } from '../../../types/rule.ts';
import type { RawGrammar, RefineForm } from '../../types.ts';
import { assemblePredicted } from '../../../__tests__/helpers/linked.ts';
import { subFactoriesOf } from '../sub-factories.ts';

const label = (variantOf: string, variant: string) => ({ annotations: { variant, variantOf } });

function rawWith(rules: Record<string, Rule<'evaluate'>>, refined: string, forms: RefineForm[]): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes: [],
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
		word: null,
		references: [],
		refineForms: new Map([[refined, forms]])
	};
}

const BRACES: RefineForm[] = [
	{ name: 'curly', selections: { 'opening:': '{' } },
	{ name: 'flow', selections: { 'opening:': '{|' } }
];

function armedRules(): Record<string, Rule<'evaluate'>> {
	return {
		holder: {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'opening', content: { type: CHOICE, members: [{ type: STRING, value: '{' }, { type: STRING, value: '{|' }] } },
				{
					type: FIELD,
					name: 'body',
					content: {
						type: CHOICE,
						members: [
							{ type: SYMBOL, name: 'leaf_a', ...label('holder', 'a') },
							{ type: SYMBOL, name: 'leaf_b', ...label('holder', 'b') }
						]
					}
				}
			]
		},
		leaf_a: { type: PATTERN, value: '[a-z]+' },
		leaf_b: { type: PATTERN, value: '[0-9]+' }
	};
}

describe('a kind with refine() forms keeps its value routes', () => {
	it('derives the routes of its choice arms beside the forms', () => {
		const { nodeMap } = assemblePredicted(rawWith(armedRules(), 'holder', BRACES));
		const plain = assemblePredicted({ ...rawWith(armedRules(), 'holder', BRACES), refineForms: undefined });
		const names = (map: typeof nodeMap): string[] => subFactoriesOf(map.nodes.get('holder')!, map).entries.map((entry) => entry.name);
		expect(names(plain.nodeMap)).toEqual(['a', 'b']);
		expect(names(nodeMap)).toEqual(['a', 'b']);
	});
});
