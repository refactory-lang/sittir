import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import { isCoordinate } from '@sittir/common/utils';
import rust from '../src/index.ts';

type Node = Record<string, unknown> & { readonly $type: number; $render(): string };

const CASES = [
	{ list: 'EnumVariantListElements', wrapper: 'AttributedEnumVariant', build: 'enumVariantListElements', source: 'enum E { #[a] A, B }\n' },
	{ list: 'FieldDeclarationListElements', wrapper: 'AttributedFieldDeclaration', build: 'fieldDeclarationListElements', source: 'struct S { #[a] x: u8, y: u8 }\n' },
	{ list: 'OrderedFieldDeclarationListElements', wrapper: 'AttributedOrderedField', build: 'orderedFieldDeclarationListElements', source: 'struct S(#[a] u8, pub u8, u8);\n' },
	{ list: 'TypeParametersElements', wrapper: 'AttributedTypeParameter', build: 'typeParametersElements', source: 'fn f<#[a] T, U>() {}\n' },
	{ list: 'ParametersElements', wrapper: 'AttributedParameter', build: 'parametersElements', source: 'fn f(#[a] x: u8, y: u8) {}\n' },
	{ list: 'TypeArgumentsElements', wrapper: 'TypeArgument', build: 'typeArgumentsElements', source: 'type A = Foo<T: Copy, U>;\n' },
	{ list: 'ArgumentsElements', wrapper: 'AttributedArgument', build: 'argumentsElements', source: 'fn main() { f(#[a] x, y); }\n' }
] as const;

const SKIP = new Set(['toString', 'toJSON', 'separator', 'delimiter']);

function find(node: unknown, kind: number, seen = new Set<object>()): Node | undefined {
	if (node === null || typeof node !== 'object' || seen.has(node)) return undefined;
	seen.add(node);
	const record = node as Node;
	if (record.$type === kind) return record;
	for (const key of Object.keys(record)) {
		const value = record[key];
		if (key.startsWith('$') || key.startsWith('_') || SKIP.has(key) || typeof value !== 'function' || value.length !== 0) continue;
		const out = (value as () => unknown).call(record);
		for (const child of Array.isArray(out) ? out : [out]) {
			const found = find(child, kind, seen);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

const fingerprint = (item: unknown): unknown => (typeof item === 'object' && item !== null ? [(item as Node).$type, (item as Node).$render()] : item);

function storedCoordinates(node: unknown, kind: number, seen = new Set<object>()): readonly unknown[] | undefined {
	if (node === null || typeof node !== 'object' || seen.has(node)) return undefined;
	seen.add(node);
	const record = node as Node;
	if (record.$type === kind && Array.isArray(record._item) && record._item.every(isCoordinate)) return record._item;
	for (const key of Object.keys(record)) {
		if (!key.startsWith('_')) continue;
		for (const child of Array.isArray(record[key]) ? (record[key] as unknown[]) : [record[key]]) {
			const found = storedCoordinates(child, kind, seen);
			if (found !== undefined) return found;
		}
	}
	return undefined;
}

describe('a built list over the coordinates a shallow read stores', () => {
	it.each([
		{ list: 'ParametersElements', build: 'parametersElements', source: 'fn f(#[a] x: u8, y: u16) {}\n' },
		{ list: 'FieldInitializerListElements', build: 'fieldInitializerListElements', source: 'fn f() { S { a: 1, b }; }\n' }
	])('$list holds the nodes its items() hydrates', async ({ list, build, source }) => {
		const rs = await createEngine(rust, { nodeStorage: 'object' });
		const kinds = rs.kinds as unknown as Record<string, number>;
		const depths = Array.from({ length: 10 }, (_, at) => at + 1);
		const coordinates = depths.map((depth) => storedCoordinates(rs.parse(source, { depth }), kinds[list]!)).find((found) => found !== undefined);
		expect(coordinates).toBeDefined();
		const parsed = find(rs.parse(source, { depth: Infinity }), kinds[list]!);
		const built = (rs.build as unknown as Record<string, (...items: unknown[]) => Node>)[build]!(...coordinates!);
		const indexed = Array.from({ length: built.length as number }, (_, at) => built[at]);
		expect(indexed.some(isCoordinate)).toBe(false);
		expect(indexed.map(fingerprint)).toEqual([...(parsed as unknown as Iterable<unknown>)].map(fingerprint));
		const items = (built.items as () => readonly Node[])();
		expect(indexed.every((item, at) => item === items[at] || item === (items[at]!.content as (() => unknown) | undefined)?.call(items[at]))).toBe(true);
	});
});

describe.each(['object', 'arena'] as const)('a built wrapper list in %s storage', (storage) => {
	it.each(CASES)('$list holds the items its parsed form reads', async ({ list, wrapper, build, source }) => {
		const rs = await createEngine(rust, storage === 'object' ? { nodeStorage: 'object' } : {});
		const kinds = rs.kinds as unknown as Record<string, number>;
		const parsed = find(rs.parse(source, { depth: Infinity }), kinds[list]!);
		expect(parsed).toBeDefined();
		const items = [...(parsed as unknown as Iterable<unknown>)];
		const stored = (parsed!.items as () => readonly unknown[])();
		expect(items.some((item) => (item as Node).$type === kinds[wrapper])).toBe(true);
		expect(items.some((item) => (item as Node).$type !== kinds[wrapper])).toBe(true);
		expect(stored.every((item) => (item as Node).$type === kinds[wrapper])).toBe(true);
		const builder = (rs.build as unknown as Record<string, (...items: unknown[]) => Iterable<unknown>>)[build]!;
		for (const input of [items, stored]) {
			const built = [...builder(...input)];
			expect(built.map(fingerprint)).toEqual(items.map(fingerprint));
			if (storage === 'object') expect(built.every((item, at) => item === items[at])).toBe(true);
		}
	});
});
