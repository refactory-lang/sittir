import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';
import { TSKindId } from '../src/types.ts';

const re = await createEngine(regex);

const classOf = (source: string) => {
	const root = re.parse(source, { errors: 'throw' }).content();
	if (!('termGroups' in root)) throw new Error(`${source} did not parse as a single term`);
	const content = root.termGroups()[0].content();
	if (typeof content !== 'object' || !('classAtoms' in content)) throw new Error(`${source} did not parse as a character class`);
	return content;
};

describe('a literal aliased to a display reads as the display kind', () => {
	it('reads an escaped dash as identity_escape', () => {
		expect(classOf('[a\\-z]').classAtoms().map((atom) => atom.$type)).toEqual([TSKindId.ClassCharacter, TSKindId.IdentityEscape, TSKindId.ClassCharacter]);
	});

	it('reads a leading and a trailing dash as the boolean it was', () => {
		expect(classOf('[-a]').leading()).toBe(true);
		expect(classOf('[a-]').trailing()).toBe(true);
	});

	it('builds the escaped dash as an identity escape and renders it back', () => {
		expect(re.build.characterClass({ classAtoms: [re.build.identityEscape('-')] }).$render()).toBe('[\\-]');
		expect(re.build.characterClass({ leading: true, classAtoms: [re.build.classCharacter('a')] }).$render()).toBe('[-a]');
	});

	it('still refuses the dash as a class_character of a class’s atoms, where it would read as a range', () => {
		expect(() => re.build.classCharacter('-')).toThrow(/text does not match/);
	});
});
