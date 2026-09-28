import { describe, it, expect } from 'vitest';
import { ir as rust } from '@sittir/rust';
import { ir as python } from '@sittir/python';
import { ir as typescript } from '@sittir/typescript';

const FUNCTION_OWN = new Set(['length', 'name', 'prototype', 'arguments', 'caller']);
const FLAVOURS = new Set(['strict', 'coerce']);

function hasStrict(value: unknown): boolean {
	return (typeof value === 'function' || (typeof value === 'object' && value !== null)) && typeof (value as { strict?: unknown }).strict === 'function';
}

function strictLessCallablesWithStrictMembers(table: object): string[] {
	const found: string[] = [];
	const seen = new Set<unknown>();
	const walk = (value: unknown, path: string): void => {
		if ((typeof value !== 'function' && (typeof value !== 'object' || value === null)) || seen.has(value)) return;
		seen.add(value);
		const members = Object.getOwnPropertyNames(value).filter((key) => !(typeof value === 'function' && FUNCTION_OWN.has(key)) && !FLAVOURS.has(key));
		if (typeof value === 'function' && !hasStrict(value)) {
			for (const key of members) if (hasStrict((value as Record<string, unknown>)[key])) found.push(`${path}.${key}`);
		}
		for (const key of members) walk((value as Record<string, unknown>)[key], `${path}.${key}`);
	};
	walk(table, 'ir');
	return found;
}

describe('the strict surface covers every builder table', () => {
	it.each([
		['rust', rust],
		['python', python],
		['typescript', typescript]
	])('%s: no callable without a strict flavour carries a member that has one', (_grammar, table) => {
		expect(strictLessCallablesWithStrictMembers(table)).toEqual([]);
	});
});
