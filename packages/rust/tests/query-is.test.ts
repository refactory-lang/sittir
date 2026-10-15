import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { hooks } from '../src/api.ts';
import { queryFlags } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';

const rs = await createEngine(rust);

const SOURCE = 'async fn a() {}\nfn b() {}\nconst fn c() {}\nasync unsafe fn d() {}\n';

type Node = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
const textOf = (node: unknown): string => {
	const { start, end } = (node as Node).$_layout.at.$span;
	return SOURCE.slice(start, end);
};
const nameOf = (fn: unknown): string => textOf((fn as { name(): unknown }).name());

describe('c.is(flag) in a where condition', () => {
	const fns = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.FunctionItem);

	it('selects the nodes that carry the flag, and its negation the others', () => {
		expect([...fns().where((c) => c.is('async'))].map(nameOf)).toEqual(['a', 'd']);
		expect([...fns().where((c) => c.is('async').not())].map(nameOf)).toEqual(['b', 'c']);
		expect([...fns().where((c) => c.is('async').and(c.is('unsafe')))].map(nameOf)).toEqual(['d']);
		expect([...fns().where((c) => c.is('const').or(c.name.eq('b')))].map(nameOf)).toEqual(['b', 'c']);
	});

	it('selects natively what the read holds: the modifier keywords of each function', () => {
		const KEYWORD = { async: TSKindId.AsyncKeyword, const: TSKindId.ConstKeyword, unsafe: TSKindId.UnsafeKeyword } as const;
		const modifiers = (fn: unknown): readonly unknown[] => {
			const held = (fn as { functionModifiers(): { modifiers(): readonly unknown[] } | undefined }).functionModifiers();
			return held === undefined ? [] : held.modifiers();
		};
		for (const [flag, keyword] of Object.entries(KEYWORD) as [keyof typeof KEYWORD, number][]) {
			const reference = [...fns()].filter((fn) => modifiers(fn).includes(keyword)).map(nameOf);
			expect([...fns().where((c) => c.is(flag))].map(nameOf)).toEqual(reference);
		}
	});

	it('pushes the flag\'s plan down with the kind', () => {
		const { root: data, tree: native } = rs.diagnostics.parseAndRead(SOURCE);
		const steps: { kinds?: readonly number[]; plan?: unknown }[] = [];
		const query = (native as { query?: { descendants(step: { kinds?: readonly number[]; plan?: unknown }): unknown } }).query!;
		const walk = query.descendants;
		query.descendants = (step) => {
			steps.push(step);
			return walk(step);
		};
		const found = [...hooks.wrap(data, native).$query().$descendants.ofType(rs.kinds.FunctionItem).where((c) => c.is('const'))];
		expect(found).toHaveLength(1);
		expect(steps).toContainEqual(expect.objectContaining({ kinds: [TSKindId.FunctionItem], plan: queryFlags[TSKindId.FunctionItem]!['const'] }));
	});

	it('refuses a flag the kind does not declare, naming the kind', () => {
		const loose = (c: unknown) => c as { is(flag: string): never };
		expect(() => [...fns().where((c) => loose(c).is('mutable'))]).toThrow(/function_item declares no flag mutable/);
	});

	it('refuses a flag that depends on the node\'s context, by name', () => {
		const loose = (c: unknown) => c as { is(flag: string): never };
		expect(() => [...fns().where((c) => loose(c).is('static'))]).toThrow(/static on function_item depends on the node's context/);
	});

	it('checks a flag before the view\'s kinds are known by the flags the grammar declares, and runs it per kind', () => {
		const all = () => rs.parse(SOURCE).$query().$descendants as unknown as { where(c: (r: { is(flag: string): unknown }) => unknown): Iterable<unknown> };
		expect(() => all().where((c) => c.is('nope'))).toThrow(/no kind of this grammar declares the flag nope/);
		expect(() => all().where((c) => c.is('async'))).not.toThrow();
	});
});
