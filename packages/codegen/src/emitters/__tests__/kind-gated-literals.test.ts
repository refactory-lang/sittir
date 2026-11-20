import { describe, expect, it } from 'vitest';
import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledKeyword, AssembledSupertype } from '../../compiler/model/node-map.ts';
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

const branch = (kind: string) => ({ kind, modelType: 'branch', slots: [] });
const supertype = (kind: string, subtypeNames: string[]) =>
	Object.defineProperties(Object.create(AssembledSupertype.prototype) as object, { kind: { value: kind }, subtypeNames: { value: subtypeNames } });

function ctxWithKinds(nodes: Record<string, object>): EmitCtx {
	return { ...ctxWithLeaves(), nodeMap: { slotByRuleId: new Map(), nodeByRuleId: new Map(), nodes: new Map(Object.entries(nodes)) } as unknown as EmitCtx['nodeMap'], emittedSlotNames: new Set() } as EmitCtx;
}

const v = (name: string) => ({ type: SYMBOL, name, fieldName: 'v' }) as unknown as RenderRule;
const str = (value: string) => ({ type: STRING, value }) as unknown as RenderRule;
const seq = (...members: RenderRule[]) => ({ type: SEQ, members }) as unknown as RenderRule;
const choice = (...members: RenderRule[]) => ({ type: CHOICE, members }) as unknown as RenderRule;
type Node = { kind: string; name?: string; text?: string; arms?: { test: string; kinds?: string[]; body: Node[] }[] };
const shape = (body: readonly unknown[]) =>
	(body as Node[]).map((n) => (n.kind === 'if' ? { if: n.arms!.map((a) => [a.test, a.kinds, a.body.map((b) => b.text)]) } : n.kind === 'slot' ? { slot: n.name } : { [n.kind]: n.text }));

describe('emitRule — arms whose text before the slot differs, gated on the kinds each arm admits', () => {
	it("writes one arm's leading text only for its kinds (a lifted arm beside `= value`)", () => {
		const body = emitRule(choice(v('arm_kind'), seq(str('='), v('expr_list'))), ctxWithKinds({ arm_kind: branch('arm_kind'), expr_list: branch('expr_list') }));
		expect(shape(body)).toEqual([{ if: [['v', ['expr_list'], ['=']]] }, { slot: 'v' }]);
	});

	it('gates the text before and after the slot together (`assert e ;` beside a lifted arm)', () => {
		const body = emitRule(choice(seq(str('assert'), v('expr'), str(';')), v('arm_kind')), ctxWithKinds({ arm_kind: branch('arm_kind'), expr: branch('expr') }));
		expect(shape(body)).toEqual([{ if: [['v', ['expr'], ['assert']]] }, { slot: 'v' }, { if: [['v', ['expr'], [';']]] }]);
	});

	it('names a supertype in the gate when its members are not admitted by the other arm', () => {
		const body = emitRule(choice(seq(str('extends'), v('_type')), v('bounds_arm')), ctxWithKinds({ _type: supertype('_type', ['a', 'b']), a: branch('a'), b: branch('b'), bounds_arm: branch('bounds_arm') }));
		expect(shape(body)).toEqual([{ if: [['v', ['_type'], ['extends']]] }, { slot: 'v' }]);
	});

	it('leaves the choice alone when a kind is admitted by two arms with different text', () => {
		const quoted = emitRule(choice(seq(str('"'), v('frag'), str('"')), seq(str('"""'), v('frag'), str('"""'))), ctxWithKinds({ frag: branch('frag') }));
		const viaSupertype = emitRule(choice(seq(str('extends'), v('_type')), v('a')), ctxWithKinds({ _type: supertype('_type', ['a', 'b']), a: branch('a'), b: branch('b') }));
		for (const body of [quoted, viaSupertype]) expect(JSON.stringify(body)).not.toContain('"kinds"');
	});
});
