import { describe, it, expect } from 'vitest';
import { AssembledBranch } from '../../compiler/model/node-map.ts';
import { CHOICE, FIELD, PATTERN, SEQ, STRING } from '../../types/rule-types.ts'; // @rule-type-consts
import { flatten } from '../../compiler/flatten.ts';
import { assertUnambiguous, interiorEntryPattern, interiorOf, type InteriorEntry } from '../interior.ts';

describe('interiorEntryPattern', () => {
	it('escapes literals and names slots, flags and enums', () => {
		expect(interiorEntryPattern({ lit: '$' })).toBe('\\$');
		expect(interiorEntryPattern({ flag: 'b', text: 'b' })).toBe('(?<b>b)?');
		expect(interiorEntryPattern({ enum: 'suffix', values: ['u8', 'u16'], optional: true })).toBe('(?<suffix>u16|u8)?');
		expect(interiorEntryPattern({ slot: 'content', pattern: '[a-z]+' })).toBe('(?<content>[a-z]+)');
	});

	it('makes an optional pattern slot an optional group', () => {
		expect(interiorEntryPattern({ slot: 'fraction', pattern: '\\d+', optional: true })).toBe('(?<fraction>\\d+)?');
	});
});

describe('assertUnambiguous', () => {
	const slot = (pattern: string): InteriorEntry => ({ slot: 'content', pattern });

	it('leaves a slot beside an optional literal to the regex: slots match left to right, greedy', () => {
		expect(() => assertUnambiguous('char_literal', [{ flag: 'b', text: 'b' }, { lit: "'" }, slot('[a-z]'), { lit: "'" }])).not.toThrow();
		expect(() => assertUnambiguous('word', [{ flag: 'b', text: 'b' }, slot('[a-z]+')])).not.toThrow();
		expect(() =>
			assertUnambiguous('num', [slot('[a-z0-9]+'), { enum: 'suffix', values: ['f32'], optional: true }])
		).not.toThrow();
	});

	it('names the kind and both members when an optional literal and the literal after it share a prefix', () => {
		expect(() => assertUnambiguous('word', [{ flag: 'b', text: 'b' }, { lit: 'br' }, slot('[a-z]+')])).toThrow(
			/'word' is ambiguous — b \("b"\) and "br" \("br"\) are not distinguishable at their first differing character/
		);
	});

	it('accepts an optional literal whose text differs from the next literal at its first character', () => {
		expect(() => assertUnambiguous('word', [{ flag: 'b', text: 'b' }, { lit: 'r' }, slot('[a-z]+')])).not.toThrow();
	});
});

describe('interiorOf', () => {
	const lexed = (rule: object): AssembledBranch => {
		const flat = { ...(flatten(rule as never) as object), lexed: true } as never;
		return new AssembledBranch('shape', flat, flat);
	};

	it('fails closed, naming the kind, when a lexed kind is not a sequence', () => {
		const node = lexed({ type: CHOICE, members: [{ type: STRING, value: 'a' }, { type: STRING, value: 'b' }] });
		expect(() => interiorOf(node)).toThrow(/'shape' is a lexed kind but its render rule is a CHOICE/);
	});

	it('fails closed, naming the kind and the member, when a member is neither template text nor a slot', () => {
		const node = lexed({
			type: SEQ,
			members: [
				{ type: STRING, value: '#' },
				{ type: FIELD, name: 'content', content: { type: PATTERN, value: '[a-z]+' } },
				{ type: PATTERN, value: '[0-9]' }
			]
		});
		expect(() => interiorOf(node)).toThrow(/'shape' is a lexed kind but member of type PATTERN is neither template text nor a slot/);
	});
});
