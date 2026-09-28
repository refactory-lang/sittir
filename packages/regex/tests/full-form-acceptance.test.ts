import { describe, expect, it } from 'vitest';
import { ir } from '../src/ir.ts';

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(ir.identityEscape('\\.').$render()).toBe('\\.');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(ir.posixCharacterClass('[:alpha:]').$render()).toBe(ir.posixCharacterClass('alpha').$render());
	});
});
