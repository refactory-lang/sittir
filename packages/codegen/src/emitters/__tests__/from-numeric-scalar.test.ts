import { stripTypeScriptTypes } from 'node:module';
import { CHOICE, FIELD, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { numberRefusal } from '@sittir/common/utils';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { AssembledBranch, AssembledPattern, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { kindIdTablesOf, makeNodeMapWith, withIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

const slotRule: SeqRule<'link'> = {
	type: SEQ,
	members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: '_expression' } }]
};

const entries: KindEnumEntry[] = [
	{ id: 1, lexicalRank: 1, kind: 'number', member: 'Number' },
	{ id: 2, lexicalRank: 2, kind: 'let_declaration', member: 'LetDeclaration' }
];

type ScalarResolver = (v: number | bigint) => unknown;

function scalarResolver(numberPattern: string): ScalarResolver {
	const { nodeMap, generatedIdTables } = withIdTables((kindEntries) => {
		const nodes = new Map<string, AssembledNode>();
		nodes.set('number', new AssembledPattern('number', { type: PATTERN, value: numberPattern }, { kindEntries, factoryName: 'number' }));
		nodes.set(
			'_expression',
			new AssembledSupertype('_expression', { type: CHOICE, members: [{ type: SYMBOL, name: 'number' }] }, [{ name: 'number' }], { kindEntries })
		);
		nodes.set('let_declaration', new AssembledBranch('let_declaration', flatten(slotRule), flatten(slotRule), { kindEntries }));
		return makeNodeMapWith(nodes);
	}, kindIdTablesOf(entries));
	const emitted = emitFrom({ grammar: 'synth', nodeMap, generatedIdTables });
	const start = emitted.indexOf('function _resolveScalar(');
	const source = emitted.slice(start, emitted.indexOf('\n}\n', start) + 2);
	const registry = { number: { pattern: new RegExp(`^(?:${numberPattern})$`, 'u'), factory: (text: string) => ({ text }) } };
	return new Function('_leafRegistry', 'numberRefusal', `${stripTypeScriptTypes(source)}\nreturn _resolveScalar;`)(registry, numberRefusal) as ScalarResolver;
}

describe('a number resolves to the numeric leaf whose guard spells it', () => {
	it('refuses a negative number when the leaf rejects a sign', () => {
		const resolve = scalarResolver('[0-9]+');
		expect(resolve(1)).toEqual({ text: '1' });
		expect(() => resolve(-1)).toThrow(/-1: a negative number is a unary minus applied to a positive literal/);
	});

	it('builds a negative number as the leaf when the leaf spells a sign', () => {
		const resolve = scalarResolver('-?[0-9]+');
		expect(resolve(-1)).toEqual({ text: '-1' });
		expect(resolve(-1n)).toEqual({ text: '-1' });
		expect(() => resolve(-(2 ** 53))).toThrow(/pass it as a bigint/);
	});

	it('builds a negative float that one of the guard forms spells with a sign', () => {
		const resolve = scalarResolver('\\d+\\.\\d+|-?\\d+[eE][+-]?\\d+');
		expect(resolve(-1e21)).toEqual({ text: '-1e+21' });
		expect(() => resolve(-1.5)).toThrow(/-1.5: a negative number is a unary minus applied to a positive literal/);
	});

	it('builds a negative number that a signed float form beside an integer run spells', () => {
		const resolve = scalarResolver('[0-9]+|-?[0-9]+\\.[0-9]+');
		expect(resolve(-1.5)).toEqual({ text: '-1.5' });
		expect(() => resolve(-1)).toThrow(/-1: a negative number is a unary minus applied to a positive literal/);
	});
});
