import { describe, expect, it } from 'vitest';
import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledKeyword } from '../../compiler/model/node-map.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { emitRule, type EmitCtx } from '../templates.ts';
import type { RenderRule } from '../../types/rule.ts';

const keyword = (kind: string) =>
	Object.defineProperties(Object.create(AssembledKeyword.prototype) as object, {
		kind: { value: kind },
		text: { value: kind },
		aliasDisplays: { value: [] },
		slots: { value: [] }
	});

function ctxWithLeaves(): EmitCtx {
	return {
		nodeMap: {
			slotByRuleId: new Map(),
			nodeByRuleId: new Map(),
			nodes: new Map([
				['yes', keyword('yes')],
				['no', keyword('no')]
			])
		} as unknown as EmitCtx['nodeMap'],
		wordMatcher: /^\w+$/,
		isWordChar: (c: string) => /\w/.test(c),
		isJoinPair: () => false,
		joins: NO_JOINS,
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
		emittedSlotNames: new Set(),
		ownerSlots: { v: { name: 'v', storageName: 'v', propertyName: 'v', paramName: 'v', values: [{ value: 'x', multiplicity: 'single' }] } } as never
	} as EmitCtx;
}

describe('emitRule — a choice whose arms are all fixed-text leaves in one field', () => {
	it('does not abort when no arm keeps text before the slot', () => {
		const yes = { type: SYMBOL, name: 'yes', fieldName: 'v' } as unknown as RenderRule;
		const no = { type: SYMBOL, name: 'no', fieldName: 'v' } as unknown as RenderRule;
		const optionalSemi = { type: STRING, value: ';', multiplicity: 'optional' } as unknown as RenderRule;
		const rule = { type: CHOICE, members: [{ type: SEQ, members: [yes, optionalSemi] }, no] } as unknown as RenderRule;
		expect(() => emitRule(rule, ctxWithLeaves())).not.toThrow();
	});

	it('does not write leading text of one arm for a lone fixed-text arm', () => {
		const no = { type: SYMBOL, name: 'no', fieldName: 'v' } as unknown as RenderRule;
		const ident = { type: SYMBOL, name: 'identifier', fieldName: 'v' } as unknown as RenderRule;
		const open = { type: STRING, value: '(' } as unknown as RenderRule;
		const close = { type: STRING, value: ')' } as unknown as RenderRule;
		const rule = { type: CHOICE, members: [no, { type: SEQ, members: [open, ident, close] }] } as unknown as RenderRule;
		const body = emitRule(rule, ctxWithLeaves());
		expect(body.some((n) => n.kind === 'text')).toBe(false);
	});
});
