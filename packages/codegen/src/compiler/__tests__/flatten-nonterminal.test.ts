/**
 * Tests for flatten's `nonterminal` push-down.
 *
 * Wrapper terminality is pushed onto the wrappee, exactly like
 * fieldName / multiplicity / separator / aliasedFrom:
 *  - field / repeat / repeat1 → nonterminal: true (incl. terminal content)
 *  - optional → nonterminal: true ONLY if content intrinsically nonterminal
 *  - named alias → nonterminal: true
 */

import { ALIAS, FIELD, OPTIONAL, REPEAT, REPEAT1, STRING, SYMBOL } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { flatten } from '../flatten.ts';
import type { Rule } from '../../types/rule.ts';

const sym = (name: string): Rule => ({ type: SYMBOL, name });
const str = (value: string): Rule => ({ type: STRING, value });

describe('wrapper-deletion nonterminal push-down', () => {
	it('field(symbol) → nonterminal: true', () => {
		const out = flatten({ type: FIELD, name: 'x', content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('field(string) → nonterminal: true (field forces a slot)', () => {
		const out = flatten({ type: FIELD, name: 'x', content: str('kw') });
		expect(out.nonterminal).toBe(true);
	});

	it('repeat(terminal) → nonterminal: true (array slot)', () => {
		const out = flatten({ type: REPEAT, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('repeat1(terminal) → nonterminal: true (nonEmptyArray slot)', () => {
		const out = flatten({ type: REPEAT1, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('optional(terminal) → no nonterminal stamp (no slot)', () => {
		const out = flatten({ type: OPTIONAL, content: str(',') });
		expect(out.nonterminal).toBeUndefined();
	});

	it('optional(symbol) → nonterminal: true (slot)', () => {
		const out = flatten({ type: OPTIONAL, content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('named alias → nonterminal: true', () => {
		const out = flatten({ type: ALIAS, named: true, value: 't', content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('alias(terminal) → nonterminal stamp (link resolves unnamed aliases before flatten; every alias here is a named kind)', () => {
		const out = flatten({ type: ALIAS, named: true, value: 't', content: str(',') });
		expect(out).toMatchObject({ nonterminal: true, aliasedTo: 't' });
	});
});
