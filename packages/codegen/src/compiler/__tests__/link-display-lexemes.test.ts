import { describe, it, expect } from 'vitest';
import { link } from '../link.ts';
import type { Rule } from '../../types/rule.ts';
import type { RawGrammar } from '../types.ts';
import type { GeneratedIdEntry, GeneratedIdTables } from '../../dsl/symbol-table.ts';

const makeRaw = (rules: Record<string, Rule<'evaluate'>>): RawGrammar => ({
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
	references: []
});

const anon = (id: number, text: string): GeneratedIdEntry => ({
	id,
	parser: { cSymbol: `anon_sym_${id}`, parserName: text, symbolName: text, literalText: text, anon: true, aux: false, alias: false, hidden: false }
});
const named = (id: number, name: string): GeneratedIdEntry => ({
	id,
	parser: { cSymbol: `sym_${id}`, parserName: name, symbolName: name, anon: false, aux: false, alias: false, hidden: false }
});
const idTables: GeneratedIdTables = {
	fieldIds: new Map(),
	folds: new Map(),
	kindIds: { '-': anon(5, '-'), a: anon(6, 'a'), this: anon(7, 'this'), async: anon(8, 'async'), abstract: anon(9, 'abstract'), letter: named(10, 'letter'), modifier: named(11, 'modifier') },
	sourceArtifact: 'test'
};

const alias = (value: string, content: Rule<'evaluate'>): Rule<'evaluate'> => ({ type: 'ALIAS', named: true, value, content }) as Rule<'evaluate'>;
const str = (value: string): Rule<'evaluate'> => ({ type: 'STRING', value }) as Rule<'evaluate'>;
const sym = (name: string): Rule<'evaluate'> => ({ type: 'SYMBOL', name }) as Rule<'evaluate'>;
const choice = (...members: Rule<'evaluate'>[]): Rule<'evaluate'> => ({ type: 'CHOICE', members }) as Rule<'evaluate'>;
const prec = (content: Rule<'evaluate'>): Rule<'evaluate'> => ({ type: 'PREC_RIGHT', value: 0, content }) as Rule<'evaluate'>;

const patternDisplay = (letter: string) =>
	link(
		makeRaw({
			source: choice(sym('letter'), alias('letter', str('-')), alias('letter', str('a'))),
			letter: { type: 'PATTERN', value: letter } as Rule<'evaluate'>
		}),
		{ generatedIdTables: idTables }
	);

const keywordDisplay = () =>
	link(
		makeRaw({
			source: choice(sym('modifier'), alias('modifier', str('this')), alias('modifier', str('async'))),
			modifier: prec(choice(str('abstract'), str('async')))
		}),
		{ generatedIdTables: idTables }
	);

describe('the literals of a display that its own body lexes are stamped as its lexemes', () => {
	it('stamps a literal its pattern matches, and only that one', () => {
		expect(patternDisplay('[a-z]').displayLexemes?.get('letter')).toEqual(['a']);
	});

	it('stamps every literal when the pattern matches them all', () => {
		expect(patternDisplay('[a-z\\-]').displayLexemes?.get('letter')).toEqual(['-', 'a']);
	});

	it('stamps a literal that is one of the body’s own keywords, through a precedence wrapper', () => {
		expect(keywordDisplay().displayLexemes?.get('modifier')).toEqual(['async']);
	});

	it('stamps the literals’ own ids as wire ids of the display', () => {
		expect(patternDisplay('[a-z]').terminalAliasWireIds?.get('letter')).toEqual(expect.arrayContaining([5, 6]));
	});
});
