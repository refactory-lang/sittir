import { describe, expect, it } from 'vitest';
import type { QueryPlan, QuerySubject } from '@sittir/types';
import { holds } from '../src/query.ts';

const NAME = { fields: ['name'], kinds: [] };
const node = { name: ['__init__'], self: ['def __init__(self): pass'] };
const texts = (subject: Parameters<Parameters<typeof holds>[1]>[0]): readonly string[] =>
	'self' in subject ? node.self : subject.fields.includes('name') ? node.name : [];

describe('holds', () => {
	it('compares a slot\'s texts', () => {
		expect(holds({ op: 'eq', text: '__init__', ...NAME }, texts)).toBe(true);
		expect(holds({ op: 'match', pattern: '^__', ...NAME }, texts)).toBe(true);
	});

	it('compares the node\'s own text when the plan names itself', () => {
		const plan: QueryPlan<QuerySubject> = { op: 'match', pattern: '^def __', self: true };
		expect(holds(plan, texts)).toBe(true);
		expect(holds({ op: 'eq', text: 'pass', self: true }, texts)).toBe(false);
	});

	it('tests the node types in a slot, or the node\'s own type, when the plan is an `is`', () => {
		const types = (subject: QuerySubject): readonly number[] => ('self' in subject ? [7] : subject.fields.includes('name') ? [1, 2] : []);
		expect(holds({ op: 'is', types: [2, 3], ...NAME }, texts, types)).toBe(true);
		expect(holds({ op: 'is', types: [3], ...NAME }, texts, types)).toBe(false);
		expect(holds({ op: 'is', types: [7], self: true }, texts, types)).toBe(true);
		expect(holds({ op: 'not', of: { op: 'is', types: [3], ...NAME } }, texts, types)).toBe(true);
	});

	it('refuses an `is` plan when the caller reads no node types', () => {
		expect(() => holds({ op: 'is', types: [1], ...NAME }, texts)).toThrow(/is/);
	});

	it('combines self and slot conditions', () => {
		expect(holds({ op: 'and', of: [{ op: 'eq', text: '__init__', ...NAME }, { op: 'not', of: { op: 'eq', text: 'x', self: true } }] }, texts)).toBe(true);
	});
});
