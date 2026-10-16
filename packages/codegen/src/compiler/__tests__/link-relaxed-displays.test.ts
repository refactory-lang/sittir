import { describe, it, expect } from 'vitest';
import { link } from '../link.ts';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import type { GeneratedIdEntry, GeneratedIdTables } from '../../dsl/symbol-table.ts';

function makeRaw(rules: Record<string, Rule<'evaluate'>>, overrides?: Partial<RawGrammar>): RawGrammar {
	return {
		name: 'test',
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
		...overrides
	};
}

function anonEntry(id: number, text: string): GeneratedIdEntry {
	return { id, parser: { cSymbol: `anon_sym_${id}`, parserName: text, symbolName: text, literalText: text, anon: true, aux: false, alias: false, hidden: false } };
}
function aliasEntry(id: number, name: string): GeneratedIdEntry {
	return { id, parser: { cSymbol: `alias_sym_${id}`, parserName: name, symbolName: name, anon: false, aux: false, alias: false, hidden: false } };
}
const idTables: GeneratedIdTables = {
	kindIds: { for: anonEntry(5, 'for'), while: anonEntry(6, 'while'), property_name: aliasEntry(7, 'property_name'), statement_name: aliasEntry(8, 'statement_name') },
	sourceArtifact: 'test'
};

const alias = (value: string, content: Rule<'evaluate'>): Rule<'evaluate'> => ({ type: 'ALIAS', named: true, value, content }) as Rule<'evaluate'>;
const str = (value: string): Rule<'evaluate'> => ({ type: 'STRING', value }) as Rule<'evaluate'>;
const sym = (name: string): Rule<'evaluate'> => ({ type: 'SYMBOL', name }) as Rule<'evaluate'>;

function aliasValues(rule: Rule<'link'>): string[] {
	if (rule.type === 'ALIAS') return [rule.value];
	if ('members' in rule) return rule.members.flatMap(aliasValues);
	return [];
}

describe('link relaxation of word-display aliases', () => {
	it('keeps one arm per distinct display when keyword literals relax to the word', () => {
		const linked = link(
			makeRaw(
				{
					source: {
						type: 'CHOICE',
						members: [alias('property_name', str('for')), alias('statement_name', str('while'))]
					} as Rule<'evaluate'>,
					other: {
						type: 'CHOICE',
						members: [alias('property_name', sym('identifier')), alias('statement_name', sym('identifier'))]
					} as Rule<'evaluate'>,
					keywords: { type: 'CHOICE', members: [str('for'), str('while')] } as Rule<'evaluate'>,
					identifier: { type: 'PATTERN', value: '[a-z]+' } as Rule<'evaluate'>
				},
				{ word: 'identifier' }
			),
			{ generatedIdTables: idTables }
		);
		expect(aliasValues(linked.rules.source!).sort()).toEqual(['property_name', 'statement_name']);
	});
});
