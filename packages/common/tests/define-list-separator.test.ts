import { describe, expect, it } from 'vitest';
import { defineListSeparator } from '../src/utils.ts';

describe('defineListSeparator', () => {
	it('a list answers its stored separator', () => {
		const list = { _separator: 7 };
		defineListSeparator(list);
		expect((list as { separator?: unknown }).separator).toBe(7);
	});

	it('is not enumerable, so a copy of the list does not carry a frozen answer', () => {
		const list = { _separator: 7 };
		defineListSeparator(list);
		expect(Object.keys(list)).toEqual(['_separator']);
	});

	it.each([
		['a built list that took its declared default', 22],
		['a built list given a separator', 15],
		['a parsed list answering its tree', 22]
	])('an owner answers what its list answers: %s', (_name, separator) => {
		const owner = { members: () => ({ separator }) };
		defineListSeparator(owner, 'members');
		expect((owner as { separator?: unknown }).separator).toBe(separator);
	});

	it('an owner with no list answers none', () => {
		const owner = { members: () => undefined };
		defineListSeparator(owner, 'members');
		expect((owner as { separator?: unknown }).separator).toBeUndefined();
	});
});
