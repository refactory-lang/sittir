import { describe, it, expect } from 'vitest';
import { validateFast as validate } from '../../src/validate-fast.js';

describe('validate()', () => {
	it('returns ok: true for a valid Rust struct declaration', () => {
		const result = validate('pub struct Empty;');
		expect(result.ok).toBe(true);
	});

	it('returns ok: false with an error entry for an unclosed brace', () => {
		const result = validate('pub struct Broken {');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].kind).toBe('ERROR');
			expect(typeof result.errors[0].offset).toBe('number');
		}
	});

	it('returns ok: false when a Rust keyword is used as an identifier', () => {
		// `fn` is a reserved keyword — tree-sitter emits an ERROR node here
		const result = validate('pub struct fn;');
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.errors.length).toBeGreaterThan(0);
			expect(result.errors[0].kind).toBe('ERROR');
		}
	});
});
