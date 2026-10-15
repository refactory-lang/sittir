import { describe, expect, it } from 'vitest';
import type { QueryPlan, QuerySubject, SlotSubject } from '@sittir/types';
import { holds, type PlanSubjects } from '../src/query.ts';

const DEF = 1;
const NAME = { slots: { [DEF]: 0 } };
const ASYNC = { slots: { [DEF]: 1 } };
const node = { name: ['__init__'], self: ['def __init__(self): pass'] };
const texts = (subject: QuerySubject): readonly string[] =>
	'self' in subject ? node.self : subject.slots[DEF] === 0 ? node.name : [];
const subjects: PlanSubjects = { texts };

describe('holds', () => {
	it('compares a slot\'s texts', () => {
		expect(holds({ op: 'eq', text: '__init__', ...NAME }, subjects)).toBe(true);
		expect(holds({ op: 'match', pattern: '^__', ...NAME }, subjects)).toBe(true);
	});

	it('compares the node\'s own text when the plan names itself', () => {
		const plan: QueryPlan<QuerySubject> = { op: 'match', pattern: '^def __', self: true };
		expect(holds(plan, subjects)).toBe(true);
		expect(holds({ op: 'eq', text: 'pass', self: true }, subjects)).toBe(false);
	});

	it('tests the node types in a slot, or the node\'s own type, when the plan is an `is`', () => {
		const types = (subject: QuerySubject): readonly number[] => ('self' in subject ? [7] : subject.slots[DEF] === 0 ? [1, 2] : []);
		expect(holds({ op: 'is', types: [2, 3], ...NAME }, { texts, types })).toBe(true);
		expect(holds({ op: 'is', types: [3], ...NAME }, { texts, types })).toBe(false);
		expect(holds({ op: 'is', types: [7], self: true }, { texts, types })).toBe(true);
		expect(holds({ op: 'not', of: { op: 'is', types: [3], ...NAME } }, { texts, types })).toBe(true);
	});

	it('holds a presence leaf when the slot has a child to read, and its negation when it has none', () => {
		expect(holds({ op: 'present', ...NAME }, subjects)).toBe(true);
		expect(holds({ op: 'present', ...ASYNC }, subjects)).toBe(false);
		expect(holds({ op: 'not', of: { op: 'present', ...ASYNC } }, subjects)).toBe(true);
	});

	it('refuses an `is` plan when the caller reads no node types', () => {
		expect(() => holds({ op: 'is', types: [1], ...NAME }, subjects)).toThrow(/is/);
	});

	it('holds a child step when its condition holds on a node its slot holds, narrowed by the anchor first', () => {
		interface Tree {
			readonly kind: number;
			readonly slot: number;
			readonly text: string;
			readonly children: readonly Tree[];
		}
		const [FUNCTION, PARAMETERS, PARAMETER, TYPE] = [10, 11, 12, 13];
		const leaf = (kind: number, text: string): Tree => ({ kind, slot: 0, text, children: [] });
		const subjectsOf = (tree: Tree): PlanSubjects => {
			const held = (subject: SlotSubject): readonly Tree[] => tree.children.filter((child) => subject.slots[tree.kind] === child.slot);
			return {
				texts: (subject) => ('self' in subject ? [tree.text] : held(subject).map((child) => child.text)),
				children: (subject) => held(subject).map(subjectsOf)
			};
		};
		const PARAM = { slots: { [PARAMETERS]: 0 } };
		const params = (...texts: string[]): PlanSubjects =>
			subjectsOf({ kind: PARAMETERS, slot: 0, text: '', children: texts.map((text) => ({ kind: PARAMETER, slot: 0, text, children: [leaf(TYPE, text)] })) });
		const typed = (text: string, anchor?: 'first' | 'last' | 'only'): QueryPlan => ({ op: 'child', ...PARAM, ...(anchor === undefined ? {} : { anchor }), of: { op: 'eq', text, slots: { [PARAMETER]: 0 } } });
		expect(holds(typed('i32'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('u8', 'first'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('i32', 'first'), params('u8', 'i32'))).toBe(false);
		expect(holds(typed('i32', 'last'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('u8', 'only'), params('u8'))).toBe(true);
		expect(holds(typed('u8', 'only'), params('u8', 'i32'))).toBe(false);
		const fn = subjectsOf({ kind: FUNCTION, slot: 0, text: '', children: [{ kind: PARAMETERS, slot: 1, text: '', children: [{ kind: PARAMETER, slot: 0, text: 'u8', children: [leaf(TYPE, 'u8')] }] }] });
		expect(holds({ op: 'child', slots: { [FUNCTION]: 1 }, of: typed('u8') }, fn)).toBe(true);
		expect(holds({ op: 'child', slots: { [FUNCTION]: 0 }, of: typed('u8') }, fn)).toBe(false);
		expect(holds({ op: 'child', slots: { [PARAMETERS]: 1 }, of: typed('u8') }, fn)).toBe(false);
	});

	it('spells true as an empty and, and false as an empty or', () => {
		expect(holds({ op: 'and', of: [] }, subjects)).toBe(true);
		expect(holds({ op: 'or', of: [] }, subjects)).toBe(false);
	});

	it('refuses a child step when the caller reads no children', () => {
		expect(() => holds({ op: 'child', ...NAME, of: { op: 'and', of: [] } }, subjects)).toThrow(/child/);
	});

	it('combines self and slot conditions', () => {
		expect(holds({ op: 'and', of: [{ op: 'eq', text: '__init__', ...NAME }, { op: 'not', of: { op: 'eq', text: 'x', self: true } }] }, subjects)).toBe(true);
	});
});
