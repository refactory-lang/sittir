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
