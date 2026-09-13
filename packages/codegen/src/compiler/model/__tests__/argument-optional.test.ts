import { describe, expect, it } from 'vitest';
import type { RenderRule } from '../../../types/rule.ts';
import { AssembledBranch, AssembledNonterminal, type AssembledNode, type ArgumentOptionalCtx, type NodeOrTerminal } from '../node-map.ts';

const rule = { type: 'SEQ', members: [] } as unknown as RenderRule;

const branch = (kind: string, slots: readonly AssembledNonterminal[]): AssembledBranch =>
	new AssembledBranch(kind, rule, rule, { slots });

const slot = (values: readonly NodeOrTerminal[]): AssembledNonterminal =>
	new AssembledNonterminal({ values, hasTrailingDelimiter: false, hasLeadingDelimiter: false, sourceRuleIds: [] });

const ctxWith = (nodes: ReadonlyMap<number, AssembledNode>): ArgumentOptionalCtx => ({ nodeByKindId: nodes });

describe('argumentOptional', () => {
	it('is true when every slot is optional', () => {
		const arrayValue: NodeOrTerminal = { value: 'x', multiplicity: 'array' };
		const node = branch('opt', [slot([arrayValue])]);
		expect(node.argumentOptional(ctxWith(new Map()))).toBe(true);
	});

	it('is false for a sole slot whose values include a nonEmptyArray multiplicity', () => {
		const value: NodeOrTerminal = { value: 'x', multiplicity: 'nonEmptyArray' };
		const node = branch('items', [slot([value])]);
		expect(node.argumentOptional(ctxWith(new Map()))).toBe(false);
	});

	it("forwards through a single-slot node ref to the target kind's own answer", () => {
		const target = branch('target', []);
		const ref: NodeOrTerminal = { node: target, storageKindId: 5, multiplicity: 'single' };
		const forwarder = branch('forwarder', [slot([ref])]);
		expect(forwarder.argumentOptional(ctxWith(new Map([[5, target]])))).toBe(true);

		const requiredValue: NodeOrTerminal = { value: 'x', multiplicity: 'single' };
		const strictTarget = branch('strict-target', [slot([requiredValue])]);
		const strictRef: NodeOrTerminal = { node: strictTarget, storageKindId: 6, multiplicity: 'single' };
		const strictForwarder = branch('strict-forwarder', [slot([strictRef])]);
		expect(strictForwarder.argumentOptional(ctxWith(new Map([[6, strictTarget]])))).toBe(false);
	});

	it("is false when the sole ref's storageKindId is absent from ctx.nodeByKindId", () => {
		const target = branch('target', []);
		const ref: NodeOrTerminal = { node: target, storageKindId: 9, multiplicity: 'single' };
		const forwarder = branch('forwarder', [slot([ref])]);
		expect(forwarder.argumentOptional(ctxWith(new Map()))).toBe(false);
	});

	it('breaks a two-kind forwarding cycle via the seen set instead of recursing forever', () => {
		const requiredValue: NodeOrTerminal = { value: 'x', multiplicity: 'single' };
		const a = branch('a', [slot([requiredValue])]);
		const b = branch('b', [slot([requiredValue])]);
		const refToB: NodeOrTerminal = { node: b, storageKindId: 2, multiplicity: 'single' };
		const refToA: NodeOrTerminal = { node: a, storageKindId: 1, multiplicity: 'single' };
		const aForward = branch('a', [slot([refToB])]);
		const bForward = branch('b', [slot([refToA])]);
		const nodes = new Map<number, AssembledNode>([
			[1, aForward],
			[2, bForward]
		]);
		expect(aForward.argumentOptional(ctxWith(nodes))).toBe(false);
	});
});
