import { describe, it, expect } from 'vitest';
import { applyFormat } from '../src/format.ts';

describe('applyFormat', () => {
	it('returns canonical unchanged when FormatRecord is empty', () => {
		expect(applyFormat('fn foo() {}', {})).toBe('fn foo() {}');
	});

	it('prepends boundary.leading', () => {
		expect(applyFormat('fn foo() {}', { boundary: { leading: '  ' } })).toBe(
			'  fn foo() {}',
		);
	});

	it('appends boundary.trailing', () => {
		expect(applyFormat('fn foo() {}', { boundary: { trailing: '\n' } })).toBe(
			'fn foo() {}\n',
		);
	});

	it('applies both boundary.leading and boundary.trailing', () => {
		expect(
			applyFormat('fn foo() {}', { boundary: { leading: '/* pre */ ', trailing: ' // post' } }),
		).toBe('/* pre */ fn foo() {} // post');
	});

	it('inserts a single trivia item at a byte offset', () => {
		// "fn foo() {}" — insert " /* mid */" at offset 8 (the space before '{')
		// slice(0,8)="fn foo()" + " /* mid */" + slice(8)=" {}"
		expect(
			applyFormat('fn foo() {}', { trivia: [{ offset: 8, text: ' /* mid */' }] }),
		).toBe('fn foo() /* mid */ {}');
	});

	it('inserts multiple trivia items preserving offsets (descending)', () => {
		// "abcdef" — insert "X" at 2 and "Y" at 4 → "abXcdYef"
		expect(
			applyFormat('abcdef', {
				trivia: [
					{ offset: 4, text: 'Y' },
					{ offset: 2, text: 'X' },
				],
			}),
		).toBe('abXcdYef');
	});

	it('clamps trivia offset to string length', () => {
		expect(
			applyFormat('ab', { trivia: [{ offset: 100, text: '!' }] }),
		).toBe('ab!');
	});

	it('applies boundary before trivia (trivia offsets are into boundary-adjusted string)', () => {
		// boundary adds "  " prefix → "  fn foo()" (10 chars)
		// trivia offset 2 (after leading spaces) inserts "/**/": "  /**/fn foo()"
		expect(
			applyFormat('fn foo()', {
				boundary: { leading: '  ' },
				trivia: [{ offset: 2, text: '/**/' }],
			}),
		).toBe('  /**/fn foo()');
	});
});
