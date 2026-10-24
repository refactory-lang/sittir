import { withGeneratedIdTablesNode } from '../../../__tests__/helpers/node-map-fixtures.ts';
import type { GeneratedKindEntry } from '../../../dsl/symbol-table.ts';
import { describe, expect, it } from 'vitest';
import type { RenderRule } from '../../../types/rule.ts';
import { AssembledBranch, AssembledNonterminal, AssembledPunctuation, type AssembledNode, type ArgumentOptionalCtx, type NodeOrTerminal } from '../node-map.ts';

const rule = { type: 'SEQ', members: [] } as unknown as RenderRule;

const branch = (kind: string, slots: readonly AssembledNonterminal[], kindEntries: readonly GeneratedKindEntry[]): AssembledBranch =>
	new AssembledBranch(kind, rule, rule, { kindEntries, slots });

const slot = (values: readonly NodeOrTerminal[]): AssembledNonterminal =>
	new AssembledNonterminal({ values, hasTrailingDelimiter: false, hasLeadingDelimiter: false, sourceRuleIds: [] });

const ctxWith = (nodes: ReadonlyMap<number, AssembledNode>): ArgumentOptionalCtx => ({ nodeByKindId: nodes });

describe('argumentOptional', () => {
	it('is true when every slot is optional', () => {
		const arrayValue: NodeOrTerminal = { value: 'x', multiplicity: 'array' };
		const node = withGeneratedIdTablesNode((kindEntries) => branch('opt', [slot([arrayValue])], kindEntries));
		expect(node.argumentOptional(ctxWith(new Map()))).toBe(true);
	});

	it('is false for a sole slot whose values include a nonEmptyArray multiplicity', () => {
		const value: NodeOrTerminal = { value: 'x', multiplicity: 'nonEmptyArray' };
		const node = withGeneratedIdTablesNode((kindEntries) => branch('items', [slot([value])], kindEntries));
		expect(node.argumentOptional(ctxWith(new Map()))).toBe(false);
	});

	it("forwards through a single-slot node ref to the target kind's own answer", () => {
		const target = withGeneratedIdTablesNode((kindEntries) => branch('target', [], kindEntries));
		const ref: NodeOrTerminal = { node: target, storageKindId: 5, multiplicity: 'single' };
		const forwarder = withGeneratedIdTablesNode((kindEntries) => branch('forwarder', [slot([ref])], kindEntries));
		expect(forwarder.argumentOptional(ctxWith(new Map([[5, target]])))).toBe(true);

		const requiredValue: NodeOrTerminal = { pattern: '[a-z]+', multiplicity: 'single' };
		const strictTarget = withGeneratedIdTablesNode((kindEntries) => branch('strict-target', [slot([requiredValue])], kindEntries));
		const strictRef: NodeOrTerminal = { node: strictTarget, storageKindId: 6, multiplicity: 'single' };
		const strictForwarder = withGeneratedIdTablesNode((kindEntries) => branch('strict-forwarder', [slot([strictRef])], kindEntries));
		expect(strictForwarder.argumentOptional(ctxWith(new Map([[6, strictTarget]])))).toBe(false);
	});

	it("is false when the sole ref's storageKindId is absent from ctx.nodeByKindId", () => {
		const target = withGeneratedIdTablesNode((kindEntries) => branch('target', [], kindEntries));
		const ref: NodeOrTerminal = { node: target, storageKindId: 9, multiplicity: 'single' };
		const forwarder = withGeneratedIdTablesNode((kindEntries) => branch('forwarder', [slot([ref])], kindEntries));
		expect(forwarder.argumentOptional(ctxWith(new Map()))).toBe(false);
	});

	it('an optional sibling slot does not block the one required slot from forwarding (rust async_block)', () => {
		// async_block: move (optional keyword presence) + body (required,
		// forwards to a target that is itself argument-optional). `soleSlot`
		// (exactly one slot total) would miss this — there are two slots here.
		const target = withGeneratedIdTablesNode((kindEntries) => branch('block', [], kindEntries));
		const bodyRef: NodeOrTerminal = { node: target, storageKindId: 7, multiplicity: 'single' };
		const moveMarkerValue: NodeOrTerminal = { value: 'move', multiplicity: 'optional' };
		const node = withGeneratedIdTablesNode((kindEntries) => branch('async_block', [slot([moveMarkerValue]), slot([bodyRef])], kindEntries));
		expect(node.argumentOptional(ctxWith(new Map([[7, target]])))).toBe(true);
	});

	it('is false when more than one slot is required, even if one of them would forward', () => {
		const target = withGeneratedIdTablesNode((kindEntries) => branch('block', [], kindEntries));
		const bodyRef: NodeOrTerminal = { node: target, storageKindId: 8, multiplicity: 'single' };
		const otherRequired: NodeOrTerminal = { pattern: '[a-z]+', multiplicity: 'single' };
		const node = withGeneratedIdTablesNode((kindEntries) => branch('two_required', [slot([otherRequired]), slot([bodyRef])], kindEntries));
		expect(node.argumentOptional(ctxWith(new Map([[8, target]])))).toBe(false);
	});

	it('breaks a two-kind forwarding cycle via the seen set instead of recursing forever', () => {
		const requiredValue: NodeOrTerminal = { pattern: '[a-z]+', multiplicity: 'single' };
		const a = withGeneratedIdTablesNode((kindEntries) => branch('a', [slot([requiredValue])], kindEntries));
		const b = withGeneratedIdTablesNode((kindEntries) => branch('b', [slot([requiredValue])], kindEntries));
		const refToB: NodeOrTerminal = { node: b, storageKindId: 2, multiplicity: 'single' };
		const refToA: NodeOrTerminal = { node: a, storageKindId: 1, multiplicity: 'single' };
		const aForward = withGeneratedIdTablesNode((kindEntries) => branch('a', [slot([refToB])], kindEntries));
		const bForward = withGeneratedIdTablesNode((kindEntries) => branch('b', [slot([refToA])], kindEntries));
		const nodes = new Map<number, AssembledNode>([
			[1, aForward],
			[2, bForward]
		]);
		expect(aForward.argumentOptional(ctxWith(nodes))).toBe(false);
	});
});

