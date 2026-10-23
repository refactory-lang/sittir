import { describe, expect, it } from 'vitest';
import { FIELD, PATTERN, SEQ, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledBranch, AssembledPattern, type AssembledNode } from '../../compiler/model/node-map.ts';
import { flatten } from '../../compiler/flatten.ts';
import type { SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';
import { querySlotRows } from '../client-utils.ts';

const withSlot = (field: string) =>
	withGeneratedIdTables((kindEntries) => {
		const rule: SeqRule<'link'> = { type: SEQ, members: [{ type: FIELD, name: field, content: { type: SYMBOL, name: 'identifier' } }] };
		const flat = flatten(rule);
		return makeNodeMapWith(
			new Map<string, AssembledNode>([
				['probe', new AssembledBranch('probe', flat, flat, { kindEntries })],
				['identifier', new AssembledPattern('identifier', { type: PATTERN, value: '[a-z]+' }, { kindEntries })]
			])
		);
	}).nodeMap;

describe('querySlotRows', () => {
	it('numbers each slot of a kind by its node field, and names the key the node stores it under', () => {
		const rows = [...querySlotRows(withSlot('target')).values()];
		expect(rows).toEqual([[['target', 0, undefined, '_target']]]);
	});

	it('refuses a slot read as `is`, the name a where condition tests a flag by', () => {
		expect(() => querySlotRows(withSlot('is'))).toThrow(/probe's slot is is read as `is`, which a where condition reserves for flags/);
	});
});
