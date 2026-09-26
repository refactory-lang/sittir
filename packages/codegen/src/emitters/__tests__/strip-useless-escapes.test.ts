import { describe, it, expect } from 'vitest';
import { stripUselessEscapes } from '../shared.ts';

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
