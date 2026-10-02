import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rx = await createEngine(regex);

describe('builders and their kind spelled in full', () => {
	it('takes the delimiters in the text only when told they are there', () => {
		expect(rx.build.identityEscape('\\.', false).$render()).toBe('\\.');
	});

	it('strips the literal delimiters around a pattern leaf', () => {
		expect(rx.build.posixCharacterClass('[:alpha:]').$render()).toBe(rx.build.posixCharacterClass('alpha').$render());
	});
});
