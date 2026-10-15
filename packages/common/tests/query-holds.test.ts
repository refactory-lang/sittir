import { describe, expect, it } from 'vitest';
import type { QueryPlan, QuerySubject, SlotRoutes } from '@sittir/types';
import { holds, type PlanSubjects } from '../src/query.ts';

const NAME = { fields: ['name'], kinds: [] };
const node = { name: ['__init__'], self: ['def __init__(self): pass'] };
const texts = (subject: QuerySubject): readonly string[] =>
	'self' in subject ? node.self : subject.fields.includes('name') ? node.name : [];
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
		const types = (subject: QuerySubject): readonly number[] => ('self' in subject ? [7] : subject.fields.includes('name') ? [1, 2] : []);
		expect(holds({ op: 'is', types: [2, 3], ...NAME }, { texts, types })).toBe(true);
		expect(holds({ op: 'is', types: [3], ...NAME }, { texts, types })).toBe(false);
		expect(holds({ op: 'is', types: [7], self: true }, { texts, types })).toBe(true);
		expect(holds({ op: 'not', of: { op: 'is', types: [3], ...NAME } }, { texts, types })).toBe(true);
	});

	it('holds a presence leaf when the slot has a child to read, and its negation when it has none', () => {
		expect(holds({ op: 'present', ...NAME }, subjects)).toBe(true);
		expect(holds({ op: 'present', fields: ['async'], kinds: [] }, subjects)).toBe(false);
		expect(holds({ op: 'not', of: { op: 'present', fields: ['async'], kinds: [] } }, subjects)).toBe(true);
	});

	it('refuses an `is` plan when the caller reads no node types', () => {
		expect(() => holds({ op: 'is', types: [1], ...NAME }, subjects)).toThrow(/is/);
	});

	it('holds a child step when its condition holds on a child the routes admit, narrowed by the anchor first', () => {
		interface Tree {
			readonly kind: string;
			readonly text: string;
			readonly children: readonly Tree[];
		}
		const leaf = (kind: string, text: string): Tree => ({ kind, text, children: [] });
		const subjectsOf = (tree: Tree): PlanSubjects => {
			const admitted = (routes: SlotRoutes): readonly Tree[] => tree.children.filter((child) => routes.kinds.includes(child.kind));
			return {
				texts: (subject) => ('self' in subject ? [tree.text] : admitted(subject).map((child) => child.text)),
				children: (routes) => admitted(routes).map(subjectsOf)
			};
		};
		const PARAM = { fields: [], kinds: ['parameter'] };
		const params = (...texts: string[]): PlanSubjects => subjectsOf({ kind: 'parameters', text: '', children: texts.map((text) => ({ kind: 'parameter', text, children: [leaf('type', text)] })) });
		const typed = (text: string, anchor?: 'first' | 'last' | 'only'): QueryPlan => ({ op: 'child', ...PARAM, ...(anchor === undefined ? {} : { anchor }), of: { op: 'eq', text, fields: [], kinds: ['type'] } });
		expect(holds(typed('i32'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('u8', 'first'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('i32', 'first'), params('u8', 'i32'))).toBe(false);
		expect(holds(typed('i32', 'last'), params('u8', 'i32'))).toBe(true);
		expect(holds(typed('u8', 'only'), params('u8'))).toBe(true);
		expect(holds(typed('u8', 'only'), params('u8', 'i32'))).toBe(false);
		expect(holds({ op: 'child', fields: [], kinds: ['parameters'], of: typed('u8') }, subjectsOf({ kind: 'function', text: '', children: [{ kind: 'parameters', text: '', children: [{ kind: 'parameter', text: 'u8', children: [leaf('type', 'u8')] }] }] }))).toBe(true);
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
