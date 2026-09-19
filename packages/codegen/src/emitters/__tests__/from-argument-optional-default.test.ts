import { STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import {
	AssembledBranch,
	AssembledNonterminal,
	type AssembledNode,
	type NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { flatten } from '../../compiler/flatten.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';

/**
 * Mirrors rust's `try_block.body`: a wrapper whose one required field
 * forwards positionally to a target (`block`) that is itself constructible
 * with no argument at all. The strict surface already derives this from
 * `argumentOptional`'s slot-multiplicity walk (`ir.tryBlock.strict()` builds
 * `try{}`); the loose `.from()` coercer required an explicit `{}` for the
 * same shape (docs/factory-surface-issues.md, X2 — rule 7) because its own
 * optionality came from a shallow, local "does THIS node have a required
 * slot" scan instead of the same recursive fact.
 */
function makeNodeMap() {
	const rule = flatten({ type: STRING, value: '{}' });
	// `block`: no fields at all — trivially constructible with no argument.
	const block = new AssembledBranch('block', rule, rule, { slots: [] });
	const bodyRef: NodeOrTerminal = { node: block, storageKindId: 1, multiplicity: 'single' };
	const bodySlot = new AssembledNonterminal({
		values: [bodyRef],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'body'
	});
	// `try_block`: one required field, forwarding positionally to `block`.
	const tryBlock = new AssembledBranch('try_block', rule, rule, { slots: [bodySlot] });

	const nodes = new Map<string, AssembledNode>([
		['block', block],
		['try_block', tryBlock]
	]);
	const nodeMap = makeNodeMapWith(nodes);
	return { ...nodeMap, nodeByKindId: new Map([[1, block]]) };
}

describe('the loose coercer takes no argument wherever the strict surface derives one (rule 7)', () => {
	const emitted = emitFrom({ grammar: 'synth', nodeMap: makeNodeMap() });

	it("computes the wrapper's own optionality from argumentOptional, not a local required-field scan", () => {
		expect(emitted).toContain('export function coerceToTryBlock(input?:');
	});

	it('defaults the omitted required field to an empty construction instead of throwing', () => {
		expect(emitted).toContain('?? F.buildBlock()');
		expect(emitted).not.toContain("_requireField('try_block', 'body',");
	});
});
