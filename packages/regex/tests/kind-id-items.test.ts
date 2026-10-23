// A list slot that admits a token arm keeps that token's kind id as itself;
// the number is never read as a numeric value.
import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const rx = await createEngine(regex);

describe('a kind id among a list slot’s items', () => {
	it('stays the token it names', () => {
		const built = rx.build.characterClass({ classAtoms: [rx.kinds.BslashDash, 'a'] } as never);
		expect(String(built)).toBe('[\\-a]');
	});
});
