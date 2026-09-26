import { CHOICE, FIELD, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { AssembledBranch, AssembledEnum, AssembledKeyword, AssembledSupertype } from '../../compiler/model/node-map.ts';
import type { AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { scalarLeafKinds } from '../shared.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

/**
 * A JavaScript boolean resolves to the grammar's own true/false kind id,
 * found in the model: the enum of the two texts (rust `boolean_literal`),
 * or the two keyword kinds carrying them (typescript, python's `True`).
 * The leaf registry never carries an enum, so a registry lookup by name
 * left a bare boolean unresolved (docs/factory-surface-issues.md, L8).
 */
const slotRule: SeqRule<'link'> = {
	type: SEQ,
	members: [{ type: FIELD, name: 'value', content: { type: SYMBOL, name: '_expression' } }]
};

describe('a boolean resolves to the enum member of the two texts', () => {
	const entries: KindEnumEntry[] = [
		{
			id: 1,
			lexicalRank: 1,
			kind: 'true_keyword',
			member: 'TrueKeyword',
			symbolName: 'boolean_literal',
			literalText: 'true',
			anon: true
		},
		{
			id: 2,
			lexicalRank: 2,
			kind: 'false_keyword',
			member: 'FalseKeyword',
			symbolName: 'boolean_literal',
			literalText: 'false',
			anon: true
		},
		{ id: 3, lexicalRank: 3, kind: 'boolean_literal', member: 'BooleanLiteral' },
		{ id: 4, lexicalRank: 4, kind: 'let_declaration', member: 'LetDeclaration' }
	];
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'boolean_literal',
		new AssembledEnum(
			'boolean_literal',
			{
				type: CHOICE,
				members: [
					{ type: STRING, value: 'true' },
					{ type: STRING, value: 'false' }
				]
			},
			{ kindEntries: entries }
		)
	);
	nodes.set(
		'_expression',
		new AssembledSupertype('_expression', { type: CHOICE, members: [{ type: SYMBOL, name: 'boolean_literal' }] }, [
			{ name: 'boolean_literal' }
		])
	);
	nodes.set('let_declaration', new AssembledBranch('let_declaration', flatten(slotRule), flatten(slotRule)));
	const nodeMap = makeNodeMapWith(nodes);

	it('names the two member kinds, for the resolver and the scalar type map alike', () => {
		expect(scalarLeafKinds(nodeMap).boolean).toEqual({
			trueKind: 'true_keyword',
			falseKind: 'false_keyword'
		});
	});

	it('emits the member ids, never a registry lookup', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, kindEntries: entries });
		expect(emitted).toContain('if (typeof v === "boolean") return v ? TSKindId.TrueKeyword : TSKindId.FalseKeyword;');
		expect(emitted).not.toContain('_leafRegistry["boolean_literal"]');
	});
});

describe('a boolean resolves to the keyword kinds of the two texts, whatever their case', () => {
	const entries: KindEnumEntry[] = [
		{ id: 1, lexicalRank: 1, kind: 'true', member: 'True', symbolName: 'true', literalText: 'True', anon: true },
		{ id: 2, lexicalRank: 2, kind: 'false', member: 'False', symbolName: 'false', literalText: 'False', anon: true },
		{ id: 3, lexicalRank: 3, kind: 'let_declaration', member: 'LetDeclaration' }
	];
	const nodes = new Map<string, AssembledNode>();
	nodes.set('true', new AssembledKeyword('true', { type: STRING, value: 'True' }, { kindEntries: entries }));
	nodes.set('false', new AssembledKeyword('false', { type: STRING, value: 'False' }, { kindEntries: entries }));
	nodes.set(
		'_expression',
		new AssembledSupertype(
			'_expression',
			{
				type: CHOICE,
				members: [
					{ type: SYMBOL, name: 'true' },
					{ type: SYMBOL, name: 'false' }
				]
			},
			[{ name: 'true' }, { name: 'false' }]
		)
	);
	nodes.set('let_declaration', new AssembledBranch('let_declaration', flatten(slotRule), flatten(slotRule)));
	const nodeMap = makeNodeMapWith(nodes);

	it('names the two keyword kinds, for the resolver and the scalar type map alike', () => {
		expect(scalarLeafKinds(nodeMap).boolean).toEqual({
			trueKind: 'true',
			falseKind: 'false'
		});
	});

	it('emits the keyword ids', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, kindEntries: entries });
		expect(emitted).toContain('if (typeof v === "boolean") return v ? TSKindId.True : TSKindId.False;');
	});
});
