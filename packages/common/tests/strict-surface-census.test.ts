import { describe, it, expect } from 'vitest';
import { createEngine } from '../src/create-engine.ts';
import rust from '@sittir/rust';
import python from '@sittir/python';
import typescript from '@sittir/typescript';

const FUNCTION_OWN = new Set(['length', 'name', 'prototype', 'arguments', 'caller']);

function pathsOf(table: object): string[] {
	const rows: string[] = [];
	const walk = (value: unknown, path: string, stack: readonly unknown[]): void => {
		if (typeof value !== 'function' && (typeof value !== 'object' || value === null)) {
			rows.push(`${path}\t${typeof value}`);
			return;
		}
		rows.push(`${path}\t${typeof value === 'function' ? 'call' : 'object'}`);
		if (stack.includes(value)) return;
		for (const key of Object.getOwnPropertyNames(value)) {
			if (typeof value === 'function' && FUNCTION_OWN.has(key)) continue;
			walk((value as Record<string, unknown>)[key], `${path}.${key}`, [...stack, value]);
		}
	};
	for (const key of Object.getOwnPropertyNames(table)) walk((table as Record<string, unknown>)[key], key, [table]);
	return rows.sort();
}

const tables: readonly (readonly [string, object, object])[] = [
	['rust', (await createEngine(rust)).build, (await createEngine(rust, { api: 'strict' })).build],
	['python', (await createEngine(python)).build, (await createEngine(python, { api: 'strict' })).build],
	['typescript', (await createEngine(typescript)).build, (await createEngine(typescript, { api: 'strict' })).build]
];

describe("the strict builder table has the default table's shape", () => {
	it.each(tables)('%s: every path, and whether it is callable, is the same in both tables', (_grammar, loose, strict) => {
		expect(pathsOf(strict)).toEqual(pathsOf(loose));
	});
});
