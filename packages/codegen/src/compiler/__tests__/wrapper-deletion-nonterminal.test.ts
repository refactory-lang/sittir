/**
 * Tests for wrapper-deletion `nonterminal` push-down (Task A2, Table 2).
 *
 * Wrapper terminality is pushed onto the wrappee, exactly like
 * fieldName / multiplicity / separator / aliasedFrom:
 *  - field / repeat / repeat1 → nonterminal: true (incl. terminal content)
 *  - optional → nonterminal: true ONLY if content intrinsically nonterminal
 *  - named alias → nonterminal: true
 */

import { ALIAS, FIELD, OPTIONAL, REPEAT, REPEAT1, STRING, SYMBOL } from '../rule-types.ts'; // @rule-type-consts
import { describe, it, expect } from 'vitest';
import { deleteWrapper } from '../wrapper-deletion.ts';
import type { Rule } from '../rule.ts';

const sym = (name: string): Rule => ({ type: SYMBOL, name });
const str = (value: string): Rule => ({ type: STRING, value });

describe('wrapper-deletion nonterminal push-down', () => {
	it('field(symbol) → nonterminal: true', () => {
		const out = deleteWrapper({ type: FIELD, name: 'x', content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('field(string) → nonterminal: true (field forces a slot)', () => {
		const out = deleteWrapper({ type: FIELD, name: 'x', content: str('kw') });
		expect(out.nonterminal).toBe(true);
	});

	it('repeat(terminal) → nonterminal: true (array slot)', () => {
		const out = deleteWrapper({ type: REPEAT, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('repeat1(terminal) → nonterminal: true (nonEmptyArray slot)', () => {
		const out = deleteWrapper({ type: REPEAT1, content: str(',') });
		expect(out.nonterminal).toBe(true);
	});

	it('optional(terminal) → no nonterminal stamp (no slot)', () => {
		const out = deleteWrapper({ type: OPTIONAL, content: str(',') });
		expect(out.nonterminal).toBeUndefined();
	});

	it('optional(symbol) → nonterminal: true (slot)', () => {
		const out = deleteWrapper({ type: OPTIONAL, content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('named alias → nonterminal: true', () => {
		const out = deleteWrapper({ type: ALIAS, named: true, value: 't', content: sym('y') });
		expect(out.nonterminal).toBe(true);
	});

	it('unnamed alias(terminal) → no nonterminal stamp', () => {
		const out = deleteWrapper({ type: ALIAS, named: false, value: 't', content: str(',') });
		expect(out.nonterminal).toBeUndefined();
	});
});
