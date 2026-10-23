import { describe, expect, it } from 'vitest';
import { physicalDisplayKind, sharedDisplayEntries, sharedDisplayStorageKinds } from '../src/validate/display-families.ts';

const families = {
	string_content: [
		{ storage: 'raw_string_literal_content', literal: false },
		{ storage: 'string_content', literal: false }
	],
	property_identifier: [{ storage: 'identifier', literal: false }],
	keyword_display: [
		{ storage: 'identifier', literal: false },
		{ storage: 'type', literal: true },
		{ storage: 'this', literal: true }
	]
};

describe('sharedDisplayStorageKinds', () => {
	it('expands a display whose family has two or more non-literal members to those members', () => {
		expect(sharedDisplayStorageKinds('string_content', families)).toEqual(['raw_string_literal_content', 'string_content']);
	});

	it('does not count literal members toward the family', () => {
		expect(sharedDisplayStorageKinds('keyword_display', families)).toEqual(['keyword_display']);
	});

	it('keeps the display for a single-storage alias', () => {
		expect(sharedDisplayStorageKinds('property_identifier', families)).toEqual(['property_identifier']);
	});

	it('keeps the display for a display with no family', () => {
		expect(sharedDisplayStorageKinds('unknown_display', families)).toEqual(['unknown_display']);
	});
});

describe('physicalDisplayKind', () => {
	it('selects the physical member the parser id names', () => {
		expect(physicalDisplayKind('string_content', 'raw_string_literal_content', families)).toBe('raw_string_literal_content');
	});

	it('keeps the display for a storage name outside the family', () => {
		expect(physicalDisplayKind('string_content', 'other', families)).toBe('string_content');
		expect(physicalDisplayKind('string_content', undefined, families)).toBe('string_content');
	});

	it('keeps the display when the only storage that matches is a literal member', () => {
		expect(physicalDisplayKind('keyword_display', 'type', families)).toBe('keyword_display');
	});
});

describe('sharedDisplayEntries', () => {
	it('expands a shared display entry to one per storage kind, keeping its other fields', () => {
		expect(sharedDisplayEntries([{ type: 'string_content', name: 'x', arity: 2 }], families)).toEqual([
			{ type: 'raw_string_literal_content', name: 'x', arity: 2 },
			{ type: 'string_content', name: 'x', arity: 2 }
		]);
	});

	it('passes a single-storage entry through unchanged', () => {
		expect(sharedDisplayEntries([{ type: 'property_identifier', name: 'y' }], families)).toEqual([
			{ type: 'property_identifier', name: 'y' }
		]);
	});

	it('passes a literal-only family entry through unchanged', () => {
		expect(sharedDisplayEntries([{ type: 'keyword_display', name: 'z' }], families)).toEqual([{ type: 'keyword_display', name: 'z' }]);
	});

	it('passes an entry with no family through unchanged', () => {
		expect(sharedDisplayEntries([{ type: 'unknown_display', name: 'w' }], families)).toEqual([{ type: 'unknown_display', name: 'w' }]);
	});

	it('keeps the order of entries, expanding each shared display in place', () => {
		const entries = [
			{ type: 'property_identifier', name: 'a' },
			{ type: 'string_content', name: 'b' },
			{ type: 'keyword_display', name: 'c' }
		];
		expect(sharedDisplayEntries(entries, families).map((entry) => `${entry.type}:${entry.name}`)).toEqual([
			'property_identifier:a',
			'raw_string_literal_content:b',
			'string_content:b',
			'keyword_display:c'
		]);
	});
});
