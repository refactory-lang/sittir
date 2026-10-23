import { describe, it, expect } from 'vitest';
import { interiorPattern, lexedConfig, projectInterior, type TokenInterior } from '../src/interior.ts';

const CHAR: TokenInterior = {
	regex: "^(?<b>b)?'(?<content>[^\\\\']|\\\\.)'$",
	slots: [
		{ name: 'b', propertyName: 'b', flag: true },
		{ name: 'content', propertyName: 'content' }
	]
};

const INTEGER: TokenInterior = {
	regex: '^(?<content>[0-9][0-9_]*)(?<suffix>isize|u8)?$',
	slots: [
		{ name: 'content', propertyName: 'content' },
		{ name: 'suffix', propertyName: 'suffix' }
	]
};

describe('interiorPattern', () => {
	it('reuses the compiled RegExp for the same token interior', () => {
		const pattern = interiorPattern(CHAR);
		expect(interiorPattern(CHAR)).toBe(pattern);
		projectInterior("'a'", CHAR, 'char_literal');
		expect(interiorPattern(CHAR)).toBe(pattern);
	});

	it('keeps repeated tests independent when the pattern is shared', () => {
		const pattern = interiorPattern(INTEGER);
		expect(pattern.test('12')).toBe(true);
		expect(pattern.test('12')).toBe(true);
		expect(pattern.test('12z')).toBe(false);
		expect(pattern.test('12isize')).toBe(true);
	});
});

describe('projectInterior', () => {
	it('strips the affixes and stores the content', () => {
		expect(projectInterior("'a'", CHAR, 'char_literal')).toEqual({ b: false, content: 'a' });
	});

	it('reads a present flag as true', () => {
		expect(projectInterior("b'a'", CHAR, 'char_literal')).toEqual({ b: true, content: 'a' });
	});

	it('leaves an absent optional enum undefined', () => {
		expect(projectInterior('12', INTEGER, 'integer_literal')).toEqual({ content: '12', suffix: undefined });
		expect(projectInterior('12isize', INTEGER, 'integer_literal')).toEqual({ content: '12', suffix: 'isize' });
	});

	it('throws naming the kind when the text is not the token', () => {
		expect(() => projectInterior('12z', INTEGER, 'integer_literal')).toThrow(/'integer_literal'.*12z/);
	});
});

describe('lexedConfig', () => {
	it('keys by config key and drops absent slots and false flags', () => {
		expect(lexedConfig("'a'", CHAR, 'char_literal')).toEqual({ content: 'a' });
		expect(lexedConfig("b'a'", CHAR, 'char_literal')).toEqual({ b: true, content: 'a' });
	});
});
