import { AbstractAssembledCompound } from '../../compiler/model/node-map.ts';
import { describe, expect, it } from 'vitest';
import { CHOICE, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { AssembledKeyword, AssembledSupertype } from '../../compiler/model/node-map.ts';
import { NO_JOINS } from '../../compiler/model/join-seams/index.ts';
import { emitKindGatedLiterals, emitRule, type EmitCtx } from '../templates.ts';
import { EmitHaltedError } from '../../types/diagnostics.ts';
import type { RenderRule } from '../../types/rule.ts';

const keyword = (kind: string) =>
	Object.defineProperties(Object.create(AssembledKeyword.prototype) as object, {
		kind: { value: kind },
		text: { value: kind },
		aliasDisplays: { value: [] },
		slots: { value: [] }
	});

const vSlot = { name: 'v', storageName: 'v', propertyName: 'v', paramName: 'v', values: [{ value: 'x', multiplicity: 'single' }] };
const ownedBy = (slots: Record<string, object>) => new Map([['owner', new Map(Object.entries(slots))]]);
const ownerNode = (slots: Record<string, object>) =>
	Object.defineProperties(Object.create(AbstractAssembledCompound.prototype) as object, { kind: { value: 'owner' }, slots: { value: Object.values(slots) } });

function ctxWithLeaves(): EmitCtx {
	return {
		ownerKind: 'owner',
		nodeMap: {
			slotByRuleId: ownedBy({ v: vSlot }),
			nodeByRuleId: new Map(),
			nodes: new Map([
				['yes', keyword('yes')],
				['no', keyword('no')],
				['owner', ownerNode({ v: vSlot })]
			])
		} as unknown as EmitCtx['nodeMap'],
		wordMatcher: /^\w+$/,
		isWordChar: (c: string) => /\w/.test(c),
		isJoinPair: () => false,
		joins: NO_JOINS,
		externals: [],
		rules: {},
		visitingHelpers: new Set<string>(),
		emittedSlotNames: new Set()
	} as EmitCtx;
}

describe('emitRule — a choice whose arms are all fixed-text leaves in one field', () => {
	it('does not abort when no arm keeps text before the slot', () => {
		const yes = { type: SYMBOL, name: 'yes', id: 'v', fieldName: 'v' } as unknown as RenderRule;
		const no = { type: SYMBOL, name: 'no', id: 'v', fieldName: 'v' } as unknown as RenderRule;
		const optionalSemi = { type: STRING, value: ';', multiplicity: 'optional' } as unknown as RenderRule;
		const rule = { type: CHOICE, members: [{ type: SEQ, members: [yes, optionalSemi] }, no] } as unknown as RenderRule;
		expect(() => emitRule(rule, ctxWithLeaves())).not.toThrow();
	});

	it('does not write leading text of one arm for a lone fixed-text arm', () => {
		const no = { type: SYMBOL, name: 'no', id: 'v', fieldName: 'v' } as unknown as RenderRule;
		const ident = { type: SYMBOL, name: 'identifier', id: 'v', fieldName: 'v' } as unknown as RenderRule;
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

function ctxWithKinds(nodes: Record<string, object>, slots: Record<string, object> = { v: vSlot }): EmitCtx {
	return { ...ctxWithLeaves(), nodeMap: { slotByRuleId: ownedBy(slots), nodeByRuleId: new Map(), nodes: new Map([...Object.entries(nodes), ['owner', ownerNode(slots)]]) } as unknown as EmitCtx['nodeMap'], emittedSlotNames: new Set() } as EmitCtx;
}

const v = (name: string) => ({ type: SYMBOL, name, id: 'v', fieldName: 'v' }) as unknown as RenderRule;
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

	it('writes no kind gate when a kind is admitted by two arms with different text, and the choice refuses with shared-slot-choice', () => {
		const shapes: readonly [RenderRule, Record<string, object>][] = [
			[choice(seq(str('"'), v('frag'), str('"')), seq(str('"""'), v('frag'), str('"""'))), { frag: branch('frag') }],
			[choice(seq(str('extends'), v('_type')), v('a')), { _type: supertype('_type', ['a', 'b']), a: branch('a'), b: branch('b') }]
		];
		for (const [rule, nodes] of shapes) {
			expect(emitKindGatedLiterals(rule as Extract<RenderRule, { type: 'CHOICE' }>, undefined, ctxWithKinds(nodes))).toBeUndefined();
			let halted: unknown;
			try {
				emitRule(rule, ctxWithKinds(nodes));
			} catch (error) {
				halted = error;
			}
			expect(halted).toBeInstanceOf(EmitHaltedError);
			expect((halted as EmitHaltedError).blocking).toMatchObject([{ code: 'shared-slot-choice' }]);
		}
	});
});

describe('emitRule — a choice between an optional slot and fixed text', () => {
	it('writes the fixed text when the slot, whose arm is already gated on itself, is absent (`body` or `;`)', () => {
		const optionalBody = { name: 'body', storageName: 'body', propertyName: 'body', paramName: 'body', values: [{ value: 'x', multiplicity: 'optional' }] };
		const ctx = ctxWithKinds({ block: branch('block') }, { body: optionalBody });
		const body = emitRule(choice({ type: SYMBOL, name: 'block', id: 'body', fieldName: 'body', multiplicity: 'optional' } as unknown as RenderRule, str(';')), ctx);
		expect(body).toEqual([{ kind: 'if', arms: [{ test: 'body', body: [{ kind: 'slot', name: 'body' }] }], fallback: [{ kind: 'text', text: ';' }] }]);
	});

	it('keeps the fixed text as the fallback when it carries its own seam', () => {
		const optionalBody = { name: 'body', storageName: 'body', propertyName: 'body', paramName: 'body', values: [{ value: 'x', multiplicity: 'optional' }] };
		const ctx = ctxWithKinds({ block: branch('block') }, { body: optionalBody });
		const semiBefore = {
			type: CHOICE,
			nonterminal: true,
			fieldName: 'semi_before',
			members: [{ type: SYMBOL, name: '_space', nonterminal: true, annotations: { spacing: { at: 'seam', token: 'semi', side: 'before' }, arm: 'space', default: true } }]
		} as unknown as RenderRule;
		const body = emitRule(choice({ type: SYMBOL, name: 'block', id: 'body', fieldName: 'body', multiplicity: 'optional' } as unknown as RenderRule, seq(semiBefore, str(';'))), ctx);
		expect(body).toEqual([{ kind: 'if', arms: [{ test: 'body', body: [{ kind: 'slot', name: 'body' }] }], fallback: [{ kind: 'seam', field: 'semi_before' }, { kind: 'text', text: ';' }] }]);
	});
});
