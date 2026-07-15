import { describe, it, expect } from 'vitest';
import { detectRepeatSeparator, rulesEqual } from '../list-patterns.ts';

describe('rulesEqual does not crash comparing mixed-phase repeat separators', () => {
	it('returns false (not a throw) for an object-shaped separator vs a plain string', () => {
		const linkPhase = {
			type: 'repeat',
			content: { type: 'symbol', name: 'item' },
			separator: { value: { type: 'string', value: ',' } }
		};
		const evaluatePhase = {
			type: 'repeat',
			content: { type: 'symbol', name: 'item' },
			separator: ','
		};
		expect(() => rulesEqual(linkPhase as never, evaluatePhase as never)).not.toThrow();
		expect(rulesEqual(linkPhase as never, evaluatePhase as never)).toBe(false);
	});
});

describe('detectRepeatSeparator preserves a choice-shaped separator', () => {
	it('returns the full CHOICE rule, not just its first string arm', () => {
		const seq = {
			type: 'SEQ',
			members: [
				{
					type: 'CHOICE',
					members: [
						{ type: 'STRING', value: ',' },
						{ type: 'STRING', value: ';' }
					]
				},
				{ type: 'SYMBOL', name: 'item' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result).not.toBeNull();
		expect(result!.separator).toEqual({
			type: 'CHOICE',
			members: [
				{ type: 'STRING', value: ',' },
				{ type: 'STRING', value: ';' }
			]
		});
	});

	it('still returns a bare STRING separator for the plain-literal case (unchanged)', () => {
		const seq = {
			type: 'SEQ',
			members: [
				{ type: 'STRING', value: ',' },
				{ type: 'SYMBOL', name: 'item' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result!.separator).toEqual({ type: 'STRING', value: ',' });
	});

	it('preserves trailing when the separator comes second', () => {
		const seq = {
			type: 'SEQ',
			members: [
				{ type: 'SYMBOL', name: 'item' },
				{ type: 'STRING', value: ',' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result!.trailing).toBe(true);
		expect(result!.separator).toEqual({ type: 'STRING', value: ',' });
	});

	it('preserves a mixed literal/non-literal choice in full (tree-sitter-typescript sepBy1 shape)', () => {
		// e.g. `sepBy1(choice(',', $._semicolon), X)` — the separator position is
		// a choice of a literal and an external symbol. The FULL choice,
		// including the non-string arm, must survive the detector unnarrowed.
		const seq = {
			type: 'SEQ',
			members: [
				{
					type: 'CHOICE',
					members: [
						{ type: 'STRING', value: ',' },
						{ type: 'SYMBOL', name: '_semicolon' }
					]
				},
				{ type: 'SYMBOL', name: 'item' }
			]
		};
		const result = detectRepeatSeparator(seq);
		expect(result!.separator).toEqual({
			type: 'CHOICE',
			members: [
				{ type: 'STRING', value: ',' },
				{ type: 'SYMBOL', name: '_semicolon' }
			]
		});
	});
});

describe('rulesEqual handles previously-unhandled rule shapes (no false-negative on identical nodes)', () => {
	it('BLANK equals BLANK', () => {
		expect(rulesEqual({ type: 'BLANK' } as never, { type: 'BLANK' } as never)).toBe(true);
	});

	it('TOKEN / IMMEDIATE_TOKEN compare by content (and are not equal across the two token types)', () => {
		const a = { type: 'TOKEN', content: { type: 'STRING', value: 'x' } };
		const b = { type: 'TOKEN', content: { type: 'STRING', value: 'x' } };
		const c = { type: 'TOKEN', content: { type: 'STRING', value: 'y' } };
		const imm = { type: 'IMMEDIATE_TOKEN', content: { type: 'STRING', value: 'x' } };
		expect(rulesEqual(a as never, b as never)).toBe(true);
		expect(rulesEqual(a as never, c as never)).toBe(false);
		// Different type tag (TOKEN vs IMMEDIATE_TOKEN) is never equal even with same content.
		expect(rulesEqual(a as never, imm as never)).toBe(false);
	});

	it('PREC family compares BOTH value and content', () => {
		const p1 = { type: 'PREC', value: 5, content: { type: 'STRING', value: 'x' } };
		const p2 = { type: 'PREC', value: 5, content: { type: 'STRING', value: 'x' } };
		const pDiffValue = { type: 'PREC', value: 6, content: { type: 'STRING', value: 'x' } };
		const pDiffContent = { type: 'PREC', value: 5, content: { type: 'STRING', value: 'y' } };
		expect(rulesEqual(p1 as never, p2 as never)).toBe(true);
		expect(rulesEqual(p1 as never, pDiffValue as never)).toBe(false);
		expect(rulesEqual(p1 as never, pDiffContent as never)).toBe(false);
		// PREC_LEFT / PREC_RIGHT / PREC_DYNAMIC each carry value + content too.
		const left1 = { type: 'PREC_LEFT', value: 1, content: { type: 'SYMBOL', name: 'e' } };
		const left2 = { type: 'PREC_LEFT', value: 1, content: { type: 'SYMBOL', name: 'e' } };
		expect(rulesEqual(left1 as never, left2 as never)).toBe(true);
	});

	it('ALIAS compares content, value (target name), and named', () => {
		const base = { type: 'ALIAS', content: { type: 'SYMBOL', name: '_x' }, value: 'y', named: true };
		const same = { type: 'ALIAS', content: { type: 'SYMBOL', name: '_x' }, value: 'y', named: true };
		const diffValue = { type: 'ALIAS', content: { type: 'SYMBOL', name: '_x' }, value: 'z', named: true };
		const diffNamed = { type: 'ALIAS', content: { type: 'SYMBOL', name: '_x' }, value: 'y', named: false };
		const diffContent = { type: 'ALIAS', content: { type: 'SYMBOL', name: '_w' }, value: 'y', named: true };
		expect(rulesEqual(base as never, same as never)).toBe(true);
		expect(rulesEqual(base as never, diffValue as never)).toBe(false);
		expect(rulesEqual(base as never, diffNamed as never)).toBe(false);
		expect(rulesEqual(base as never, diffContent as never)).toBe(false);
	});
});
