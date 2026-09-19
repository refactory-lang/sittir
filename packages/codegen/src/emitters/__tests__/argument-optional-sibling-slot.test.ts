import { STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import {
	AssembledBranch,
	AssembledNonterminal,
	type AssembledNode,
	type NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { flatten } from '../../compiler/flatten.ts';
import { canDefaultToEmpty } from '../shared.ts';
import { makeNodeMapWith } from '../../__tests__/helpers/node-map-fixtures.ts';

/**
 * Mirrors rust's `async_block`: an optional keyword-presence slot
 * (`moveMarker`) alongside one required slot (`body`) that forwards
 * positionally to a target (`block`) constructible with no argument.
 * `argumentOptional`'s original definition only recognized "every slot
 * optional" or "exactly one slot total" — it undercounted this shape, since
 * `async_block` has two slots and only one of them is required. Both
 * surfaces derive their own-argument-optionality from `argumentOptional`
 * (node-map.ts), so the gap reached the strict raw factory (`factories.ts`)
 * and the loose coercer (`from.ts`) alike (docs/factory-surface-issues.md, X2).
 */
function makeNodeMap() {
	const rule = flatten({ type: STRING, value: '{}' });
	const block = new AssembledBranch('block', rule, rule, { slots: [] });
	const bodyRef: NodeOrTerminal = { node: block, storageKindId: 1, multiplicity: 'single' };
	const bodySlot = new AssembledNonterminal({
		values: [bodyRef],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'body'
	});
	const moveMarkerValue: NodeOrTerminal = { value: 'move', multiplicity: 'optional' };
	const moveMarkerSlot = new AssembledNonterminal({
		values: [moveMarkerValue],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'moveMarker'
	});
	const asyncBlock = new AssembledBranch('async_block', rule, rule, {
		slots: [moveMarkerSlot, bodySlot]
	});

	const nodes = new Map<string, AssembledNode>([
		['block', block],
		['async_block', asyncBlock]
	]);
	const nodeMap = makeNodeMapWith(nodes);
	return { ...nodeMap, nodeByKindId: new Map([[1, block]]) };
}

describe('an optional sibling slot does not block a required forwarding slot from taking no argument', () => {
	const nodeMap = makeNodeMap();

	it('from.ts: the loose coercer takes no argument and defaults body to an empty construction', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap });
		expect(emitted).toContain('export function coerceToAsyncBlock(input?:');
		expect(emitted).toContain('?? F.buildBlock()');
		expect(emitted).not.toContain("_requireField('async_block', 'body',");
	});

	it('factories.ts: the strict raw factory takes an optional/defaulted config and defaults body to an empty construction', () => {
		const emitted = emitFactories({ grammar: 'synth', nodeMap });
		expect(emitted).toContain('function buildAsyncBlock(config: Partial<T.AsyncBlock.Config> = {})');
		expect(emitted).toContain('config.body ?? buildBlock()');
	});
});

describe('a required field targeting a node with an optional sibling slot defaults to that node', () => {
	const nodeMap = makeNodeMap();
	const asyncBlock = nodeMap.nodes.get('async_block')!;
	const field = new AssembledNonterminal({
		values: [{ node: asyncBlock, storageKindId: 2, multiplicity: 'single' }],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'outer'
	});

	it('canDefaultToEmpty answers with the target factory', () => {
		expect(canDefaultToEmpty(field, nodeMap)).toBe('buildAsyncBlock');
	});
});
