import { describe, expect, it } from 'vitest';
import type { Multiplicity, Rule, SymbolRule } from '../rule.ts';
import { isNonterminalRuleType } from '../rule-catalog.ts';

const str = (value: string): Rule => ({ type: 'string', value });
const pat = (value: string): Rule => ({ type: 'pattern', value });
const sym = (name: string): Rule => ({ type: 'symbol', name });

describe('RuleBase attribute extensions', () => {
	it('SymbolRule accepts fieldName attribute', () => {
		const r: SymbolRule = { type: 'symbol', name: 'X', fieldName: 'x' };
		expect(r.fieldName).toBe('x');
	});

	it('SymbolRule accepts multiplicity attribute', () => {
		const r: SymbolRule = { type: 'symbol', name: 'X', multiplicity: 'optional' };
		expect(r.multiplicity).toBe('optional');
	});

	it('SymbolRule accepts nonterminal attribute', () => {
		const r: SymbolRule = { type: 'symbol', name: 'X', nonterminal: true };
		expect(r.nonterminal).toBe(true);
	});

	it('SymbolRule accepts structured separator', () => {
		const r: SymbolRule = {
			type: 'symbol',
			name: 'X',
			separator: { rules: [{ type: 'string', value: ',' }], trailing: true }
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
		expect(isNonterminalRuleType({ type: 'enum', members: [str('a'), str('b')] })).toBe(true);
	});

	it("token(string('fn')) → terminal (recursive: literal content)", () => {
		expect(isNonterminalRuleType({ type: 'token', content: str('fn'), immediate: false })).toBe(false);
	});

	it('token(pattern(/x/)) → nonterminal (recursive: value content)', () => {
		expect(isNonterminalRuleType({ type: 'token', content: pat('/x/'), immediate: false })).toBe(true);
	});

	it('choice of all string literals → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: 'choice', members: [str('<'), str('>')] })).toBe(true);
	});

	it('repeat(terminal) → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: 'repeat', content: str(',') })).toBe(true);
	});

	it('repeat1(terminal) → nonterminal (unconditional)', () => {
		expect(isNonterminalRuleType({ type: 'repeat1', content: str(',') })).toBe(true);
	});

	// --- preserved (recursive) ---
	it('optional(terminal) → terminal (stays recursive)', () => {
		expect(isNonterminalRuleType({ type: 'optional', content: str(',') })).toBe(false);
	});

	it('optional(symbol) → nonterminal (recursive)', () => {
		expect(isNonterminalRuleType({ type: 'optional', content: sym('y') })).toBe(true);
	});

	it('seq distributes recursively (nonterminal iff any member is)', () => {
		expect(isNonterminalRuleType({ type: 'seq', members: [str(','), sym('y')] })).toBe(true);
		expect(isNonterminalRuleType({ type: 'seq', members: [str(','), str(';')] })).toBe(false);
	});

	// --- unchanged bases ---
	it('symbol → nonterminal; string → terminal', () => {
		expect(isNonterminalRuleType(sym('y'))).toBe(true);
		expect(isNonterminalRuleType(str(','))).toBe(false);
	});
});