describe('parameterless', () => {
	const newline = withGeneratedIdTablesNode((kindEntries) => new AssembledPunctuation('newline', { type: 'STRING', value: '\n' } as never, { kindEntries }));
	const fixed: NodeOrTerminal = { node: newline, storageKindId: 3, multiplicity: 'single' };

	it('is true for a compound whose only slot takes a fixed-text kind', () => {
		expect(withGeneratedIdTablesNode((kindEntries) => branch('empty', [slot([fixed])], kindEntries)).parameterless).toBe(true);
	});

	it('is true for a compound whose only slot is a required literal', () => {
		const literal: NodeOrTerminal = { value: '?', resolvedKindId: 4, multiplicity: 'single' };
		const lazy = withGeneratedIdTablesNode((kindEntries) => branch('lazy', [slot([literal])], kindEntries));
		expect([lazy.parameterless, lazy.argumentOptional(ctxWith(new Map()))]).toEqual([true, true]);
	});

	it('is false when the fixed-text slot is optional, since its presence is a free choice', () => {
		const optional: NodeOrTerminal = { ...fixed, multiplicity: 'optional' };
		expect(withGeneratedIdTablesNode((kindEntries) => branch('marker', [slot([optional])], kindEntries)).parameterless).toBe(false);
	});

	it('is false when a sibling slot takes a free value', () => {
		const free: NodeOrTerminal = { pattern: '[a-z]+', multiplicity: 'single' };
		expect(withGeneratedIdTablesNode((kindEntries) => branch('mixed', [slot([fixed]), slot([free])], kindEntries)).parameterless).toBe(false);
	});
});
