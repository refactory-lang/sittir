/**
 * Unit tests for `hasAnyField` (dsl/rule-transforms.ts) — the link-phase
 * walker that determines whether a rule tree contains a FIELD anywhere
 * reachable through transparent wrapper structure.
 */

import { ALIAS, FIELD, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import type { AnyRule, Rule } from '../../types/rule.ts';
import { hasAnyField } from '../rule-transforms.ts';

const field = (name: string, content: AnyRule): AnyRule => ({ type: FIELD, name, content }) as AnyRule;
const sym = (name: string): AnyRule => ({ type: SYMBOL, name }) as AnyRule;
const run = (rule: AnyRule): boolean => hasAnyField(rule as Rule<'link'>);

describe('hasAnyField', () => {
	it('finds a field wrapped in an ALIAS', () => {
		const rule = { type: ALIAS, content: field('name', sym('identifier')), named: true, value: 'name' } as AnyRule;
		expect(run(rule)).toBe(true);
	});

	it('finds a field wrapped in a TOKEN', () => {
		const rule = { type: TOKEN, content: field('name', sym('identifier')), immediate: false } as AnyRule;
		expect(run(rule)).toBe(true);
	});

	it('finds a field nested under ALIAS wrapping a SEQ', () => {
		const rule = {
			type: ALIAS,
			content: { type: SEQ, members: [{ type: STRING, value: '=' }, field('value', sym('identifier'))] },
			named: true,
			value: 'assignment'
		} as AnyRule;
		expect(run(rule)).toBe(true);
	});

	it('reports no field for an ALIAS/TOKEN with no field inside', () => {
		expect(run({ type: ALIAS, content: sym('identifier'), named: true, value: 'name' } as AnyRule)).toBe(false);
		expect(run({ type: TOKEN, content: sym('identifier'), immediate: false } as AnyRule)).toBe(false);
	});
});
