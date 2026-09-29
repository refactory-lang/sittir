import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rx = await createEngine(regex);

describe('builders accept their kind spelled in full', () => {
	it('strips the literal delimiters around a pattern content', () => {
		expect(rx.build.identityEscape('\\.').$render()).toBe('\\.');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(rx.build.posixCharacterClass('[:alpha:]').$render()).toBe(rx.build.posixCharacterClass('alpha').$render());
	});
});
