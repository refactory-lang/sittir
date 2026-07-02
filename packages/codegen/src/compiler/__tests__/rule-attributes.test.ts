import { CHOICE, OPTIONAL, PATTERN, REPEAT, REPEAT1, SEQ, STRING, SYMBOL, TOKEN } from '../../types/rule-types.ts'; // @rule-type-consts
import { describe, expect, it } from 'vitest';
import type { Multiplicity, Rule, SymbolRule } from '../../types/rule.ts';
import { isNonterminalRuleType } from '../rule-catalog.ts';

const str = (value: string): Rule => ({ type: STRING, value });
const pat = (value: string): Rule => ({ type: PATTERN, value });
const sym = (name: string): Rule => ({ type: SYMBOL, name });

describe('RuleBase attribute extensions', () => {
	it('SymbolRule accepts fieldName attribute', () => {
		const r: SymbolRule = { type: SYMBOL, name: 'X', fieldName: 'x' };
		expect(r.fieldName).toBe('x');
	});

	it('SymbolRule accepts multiplicity attribute', () => {
		const r: SymbolRule = { type: SYMBOL, name: 'X', multiplicity: 'optional' };
		expect(r.multiplicity).toBe('optional');
	});

	it('SymbolRule accepts nonterminal attribute', () => {
		const r: SymbolRule = { type: SYMBOL, name: 'X', nonterminal: true };
		expect(r.nonterminal).toBe(true);
	});

	it('SymbolRule accepts structured separator', () => {
		const r: SymbolRule = {
			type: SYMBOL,
			name: 'X',
			separator: { rules: [{ type: 'STRING', value: ',' }], trailing: true }
		};
		expect((r.separator as { trailing?: boolean }).trailing).toBe(true);
	});

	it('Multiplicity type union has expected values', () => {
		const values: readonly Multiplicity[] = ['optional', 'single', 'array', 'nonEmptyArray'];
		expect(values).toHaveLength(4);
	});
});

describe('isNonterminalRuleType (Table 1 refined terminality)', () => {
	// --- deltas vs current classifyIntrinsic ---
	it('pattern → nonterminal (was terminal)', () => {
		expect(isNonterminalRuleType(pat('/x/'))).toBe(true);
	});

	it('literal-only enum → nonterminal (was recursive→terminal)', () => {
		// PR-P: enum-shaped ChoiceRule (all-STRING members) is unconditionally nonterminal.
		expect(isNonterminalRuleType({ type: CHOICE, members: [str('a'), str('b')] })).toBe(true);
	});

	it("token(string('fn')) → terminal (recursive: literal content)", () => {
		expect(isNonterminalRuleType({ type: TOKEN, content: str('fn'), immediate: false })).toBe(false);
	});

	it('token(pattern(/x/)) → nonterminal (recursive: value content)', () => {
		expect(isNonterminalRuleType({ type: TOKEN, content: pat('/x/'), immediate: false })).toBe(true);
	});

	it('choice of all string literals → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: CHOICE, members: [str('<'), str('>')] })).toBe(true);
	});

	it('repeat(terminal) → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: REPEAT, content: str(',') })).toBe(true);
	});

	it('repeat1(terminal) → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: REPEAT1, content: str(',') })).toBe(true);
	});

	// --- preserved (recursive) ---
	it('optional(terminal) → terminal (stays recursive)', () => {
		expect(isNonterminalRuleType({ type: OPTIONAL, content: str(',') })).toBe(false);
	});

	it('optional(symbol) → nonterminal (recursive)', () => {
		expect(isNonterminalRuleType({ type: OPTIONAL, content: sym('y') })).toBe(true);
	});

	it('seq distributes recursively (nonterminal iff any member is)', () => {
		expect(isNonterminalRuleType({ type: SEQ, members: [str(','), sym('y')] })).toBe(true);
		expect(isNonterminalRuleType({ type: SEQ, members: [str(','), str(';')] })).toBe(false);
	});

	// --- unchanged bases ---
	it('symbol → nonterminal; string → terminal', () => {
		expect(isNonterminalRuleType(sym('y'))).toBe(true);
		expect(isNonterminalRuleType(str(','))).toBe(false);
	});
});
