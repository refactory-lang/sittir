import { describe, expect, it } from 'vitest';
import { readOptionsBlock } from '../options-block.ts';
import { preference } from '../../primitives/preference.ts';
import { indentUnitOf } from '../../../compiler/model/whitespace-arms.ts';
import { AssembledKeyword, AssembledSupertype } from '../../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../../compiler/model/node-map.ts';
import { makeNodeMapWith } from '../../../__tests__/helpers/node-map-fixtures.ts';
import { CHOICE, STRING, SYMBOL } from '../../../types/rule-types.ts'; // @rule-type-consts

const kinds = new Set(['body']);

function whitespaceMap() {
	const nodes = new Map<string, AssembledNode>([
		['_space', new AssembledKeyword('_space', { type: STRING, value: ' ' })],
		['_tab', new AssembledKeyword('_tab', { type: STRING, value: '\t' })],
		[
			'_whitespace',
			new AssembledSupertype(
				'_whitespace',
				{ type: CHOICE, members: [{ type: SYMBOL, name: '_space' }, { type: SYMBOL, name: '_tab' }] },
				[{ name: '_space' }, { name: '_tab' }]
			)
		]
	]);
	return makeNodeMapWith(nodes);
}

describe('readOptionsBlock indent', () => {
	it('returns the declared unit and does not read it as a kind', () => {
		const read = readOptionsBlock({ indent: preference('  '), body: { before: preference('indent') } }, kinds);
		expect(read.indent).toBe('  ');
		expect(read.declarations.map((d) => d.path)).toEqual(['body/before']);
	});

	it('is undefined when the block declares none', () => {
		expect(readOptionsBlock({ body: { before: preference('indent') } }, kinds).indent).toBeUndefined();
	});

	it('takes only preference(unit)', () => {
		expect(() => readOptionsBlock({ indent: '  ' }, kinds)).toThrow("options: 'indent' takes preference(unit)");
	});
});

describe('indentUnitOf', () => {
	it('accepts a unit made of the admitted indent characters', () => {
		expect(indentUnitOf(whitespaceMap(), '  ', 'typescript')).toBe('  ');
		expect(indentUnitOf(whitespaceMap(), '\t', 'typescript')).toBe('\t');
	});

	it('throws naming the grammar when indent characters exist and none is declared', () => {
		expect(() => indentUnitOf(whitespaceMap(), undefined, 'typescript')).toThrow(/typescript admits indent characters .* declares no indent/);
	});

	it('rejects an empty unit and one with characters outside the admitted set', () => {
		expect(() => indentUnitOf(whitespaceMap(), '', 'typescript')).toThrow(/typescript indent "" is not one or more of/);
		expect(() => indentUnitOf(whitespaceMap(), ' x', 'typescript')).toThrow(/typescript indent " x" is not one or more of/);
	});

	it('refuses a declaration on a grammar whose whitespace admits no indent characters', () => {
		expect(() => indentUnitOf(makeNodeMapWith(new Map()), '  ', 'regex')).toThrow(/regex declares indent "  " but its whitespace admits no indent characters/);
		expect(indentUnitOf(makeNodeMapWith(new Map()), undefined, 'regex')).toBe('');
	});
});
