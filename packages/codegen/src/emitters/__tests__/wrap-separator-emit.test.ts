/**
 * PR-T Task 3 — wrap.ts derives per-instance trailing/leading/separator-kind
 * facts for repeated slots whose separator is rule-shaped (`separatorSource`).
 */
import { CHOICE, PATTERN, SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { AssembledBranch, AssembledNonterminal, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { deleteWrapper } from '../../compiler/wrapper-deletion.ts';

const kindEntries: KindEnumEntry[] = [
	{ kind: 'object_type', member: 'ObjectType', id: 1 },
	{ kind: 'identifier', member: 'Identifier', id: 2 },
	{ kind: 'comma', member: 'Comma', id: 3, symbolName: ',', anon: true },
	{ kind: 'semicolon', member: 'Semicolon', id: 4, symbolName: ';', anon: true }
];

function makeSeparatorNodeMap() {
	const dummyRule: SeqRule<'link'> = { type: SEQ, members: [] };
	const membersField = new AssembledNonterminal({
		values: [
			{
				node: { kind: 'unresolved-ref', name: 'identifier' },
				parseKind: { kind: 'unresolved-ref', name: 'identifier' },
				multiplicity: 'array'
			}
		],
		fieldName: 'members',
		hasTrailing: false,
		hasLeading: false,
		separatorSource: {
			rule: {
				type: CHOICE,
				members: [
					{ type: STRING, value: ',' },
					{ type: STRING, value: ';' }
				]
			},
			trailingPermitted: false,
			leadingPermitted: false
		},
		sourceRuleIds: []
	});
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'object_type',
		new AssembledBranch('object_type', dummyRule, deleteWrapper(dummyRule), deleteWrapper(dummyRule), {
			slotRecord: { members: membersField }
		})
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	return makeNodeMapWith(nodes);
}

describe('wrap emitter — separatorSource per-instance facts (PR-T Task 3)', () => {
	it('emits trailing/leading/separator-kind sibling fields for a rule-shaped separator', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeSeparatorNodeMap(), kindEntries });

		expect(wrapSrc).toContain(
			"_members_trailing_sep: _detectFlankSeparator(data.$other, [TSKindId.Comma, TSKindId.Semicolon], "
		);
		expect(wrapSrc).toContain("'trailing', data.$span),");
		expect(wrapSrc).toContain(
			"_members_leading_sep: _detectFlankSeparator(data.$other, [TSKindId.Comma, TSKindId.Semicolon], "
		);
		expect(wrapSrc).toContain("'leading', data.$span),");
		expect(wrapSrc).toContain(
			'_members_separator_kind: _findSeparatorKind(data.$other, [TSKindId.Comma, TSKindId.Semicolon]),'
		);
	});

	it('emits the _detectFlankSeparator and _findSeparatorKind runtime helpers', () => {
		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap: makeSeparatorNodeMap(), kindEntries });

		expect(wrapSrc).toContain('function _detectFlankSeparator(');
		expect(wrapSrc).toContain('function _findSeparatorKind(');
	});

	it('does not emit separator sibling fields for a field without separatorSource', () => {
		const dummyRule: SeqRule<'link'> = { type: SEQ, members: [] };
		const membersField = new AssembledNonterminal({
			values: [
				{
					node: { kind: 'unresolved-ref', name: 'identifier' },
					parseKind: { kind: 'unresolved-ref', name: 'identifier' },
					multiplicity: 'array'
				}
			],
			fieldName: 'members',
			hasTrailing: false,
			hasLeading: false,
			sourceRuleIds: []
		});
		const nodes = new Map<string, AssembledNode>();
		nodes.set(
			'object_type',
			new AssembledBranch('object_type', dummyRule, deleteWrapper(dummyRule), deleteWrapper(dummyRule), {
				slotRecord: { members: membersField }
			})
		);
		nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
		const nodeMap = makeNodeMapWith(nodes);

		const wrapSrc = emitWrap({ grammar: 'synth', nodeMap, kindEntries });

		expect(wrapSrc).not.toContain('_trailing_sep');
		expect(wrapSrc).not.toContain('_leading_sep');
		expect(wrapSrc).not.toContain('_separator_kind');
	});
});
