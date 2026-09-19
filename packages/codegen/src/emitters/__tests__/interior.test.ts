import { describe, it, expect } from 'vitest';
import { assertUnambiguous, interiorEntryPattern, type InteriorEntry } from '../interior.ts';

describe('interiorEntryPattern', () => {
	it('escapes literals and names slots, flags and enums', () => {
		expect(interiorEntryPattern({ lit: '$' })).toBe('\\$');
		expect(interiorEntryPattern({ flag: 'b', text: 'b' })).toBe('(?<b>b)?');
		expect(interiorEntryPattern({ enum: 'suffix', values: ['u8', 'u16'], optional: true })).toBe('(?<suffix>u16|u8)?');
		expect(interiorEntryPattern({ slot: 'content', pattern: '[a-z]+' })).toBe('(?<content>[a-z]+)');
	});
});

describe('assertUnambiguous', () => {
	const slot = (pattern: string): InteriorEntry => ({ slot: 'content', pattern });

	it('accepts a flag before a literal and an enum after a slot that cannot spell it', () => {
		expect(() => assertUnambiguous('char_literal', [{ flag: 'b', text: 'b' }, { lit: "'" }, slot('[a-z]'), { lit: "'" }])).not.toThrow();
		expect(() =>
			assertUnambiguous('integer_literal', [slot('[0-9]+'), { enum: 'suffix', values: ['u8', 'i8'], optional: true }])
		).not.toThrow();
	});

	it('names the kind and both members when an optional flag is a prefix of the next slot', () => {
		expect(() => assertUnambiguous('word', [{ flag: 'b', text: 'b' }, slot('[a-z]+')])).toThrow(
			/'word' is ambiguous — b \("b"\) is also a prefix of what content accepts/
		);
	});

	it('names the kind and both members when an optional enum is all the previous slot accepts', () => {
		expect(() =>
			assertUnambiguous('num', [slot('[a-z0-9]+'), { enum: 'suffix', values: ['f32'], optional: true }])
		).toThrow(/'num' is ambiguous — suffix \("f32"\) is also all that content accepts/);
	});
});
