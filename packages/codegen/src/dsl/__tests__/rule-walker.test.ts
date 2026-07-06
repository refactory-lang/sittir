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
		expect(w.childrenOf({ type: 'SUPERTYPE', name: 's', subtypes: ['a'] } as AnyRule)).toEqual([]);
	});
	it('separator string form (evaluate-phase, unlifted) contributes no edges', () => {
		const r = { type: REPEAT, content: sym('x'), separator: ',' } as AnyRule;
		expect(w.childrenOf(r)).toEqual([sym('x')]);
	});
	it('separator nested-object form contributes its value (stamped leaf, PR-S)', () => {
		const sep = str(',');
		const leaf = { type: SYMBOL, name: 'x', separator: { value: sep, trailing: true } } as AnyRule;
		expect(w.childrenOf(leaf)).toEqual([sep]);
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

describe('map rebuilds through separator edges', () => {
	// REPEAT's typed `separator` is the nested {value, trailing?, leading?}
	// fact (RuleBase<'normalize'>['separator'] / RepeatRule<'link'>.separator,
	// PR-S) — `value` is a real Rule<T> child edge; `trailing`/`leading` are
	// boolean siblings on the wrapper object, not rule-tree edges. These
	// fixtures don't correspond to any single real `Rule<T>` variant — hence
	// the double cast through `unknown`.
	it('rebuilds a separator.value edge when its content changes', () => {
		const w = new RuleWalker();
		const tree = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: sym('old') }
		} as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r));
		expect((out as unknown as { separator: { value: AnyRule } }).separator.value).toEqual(sym('new'));
	});

	it('rebuilds the separator object (preserving trailing) when its value changes', () => {
		const w = new RuleWalker();
		const tree = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: sym('old'), trailing: true }
		} as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r));
		const sep = (out as unknown as { separator: { value: AnyRule; trailing?: boolean } }).separator;
		expect(sep.value).toEqual(sym('new'));
		expect(sep.trailing).toBe(true);
	});

	it('returns the same reference when nothing changes, including inside separator.value', () => {
		const w = new RuleWalker();
		const tree = {
			type: REPEAT,
			content: sym('item'),
			separator: { value: sym('comma') }
		} as unknown as AnyRule;
		expect(w.map(tree, (r) => r)).toBe(tree);
	});

	it('preserves the members reference when only the separator edge changes (SEQ with both edges)', () => {
		const w = new RuleWalker();
		const members = [str('a'), str('b')];
		const tree = { type: SEQ, members, separator: { value: sym('old') } } as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r)) as unknown as { members: AnyRule[]; separator: { value: AnyRule } };
		expect(out.members).toBe(members);
		expect(out.separator.value).toEqual(sym('new'));
	});

	it('preserves the separator reference when only content changes (REPEAT with both edges)', () => {
		const w = new RuleWalker();
		const separator = { value: sym('comma') };
		const tree = { type: REPEAT, content: sym('old'), separator } as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === SYMBOL && (r as { name: string }).name === 'old' ? sym('new') : r)) as unknown as { content: AnyRule; separator: { value: AnyRule } };
		expect(out.separator).toBe(separator);
		expect((out.content as { name: string }).name).toBe('new');
	});

	it('preserves trailing/leading flags on an untouched separator edge', () => {
		const w = new RuleWalker();
		const separator = { value: sym('comma'), trailing: true, leading: false };
		const tree = { type: SEQ, members: [str('old')], separator } as unknown as AnyRule;
		const out = w.map(tree, (r) => (r.type === STRING && r.value === 'old' ? str('new') : r)) as unknown as { separator: { value: AnyRule; trailing: boolean; leading: boolean } };
		expect(out.separator).toBe(separator);
		expect(out.separator.trailing).toBe(true);
		expect(out.separator.leading).toBe(false);
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
		expect(w.find(tree, (r) => r.type === 'INDENT')).toBeUndefined();
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
		expect(w.findDeep(rules.a!, (r) => r.type === 'INDENT')).toBeUndefined();
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
