import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);

const atomsOf = (source: string) => {
	const group = (re.parse(source, { errors: 'throw' }).toJSON() as any).content.termGroups[0].content;
	return group;
};

describe('a literal aliased to a display reads as the display kind', () => {
	it('reads an escaped dash as identity_escape', () => {
		expect(atomsOf('[a\\-z]').classAtoms.map((atom: any) => atom.$type)).toEqual(['class_character', 'identity_escape', 'class_character']);
	});

	it('reads a leading and a trailing dash as the boolean it was', () => {
		expect(atomsOf('[-a]').leading).toBe(true);
		expect(atomsOf('[a-]').trailing).toBe(true);
	});

	it('builds the escaped dash as an identity escape and renders it back', () => {
		expect(re.build.characterClass({ classAtoms: [re.build.identityEscape('-')] }).$render()).toBe('[\\-]');
		expect(re.build.characterClass({ leading: true, classAtoms: [re.build.classCharacter('a')] }).$render()).toBe('[-a]');
	});

	it('still refuses the dash as a class_character of a class’s atoms, where it would read as a range', () => {
		expect(() => re.build.classCharacter('-')).toThrow(/text does not match/);
	});
});
