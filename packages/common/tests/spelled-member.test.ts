import { describe, expect, it } from 'vitest';
import { spelledMember } from '../src/spelled.ts';

describe('spelledMember', () => {
	const spellings = { BR: 'rb', F: 'f' };

	it('reads a spelling as its member, and a member or unknown text as itself', () => {
		expect(spelledMember('BR', spellings)).toBe('rb');
		expect(spelledMember('rb', spellings)).toBe('rb');
		expect(spelledMember(undefined, spellings)).toBeUndefined();
		expect(spelledMember('BR', undefined)).toBe('BR');
	});

	it("reads only the map's own spellings, never an inherited property", () => {
		for (const text of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) expect(spelledMember(text, spellings)).toBe(text);
	});
});
