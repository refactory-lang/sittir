import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/create-engine.ts';
import rust from '@sittir/rust';
import python from '@sittir/python';
import typescript from '@sittir/typescript';

const tables = {
	rust: (await createEngine(rust)).build,
	python: (await createEngine(python)).build,
	typescript: (await createEngine(typescript)).build
};

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
		['rust', tables.rust],
		['python', tables.python],
		['typescript', tables.typescript]
	])('%s: no callable without a strict flavour carries a member that has one', (_grammar, table) => {
		expect(strictLessCallablesWithStrictMembers(table)).toEqual([]);
	});
});
