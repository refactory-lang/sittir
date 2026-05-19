import { describe, expect, it } from 'vitest';
import type { Multiplicity, SymbolRule } from '../rule.ts';

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
