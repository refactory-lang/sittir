import type { GeneratedKindEntry } from '../../dsl/symbol-table.ts';
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
import { collectKindEntries } from '../kind-discriminant.ts';
import { makeNodeMapWith, withGeneratedIdTables } from '../../__tests__/helpers/node-map-fixtures.ts';

/**
 * Mirrors rust's `async_block`: an optional keyword-presence slot
 * (`move`) alongside one required slot (`body`) that forwards
 * positionally to a target (`block`) constructible with no argument.
 * `argumentOptional`'s original definition only recognized "every slot
 * optional" or "exactly one slot total" — it undercounted this shape, since
 * `async_block` has two slots and only one of them is required. Both
 * surfaces derive their own-argument-optionality from `argumentOptional`
 * (node-map.ts), so the gap reached the strict raw factory (`factories.ts`)
 * and the loose coercer (`from.ts`) alike (docs/factory-surface-issues.md, X2).
 */
const idOf = (kindEntries: readonly GeneratedKindEntry[], kind: string): number => kindEntries.find((entry) => entry.kind === kind)?.id ?? 0;

function makeNodeMap(kindEntries: readonly GeneratedKindEntry[]) {
	const rule = flatten({ type: STRING, value: '{}' });
	const block = new AssembledBranch('block', rule, rule, { kindEntries, slots: [] });
	const bodyRef: NodeOrTerminal = { node: block, storageKindId: idOf(kindEntries, 'block'), multiplicity: 'single' };
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
		fieldName: 'move'
	});
	const asyncBlock = new AssembledBranch('async_block', rule, rule, { kindEntries, slots: [moveMarkerSlot, bodySlot] });
	const nodeMap = makeNodeMapWith(new Map<string, AssembledNode>([['block', block], ['async_block', asyncBlock]]));
	return { ...nodeMap, nodeByKindId: new Map<number, AssembledNode>([[idOf(kindEntries, 'block'), block], [idOf(kindEntries, 'async_block'), asyncBlock]]) };
}

describe('an optional sibling slot does not block a required forwarding slot from taking no argument', () => {
	const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeNodeMap);

	it('from.ts: the loose coercer takes no argument and defaults body to an empty construction', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, generatedIdTables });
		expect(emitted).toContain('export function coerceToAsyncBlock(input?:');
		expect(emitted).toContain('?? F.buildBlock()');
		expect(emitted).not.toContain("_requireField('async_block', 'body',");
	});

	it('factories.ts: the strict raw factory takes an optional/defaulted config and defaults body to an empty construction', () => {
		const emitted = emitFactories({ grammar: 'synth', nodeMap, generatedIdTables });
		expect(emitted).toContain('function buildAsyncBlock(config: Partial<T.AsyncBlock.Config> = {})');
		expect(emitted).toContain('orDefault(config.body, () => buildBlock())');
	});
});

describe('a required field targeting a node with an optional sibling slot defaults to that node', () => {
	const { nodeMap, generatedIdTables } = withGeneratedIdTables(makeNodeMap);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const asyncBlock = nodeMap.nodes.get('async_block')!;
	const field = new AssembledNonterminal({
		values: [{ node: asyncBlock, storageKindId: asyncBlock.kindEntry!.id, multiplicity: 'single' }],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'outer'
	});

	it('emptyDefaultOf answers with a call of the target factory', () => {
		expect(emptyDefaultOf(field, nodeMap, kindEntries, 'F.')).toBe('F.buildAsyncBlock()');
	});
});

describe('a required field whose sole kind is a fixed-text leaf defaults to that leaf', () => {
	const { nodeMap, generatedIdTables } = withGeneratedIdTables(
		(kindEntries) => {
			const newline = new AssembledPunctuation('newline', { type: STRING, value: '\n' } as never, { kindEntries, hidden: false });
			return { ...makeNodeMapWith(new Map<string, AssembledNode>([['newline', newline]])), nodeByKindId: new Map([[idOf(kindEntries, 'newline'), newline]]) };
		},
		{ qmark: '?' }
	);
	const kindEntries = collectKindEntries(nodeMap, generatedIdTables);
	const newline = nodeMap.nodes.get('newline')!;
	const qmarkId = kindEntries.find((entry) => entry.kind === 'qmark')!.id;
	const field = new AssembledNonterminal({
		values: [{ node: newline, storageKindId: newline.kindEntry!.id, multiplicity: 'single' }],
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
			values: [{ value: '?', resolvedKindId: qmarkId, multiplicity: 'single' }],
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

function lazyNodeMap(kindEntries: readonly GeneratedKindEntry[]) {
	const rule = flatten({ type: STRING, value: '?' });
	const qmarkId = kindEntries.find((entry) => entry.kind === 'qmark')?.id;
	const content = new AssembledNonterminal({
		values: [{ value: '?', ...(qmarkId === undefined ? {} : { resolvedKindId: qmarkId }), multiplicity: 'single' }],
		hasTrailingDelimiter: false,
		hasLeadingDelimiter: false,
		sourceRuleIds: [],
		fieldName: 'content'
	});
	return makeNodeMapWith(new Map<string, AssembledNode>([['lazy', new AssembledBranch('lazy', rule, rule, { kindEntries, slots: [content] })]]));
}

describe('a kind whose only slot is a required literal builds with no argument', () => {
	const { nodeMap, generatedIdTables } = withGeneratedIdTables(lazyNodeMap, { qmark: '?' });

	it('factories.ts: the strict raw factory takes an optional value and fills the literal', () => {
		const emitted = emitFactories({ grammar: 'synth', nodeMap, generatedIdTables });
		expect(emitted).toContain('export function buildLazy(value?:');
		expect(emitted).toContain('orDefault(value, () => TSKindId.Qmark as const)');
	});

	it('from.ts: the loose coercer takes no argument and fills the literal', () => {
		const emitted = emitFrom({ grammar: 'synth', nodeMap, generatedIdTables });
		expect(emitted).toContain('export function coerceToLazy(input?:');
		expect(emitted).toContain('?? TSKindId.Qmark as const');
	});
});

describe('a builder that may omit a required slot must fill it', () => {
	it('fails generation when a required literal has no kind to fill it with', () => {
		const { nodeMap, generatedIdTables } = withGeneratedIdTables(lazyNodeMap);
		expect(() => emitFactories({ grammar: 'synth', nodeMap, generatedIdTables })).toThrow(
			/lazy: its builder may omit the required slot content, which has no empty default/
		);
	});
});
