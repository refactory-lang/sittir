import { CHOICE, FIELD, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { AssembledBranch, AssembledKeyword, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { emitWrap } from '../../__tests__/helpers/emit-wrap.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';
import type { KindEnumEntry } from '../kind-discriminant.ts';

const KIND_ENTRIES: KindEnumEntry[] = [
	{ id: 1, kind: 'test_node', member: 'TestNode' },
	{ id: 2, kind: 'identifier', member: 'Identifier' },
	{ id: 3, kind: 'self', member: 'Self', symbolName: 'self', anon: false },
	{ id: 4, kind: 'comma', member: 'Comma', symbolName: ',', literalText: ',', anon: true }
];

// A `many` field with its separator field-tagged inside the slot (the
// `for_in_clause.right` shape: `field('right', commaSep1(...))`), mixing a
// node arm and a literal-owning keyword arm so storage classifies mixedEnum,
// alongside an unseparated `many` field.
function makeSeparatedFieldNodeMap() {
	const parentRule: SeqRule<'link'> = {
		type: SEQ,
		members: [
			{
				type: FIELD,
				name: 'right',
				content: {
					type: REPEAT1,
					content: { type: CHOICE, members: [{ type: SYMBOL, name: 'identifier' }, { type: SYMBOL, name: 'self' }] },
					separator: { value: { type: STRING, value: ',' } }
				}
			},
			{
				type: FIELD,
				name: 'items',
				content: { type: REPEAT, content: { type: SYMBOL, name: 'identifier' } }
			}
		]
	} as unknown as SeqRule<'link'>;
	const nodes = new Map<string, AssembledNode>();
	nodes.set(
		'test_node',
		new AssembledBranch('test_node', flatten(parentRule), flatten(parentRule), { kindEntries: KIND_ENTRIES })
	);
	nodes.set('identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }));
	nodes.set('self', new AssembledKeyword('self', { type: STRING, value: 'self' }, { kindEntries: KIND_ENTRIES }));
	return makeNodeMapWith(nodes);
}

describe('wrap emitter separator-tagged field slots', () => {
	const source = emitWrap({ grammar: 'synth', nodeMap: makeSeparatedFieldNodeMap(), kindEntries: KIND_ENTRIES });

	it('drops the field-tagged separator id from a mixedEnum many slot before normalization', () => {
		expect(source).toContain('_right: projectMixedEnumStorage(normalizeRepeatedWrapSlot(dropWireDelimiters(data._right, [TSKindId.Comma]),');
		expect(source).toContain('function dropWireDelimiters<T>(');
		expect(source).toContain('function _isWireDelimiter(e: unknown, separatorKindIds: readonly number[]): e is _WireDelimiter {');
	});

	it('emits no separator drop for an unseparated many slot', () => {
		expect(source).toContain('_items: normalizeRepeatedWrapSlot(data._items,');
		expect(source).not.toContain('dropWireDelimiters(data._items');
	});
});
