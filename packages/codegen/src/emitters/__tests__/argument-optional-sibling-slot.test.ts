import { STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import { emitFrom } from '../../__tests__/helpers/emit-from.ts';
import { emitFactories } from '../../__tests__/helpers/emit-factories.ts';
import {
	AssembledBranch,
	AssembledNonterminal,
	AssembledPunctuation,
	type AssembledNode,
	type NodeOrTerminal
} from '../../compiler/model/node-map.ts';
import { flatten } from '../../compiler/flatten.ts';
import { emptyDefaultOf } from '../shared.ts';
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
	return { ...nodeMap, nodeByKindId: new Map<number, AssembledNode>([[1, block], [2, asyncBlock]]) };
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
		expect(emitted).toContain('orDefault(config.body, () => buildBlock())');
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

	it('emptyDefaultOf answers with a call of the target factory', () => {
		expect(emptyDefaultOf(field, nodeMap, undefined, 'F.')).toBe('F.buildAsyncBlock()');
	});
});

describe('a required field whose sole kind is a fixed-text leaf defaults to that leaf', () => {
	const newline = new AssembledPunctuation('newline', { type: STRING, value: '\n' } as never, { hidden: false });
	const nodeMap = { ...makeNodeMapWith(new Map<string, AssembledNode>([['newline', newline]])), nodeByKindId: new Map([[3, newline]]) };
	const kindEntries = [
		{ kind: 'newline', member: 'Newline', id: 3, literalText: '\n' },
		{ kind: '?', member: 'Qmark', id: 4, literalText: '?', anon: true }
	];
	const field = new AssembledNonterminal({
		values: [{ node: newline, storageKindId: 3, multiplicity: 'single' }],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'newline'
	});

	it('emptyDefaultOf answers with the kind id of the fixed text', () => {
		expect(emptyDefaultOf(field, nodeMap, kindEntries)).toBe('TSKindId.Newline as const');
	});

	it('emptyDefaultOf answers with the kind id of a required literal', () => {
		const literal = new AssembledNonterminal({
			values: [{ value: '?', resolvedKindId: 4, multiplicity: 'single' }],
			hasTrailingDelimiter: false,
			hasLeadingDelimiter: false,
			sourceRuleIds: [],
			fieldName: 'content'
		});
		expect(emptyDefaultOf(literal, nodeMap, kindEntries)).toBe('TSKindId.Qmark as const');
	});

	it('emptyDefaultOf has no default when a literal arm shares the slot, since the choice is free', () => {
		const mixed = new AssembledNonterminal({
			values: [{ value: ';', multiplicity: 'single' }, ...field.values],
			hasTrailingDelimiter: false,
			hasLeadingDelimiter: false,
			sourceRuleIds: [],
			fieldName: 'terminator'
		});
		expect(emptyDefaultOf(mixed, nodeMap, kindEntries)).toBeNull();
	});
});

describe('a kind whose only slot is a required literal builds with no argument', () => {
	const rule = flatten({ type: STRING, value: '?' });
	const content = new AssembledNonterminal({
		values: [{ value: '?', resolvedKindId: 4, multiplicity: 'single' }],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'content'
	});
	const lazy = new AssembledBranch('lazy', rule, rule, { slots: [content] });
	const nodeMap = makeNodeMapWith(new Map<string, AssembledNode>([['lazy', lazy]]));
	const kindEntries = [
		{ kind: 'lazy', member: 'Lazy', id: 5 },
		{ kind: '?', member: 'Qmark', id: 4, literalText: '?', anon: true }
	];

	it('factories.ts: the strict raw factory takes an optional value and fills the literal', () => {
		const emitted = emitFactories({ grammar: 'synth', nodeMap, kindEntries });
		expect(emitted).toContain('export function buildLazy(value?:');
		expect(emitted).toContain('orDefault(value, () => TSKindId.Qmark as const)');
	});

	it('from.ts: the loose coercer takes no argument and fills the literal', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, kindEntries });
		expect(emitted).toContain('export function coerceToLazy(input?:');
		expect(emitted).toContain('?? TSKindId.Qmark as const');
	});
});
