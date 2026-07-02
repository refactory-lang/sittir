import { describe, it, expect } from 'vitest';
import { RuleWalker } from '../rule-walker.ts';
import { CHOICE, FIELD, OPTIONAL, REPEAT, SEQ, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import type { AnyRule } from '../../types/rule.ts';

const str = (value: string): AnyRule => ({ type: STRING, value });
const sym = (name: string): AnyRule => ({ type: SYMBOL, name });

describe('RuleWalker.childrenOf', () => {
	const w = new RuleWalker();
	it('members for seq/choice', () => {
		const a = str('a'), b = str('b');
		expect(w.childrenOf({ type: SEQ, members: [a, b] } as AnyRule)).toEqual([a, b]);
		expect(w.childrenOf({ type: CHOICE, members: [a, b] } as AnyRule)).toEqual([a, b]);
	});
	it('content for wrappers', () => {
		const inner = sym('x');
		expect(w.childrenOf({ type: OPTIONAL, content: inner } as AnyRule)).toEqual([inner]);
		expect(w.childrenOf({ type: FIELD, name: 'f', content: inner } as AnyRule)).toEqual([inner]);
	});
	it('empty for leaves (string/pattern/symbol/supertype/indent)', () => {
		expect(w.childrenOf(str('a'))).toEqual([]);
		expect(w.childrenOf(sym('x'))).toEqual([]);
		expect(w.childrenOf({ type: 'supertype', name: 's', subtypes: ['a'] } as AnyRule)).toEqual([]);
	});
	it('separator string form contributes no edges', () => {
		const r = { type: REPEAT, content: sym('x'), separator: ',' } as AnyRule;
		expect(w.childrenOf(r)).toEqual([sym('x')]);
	});
	it('separator array + object forms contribute their rules (stamped leaf)', () => {
		const sep = str(',');
		const arrLeaf = { type: SYMBOL, name: 'x', separator: [sep] } as AnyRule;
		expect(w.childrenOf(arrLeaf)).toEqual([sep]);
		const objLeaf = { type: SYMBOL, name: 'x', separator: { rules: [sep], trailing: true } } as AnyRule;
		expect(w.childrenOf(objLeaf)).toEqual([sep]);
	});
});

describe('RuleWalker.map', () => {
	const w = new RuleWalker();
	it('returns the SAME reference when visit changes nothing (fixpoint identity)', () => {
		const tree = { type: SEQ, members: [str('a'), { type: OPTIONAL, content: sym('x') }] } as AnyRule;
		expect(w.map(tree, (r) => r)).toBe(tree);
	});
	it('rebuilds only the spine above a changed node', () => {
		const keep = str('keep');
		const tree = { type: SEQ, members: [keep, sym('old')] } as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && r.name === 'old' ? sym('new') : r)) as { members: AnyRule[] };
		expect(out).not.toBe(tree);
		expect(out.members[0]).toBe(keep);
		expect((out.members[1] as { name: string }).name).toBe('new');
	});
});

describe('RuleWalker.fold / find', () => {
	const w = new RuleWalker();
	const tree = { type: SEQ, members: [str('a'), { type: CHOICE, members: [sym('x'), str('b')] }] } as AnyRule;
	it('fold visits root-first, pre-order', () => {
		const types = w.fold(tree, [] as string[], (acc, r) => (acc.push(r.type), acc));
		expect(types).toEqual([SEQ, STRING, CHOICE, SYMBOL, STRING]);
	});
	it('find short-circuits at the first match', () => {
		let visits = 0;
		const hit = w.find(tree, (r) => (visits++, r.type === STRING));
		expect((hit as { value: string }).value).toBe('a');
		expect(visits).toBe(2); // root seq, then str('a')
	});
	it('find returns undefined on no match', () => {
		expect(w.find(tree, (r) => r.type === 'indent')).toBeUndefined();
	});
});

describe('RuleWalker deref wing', () => {
	const rules: Record<string, AnyRule> = {
		a: { type: SEQ, members: [sym('b'), str('lit')] } as AnyRule,
		b: { type: CHOICE, members: [sym('a'), str('deep')] } as AnyRule, // cycle a -> b -> a
	};
	const w = new RuleWalker(rules);
	it('deref resolves one step; undefined for unknown/non-symbol', () => {
		expect(w.deref(sym('a'))).toBe(rules.a);
		expect(w.deref(sym('nope'))).toBeUndefined();
		expect(w.deref(str('x'))).toBeUndefined();
	});
	it('deref throws when constructed without rules', () => {
		expect(() => new RuleWalker().deref(sym('a'))).toThrow(/rules/);
	});
	it('foldDeep follows refs and terminates on cycles', () => {
		const values = w.foldDeep(rules.a!, [] as string[], (acc, r) =>
			(r.type === STRING ? (acc.push(r.value), acc) : acc));
		expect(values.sort()).toEqual(['deep', 'lit']);
	});
	it('findDeep finds through refs, cycle-safe', () => {
		expect((w.findDeep(rules.a!, (r) => r.type === STRING && r.value === 'deep') as { value: string }).value).toBe('deep');
		expect(w.findDeep(rules.a!, (r) => r.type === 'indent')).toBeUndefined();
	});
	it('foldDeep visits a diamond-shared target only once', () => {
		const diamondRules: Record<string, AnyRule> = {
			s: { type: SEQ, members: [sym('x'), sym('y')] } as AnyRule,
			x: { type: SEQ, members: [sym('shared')] } as AnyRule,
			y: { type: SEQ, members: [sym('shared')] } as AnyRule,
			shared: str('once'),
		};
		const dw = new RuleWalker(diamondRules);
		const values = dw.foldDeep(diamondRules.s!, [] as string[], (acc, r) =>
			(r.type === STRING ? (acc.push(r.value), acc) : acc));
		expect(values).toEqual(['once']);
	});
});
