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
