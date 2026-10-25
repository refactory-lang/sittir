import { describe, expect, it } from 'vitest';
import regex from '../src/index.ts';
import { createEngine } from '@sittir/common';

const re = await createEngine(regex);

describe('a regex renders no space between tokens, since its extras admit none', () => {
	it('keeps an escaped backslash and the trailing dash of a class adjacent', () => {
		expect(re.build.characterClass({ classAtoms: [re.build.identityEscape('\\')], trailing: true }).$render()).toBe('[\\\\-]');
	});

	it('keeps an escaped backslash and an escaped dash adjacent', () => {
		expect(re.build.characterClass({ classAtoms: [re.build.identityEscape('\\'), regex.kinds.BslashDash] }).$render()).toBe('[\\\\\\-]');
	});
});
