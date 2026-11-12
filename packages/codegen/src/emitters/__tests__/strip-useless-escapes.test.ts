import { describe, it, expect } from 'vitest';
import { anchoredLeafRegex, stripUselessEscapes } from '../../compiler/model/leaf-pattern.ts';

const accepts = (source: string, text: string): boolean => new RegExp(`^(?:${source})$`, 'u').test(text);

describe('stripUselessEscapes', () => {
	it('drops an escape that is literal inside a class without changing what the class matches', () => {
		const original = '[eE][\\+-]?[\\.\\*\\?\\(\\)\\{\\}\\|\\$\\/]';
		const stripped = stripUselessEscapes(original);
		expect(stripped).toBe('[eE][+-]?[.*?(){}|$/]');
		for (const text of ['e+.', 'E-*', 'e?(', 'e)/', 'e{|', 'e}$', 'e-', 'x+.', 'e+a']) {
			expect(accepts(stripped, text)).toBe(accepts(original, text));
		}
	});

	it('keeps the escapes that change meaning inside a class', () => {
		expect(stripUselessEscapes('[\\\\\\]\\^a\\-z]')).toBe('[\\\\\\]^a\\-z]');
	});

	it('keeps an escaped caret only as the first character of a class', () => {
		expect(stripUselessEscapes('[\\^a]')).toBe('[\\^a]');
		const original = '[^\\^$]';
		const stripped = stripUselessEscapes(original);
		expect(stripped).toBe('[^^$]');
		for (const text of ['^', '$', 'a']) expect(accepts(stripped, text)).toBe(accepts(original, text));
	});

	it('leaves an escaped bracket outside a class alone', () => {
		expect(stripUselessEscapes('\\[a\\]')).toBe('\\[a\\]');
	});
});

describe('anchoredLeafRegex', () => {
	it("reads a leaf pattern's classes and dot as tree-sitter lexes them", () => {
		const leaf = (pattern: string) => anchoredLeafRegex('leaf', pattern)!;
		expect(leaf('\\s+').test('\u00a0')).toBe(false);
		expect(leaf('[^\\s]+').test('\u00a0\u0085')).toBe(true);
		expect(leaf('#.*').test('#a\rb\u2028')).toBe(true);
		expect(leaf('#.*').test('#a\nb')).toBe(false);
	});
});
