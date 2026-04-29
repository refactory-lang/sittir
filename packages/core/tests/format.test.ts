import { describe, it, expect } from 'vitest';
import type { FormatRecord } from '../src/types.ts';
import { applyFormat, rebaseTrivia } from '../src/format.ts';

describe('applyFormat', () => {
	it('returns canonical unchanged when FormatRecord is empty', () => {
		expect(applyFormat('fn foo() {}', {})).toBe('fn foo() {}');
	});

	it('prepends boundary.leading', () => {
		expect(applyFormat('fn foo() {}', { boundary: { leading: '  ' } })).toBe(
			'  fn foo() {}'
		);
	});

	it('appends boundary.trailing', () => {
		expect(applyFormat('fn foo() {}', { boundary: { trailing: '\n' } })).toBe(
			'fn foo() {}\n'
		);
	});

	it('applies both boundary.leading and boundary.trailing', () => {
		expect(
			applyFormat('fn foo() {}', {
				boundary: { leading: '/* pre */ ', trailing: ' // post' }
			})
		).toBe('/* pre */ fn foo() {} // post');
	});

	it('inserts a single trivia item at a byte offset', () => {
		// "fn foo() {}" — insert " /* mid */" at offset 8 (the space before '{')
		// slice(0,8)="fn foo()" + " /* mid */" + slice(8)=" {}"
		expect(
			applyFormat('fn foo() {}', {
				trivia: [{ offset: 8, text: ' /* mid */' }]
			})
		).toBe('fn foo() /* mid */ {}');
	});

	it('inserts multiple trivia items preserving offsets (descending)', () => {
		// "abcdef" — insert "X" at 2 and "Y" at 4 → "abXcdYef"
		expect(
			applyFormat('abcdef', {
				trivia: [
					{ offset: 4, text: 'Y' },
					{ offset: 2, text: 'X' }
				]
			})
		).toBe('abXcdYef');
	});

	it('clamps trivia offset to string length', () => {
		expect(applyFormat('ab', { trivia: [{ offset: 100, text: '!' }] })).toBe(
			'ab!'
		);
	});

	it('applies trivia before boundary (trivia offsets are into canonical string)', () => {
		// trivia offset 2 inserts "/**/" into canonical "fn foo()": "fn/**/ foo()"
		// boundary then adds "  " prefix: "  fn/**/ foo()"
		expect(
			applyFormat('fn foo()', {
				boundary: { leading: '  ' },
				trivia: [{ offset: 2, text: '/**/' }]
			})
		).toBe('  fn/**/ foo()');
	});
});

describe('FormatRecord JSON roundtrip', () => {
	it('FormatRecord survives JSON roundtrip', () => {
		const record: FormatRecord = {
			boundary: { leading: '\t', trailing: '\n' },
			trivia: [{ offset: 5, text: ' // comment' }],
			slots: { name: { sep: ', ' } },
			literals: { open: { raw: '{' } }
		};
		const serialized = JSON.stringify(record);
		const deserialized = JSON.parse(serialized) as FormatRecord;
		expect(deserialized).toEqual(record);
	});

	it('FormatRecord round-trips with optional fields absent', () => {
		const record: FormatRecord = { boundary: { leading: '    ' } };
		const deserialized = JSON.parse(JSON.stringify(record)) as FormatRecord;
		expect(deserialized).toEqual(record);
		expect(deserialized.trivia).toBeUndefined();
		expect(deserialized.slots).toBeUndefined();
	});
});

describe('rebaseTrivia', () => {
	it('returns a new object (shallow clone)', () => {
		const format: FormatRecord = { trivia: [{ offset: 5, text: '// hi' }] };
		const result = rebaseTrivia(format, 0, 3);
		expect(result).not.toBe(format);
	});

	it('leaves offsets below editStart unchanged', () => {
		const format: FormatRecord = {
			trivia: [
				{ offset: 3, text: '/* a */' },
				{ offset: 7, text: '/* b */' }
			]
		};
		const result = rebaseTrivia(format, 10, 5);
		expect(result.trivia).toEqual([
			{ offset: 3, text: '/* a */' },
			{ offset: 7, text: '/* b */' }
		]);
	});

	it('shifts offsets at or above editStart by delta', () => {
		const format: FormatRecord = {
			trivia: [
				{ offset: 3, text: 'A' },
				{ offset: 10, text: 'B' },
				{ offset: 20, text: 'C' }
			]
		};
		const result = rebaseTrivia(format, 10, 4);
		expect(result.trivia).toEqual([
			{ offset: 3, text: 'A' },
			{ offset: 14, text: 'B' },
			{ offset: 24, text: 'C' }
		]);
	});

	it('works with a negative delta (deletion)', () => {
		const format: FormatRecord = {
			trivia: [
				{ offset: 2, text: 'X' },
				{ offset: 15, text: 'Y' }
			]
		};
		const result = rebaseTrivia(format, 5, -3);
		expect(result.trivia).toEqual([
			{ offset: 2, text: 'X' },
			{ offset: 12, text: 'Y' }
		]);
	});

	it('rebases sub-records in kinds recursively', () => {
		const format: FormatRecord = {
			trivia: [{ offset: 1, text: 'root' }],
			kinds: {
				fn_item: {
					trivia: [
						{ offset: 5, text: 'inner' },
						{ offset: 20, text: 'after' }
					]
				}
			}
		};
		const result = rebaseTrivia(format, 10, 2);
		expect(result.trivia).toEqual([{ offset: 1, text: 'root' }]);
		expect(result.kinds?.['fn_item']?.trivia).toEqual([
			{ offset: 5, text: 'inner' },
			{ offset: 22, text: 'after' }
		]);
	});

	it('preserves other FormatRecord fields unchanged', () => {
		const format: FormatRecord = {
			boundary: { leading: '  ' },
			slots: { name: { sep: ', ' } },
			trivia: [{ offset: 5, text: '// x' }]
		};
		const result = rebaseTrivia(format, 3, 1);
		expect(result.boundary).toEqual({ leading: '  ' });
		expect(result.slots).toEqual({ name: { sep: ', ' } });
	});

	it('handles absent trivia gracefully (no trivia key)', () => {
		const format: FormatRecord = { boundary: { leading: '\t' } };
		const result = rebaseTrivia(format, 0, 10);
		expect(result.trivia).toBeUndefined();
		expect(result.boundary).toEqual({ leading: '\t' });
	});

	it('clamps trivia offset to 0 when large negative delta would produce negative offset', () => {
		// offset 3, delta -10 → 3 + (-10) = -7. Must clamp to 0, not -7.
		const format: FormatRecord = {
			trivia: [{ offset: 3, text: '// clamped' }]
		};
		const result = rebaseTrivia(format, 0, -10);
		expect(result.trivia?.[0]?.offset).toBe(0);
	});

	it('does not clamp when offset stays non-negative', () => {
		// offset 10, delta -3 → 7. No clamping needed.
		const format: FormatRecord = {
			trivia: [{ offset: 10, text: '// ok' }]
		};
		const result = rebaseTrivia(format, 0, -3);
		expect(result.trivia?.[0]?.offset).toBe(7);
	});
});
