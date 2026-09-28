import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ir.escapeSequence('\\n').$render()).toBe('\\n');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(ir.capture('@x').$render()).toBe('@x');
		expect(ir.capture('x').$render()).toBe('@x');
	});
});
