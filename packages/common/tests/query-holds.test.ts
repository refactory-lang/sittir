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

	it('combines self and slot conditions', () => {
		expect(holds({ op: 'and', of: [{ op: 'eq', text: '__init__', ...NAME }, { op: 'not', of: { op: 'eq', text: 'x', self: true } }] }, texts)).toBe(true);
	});
});
