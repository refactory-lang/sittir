import { describe, expect, it } from 'vitest';
import { FIELD, PATTERN, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { RawGrammar } from '../../compiler/types.ts';
import { assemblePredicted, rawIdTablesOf, withFixtureLexicalRanks } from '../../__tests__/helpers/linked.ts';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';

function rawOf(): RawGrammar {
	return {
		name: 'synth',
		fileTypes: [],
		rules: {
			source: { type: SEQ, members: [{ type: STRING, value: 'let' }, { type: FIELD, name: 'name', content: { type: SYMBOL, name: 'identifier' } }] },
			identifier: { type: PATTERN, value: '[a-z]+' }
		},
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
		references: []
	};
}

describe('from() orders text kinds by the parser lexical rank alone', () => {
	it('refuses predicted tables, which carry no lexical rank', () => {
		const { nodeMap, generatedIdTables } = assemblePredicted(rawOf());
		expect(() => emitFrom({ grammar: 'synth', nodeMap, generatedIdTables })).toThrow(/from: text kind '\w+' has no lexical rank in the catalog/);
	});

	it('emits from the same tables once a rank is present', () => {
		const { nodeMap, generatedIdTables } = assemblePredicted(rawOf(), withFixtureLexicalRanks(rawIdTablesOf(rawOf())));
		expect(() => emitFrom({ grammar: 'synth', nodeMap, generatedIdTables })).not.toThrow();
	});
});
