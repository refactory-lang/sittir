import { CHOICE, FIELD, PATTERN, SEQ, STRING, SUPERTYPE, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import { link } from '../link.ts';

function raw(rules: Record<string, Rule<'evaluate'>>, supertypes: string[] = []): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules,
		ruleCatalog: { byId: new Map(), rootsByKind: new Map(), classificationById: new Map() },
		evaluateSynthesized: new Set<string>(),
		extras: [],
		externals: [],
		supertypes,
		factoryInline: [],
		inline: [],
		conflicts: [],
		precedences: [],
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

function rootOf(name: string): Rule<'evaluate'> {
	return {
		type: SEQ,
		members: [
			{ type: STRING, value: 'r' },
			{ type: SYMBOL, name }
		]
	};
}

describe('link keeps the hoisted annotation on the rule', () => {
	it('collects a rule that carries the hoisted annotation', () => {
		const linked = link(raw({ root: rootOf('g'), g: { ...fielded, annotations: { hoisted: true } } }));

		expect(linked.rules['g']?.annotations?.hoisted).toBe(true);
	});

	it('does not hoist a hidden sequence for carrying a field', () => {
		const linked = link(raw({ root: rootOf('_g'), _g: fielded }));

		expect(linked.rules['_g']?.annotations?.hoisted).toBeUndefined();
	});

	it('classifies a hoisted rule the parser declares a supertype as a supertype: it has no node to seat', () => {
		const arms: Rule<'evaluate'> = {
			type: CHOICE,
			members: [
				{ type: SYMBOL, name: 'g_from' },
				{ type: SYMBOL, name: 'g_declaration' }
			],
			annotations: { hoisted: true }
		};
		const linked = link(
			raw(
				{
					root: rootOf('g'),
					g: arms,
					g_from: { type: SEQ, members: [{ type: STRING, value: 'from' }, { type: FIELD, name: 'x', content: { type: PATTERN, value: '[a-z]+' } }] },
					g_declaration: { type: SEQ, members: [{ type: STRING, value: 'decl' }, { type: FIELD, name: 'y', content: { type: PATTERN, value: '[a-z]+' } }] }
				},
				['g']
			),
			{
				generatedIdTables: {
					sourceArtifact: 'test',
					kindIds: {
						g: {
							id: 3,
							parser: { cSymbol: 'sym_g', parserName: 'g', anon: false, aux: false, alias: false, hidden: true, supertype: true }
						}
					}
				}
			}
		);

		expect(linked.rules['g']?.type).toBe(SUPERTYPE);
	});
});
