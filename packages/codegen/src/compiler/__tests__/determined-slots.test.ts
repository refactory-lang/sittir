/**
 * Determined slots — a required singular slot with exactly one possible
 * value is a cardinality-1 enum: `determinedSlotText` is its single
 * classification-and-text source, and `pruneDeterminedSlots` moves such
 * slots out of the slot record (no storage/transport/wrap/accessor/from
 * surface) onto `determinedSlots`, stamped for the template emitter.
 */

import { PATTERN, SEQ, STRING, SYMBOL, FIELD } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import {
	AssembledBranch,
	AssembledKeyword,
	AssembledPattern,
	determinedSlotText,
	pruneDeterminedSlots,
	type AssembledNode
} from '../model/node-map.ts';
import type { NodeOrTerminal } from '../model/node-map.ts';
import type { AssembledNonterminal } from '../model/node-map.ts';
import type { SeqRule } from '../../types/rule.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';
import { flatten } from '../../compiler/flatten.ts';

function slot(values: NodeOrTerminal[]): AssembledNonterminal {
	return {
		name: 'x',
		values,
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false
	} as unknown as AssembledNonterminal;
}

describe('determinedSlotText', () => {
	it('resolves an inline literal', () => {
		expect(determinedSlotText(slot([{ value: 'in', multiplicity: 'single' }]))).toBe('in');
	});

	it('resolves a keyword reference — visible or hidden — to its text', () => {
		const kw = new AssembledKeyword('mutable_specifier', { type: STRING, value: 'mut' });
		expect(determinedSlotText(slot([{ node: kw, multiplicity: 'single' }]))).toBe('mut');
	});

	it('declines optional, repeated, multi-valued, and pattern-backed slots', () => {
		const kw = new AssembledKeyword('mut', { type: STRING, value: 'mut' });
		const pat = new AssembledPattern('name', { type: PATTERN, value: '[a-z]+' });
		expect(determinedSlotText(slot([{ value: 'in', multiplicity: 'optional' }]))).toBeUndefined();
		expect(determinedSlotText(slot([{ value: 'in', multiplicity: 'array' }]))).toBeUndefined();
		expect(
			determinedSlotText(
				slot([
					{ value: 'in', multiplicity: 'single' },
					{ node: kw, multiplicity: 'single' }
				])
			)
		).toBeUndefined();
		expect(determinedSlotText(slot([{ node: pat, multiplicity: 'single' }]))).toBeUndefined();
	});
});

describe('pruneDeterminedSlots', () => {
	function makeMutPatternNodeMap() {
		const rule: SeqRule<'link'> = {
			type: SEQ,
			members: [
				{ type: FIELD, name: 'mutable_specifier', content: { type: SYMBOL, name: 'mutable_specifier' } },
				{ type: FIELD, name: 'pattern', content: { type: SYMBOL, name: 'pattern' } }
			]
		};
		const nodes = new Map<string, AssembledNode>();
		nodes.set('mut_pattern', new AssembledBranch('mut_pattern', rule, flatten(rule), flatten(rule)));
		nodes.set('mutable_specifier', new AssembledKeyword('mutable_specifier', { type: STRING, value: 'mut' }));
		nodes.set('pattern', new AssembledPattern('pattern', { type: PATTERN, value: '[a-z]+' }));
		return makeNodeMapWith(nodes);
	}

	it('moves the determined slot out of the record and stamps it', () => {
		const nodeMap = makeMutPatternNodeMap();
		const node = nodeMap.nodes.get('mut_pattern')! as AssembledBranch;
		// The ref is unresolved pre-hydration — the pass resolves by name.
		pruneDeterminedSlots(nodeMap);
		expect(Object.keys(node.slots)).toEqual(['pattern']);
		expect(node.determinedSlots.map((s) => s.name)).toEqual(['mutable_specifier']);
		expect(node.determinedSlots[0]!.determined).toBe(true);
		expect(node.fields.map((f) => f.name)).toEqual(['pattern']);
	});

	it('leaves a kind with no determined slot untouched', () => {
		const nodeMap = makeMutPatternNodeMap();
		const node = nodeMap.nodes.get('mut_pattern')! as AssembledBranch;
		const before = node.slots;
		// Prune only consults resolvable targets; an empty map resolves none.
		node.pruneDeterminedSlots(new Map());
		expect(node.slots).toBe(before);
		expect(node.determinedSlots).toEqual([]);
	});
});
