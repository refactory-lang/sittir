import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

const rs = await createEngine(rust);

const SOURCE = 'fn f(a: u8, b: i8, c: usize, d: String) { let e = move || 1; let g = || 2; let h = 3; }\nmod m { async fn x() {} }\nmod n { fn y() {} }\n';

type Node = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
const textOf = (node: unknown): string => {
	const { start, end } = (node as Node).$_layout.at.$span;
	return SOURCE.slice(start, end);
};
const nameOf = (param: unknown): string => textOf((param as { name(): unknown }).name());
const patternOf = (binding: unknown): string => textOf((binding as { pattern(): unknown }).pattern());

describe('c.<slot>.is(flag) in a where condition', () => {
	const params = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.Parameter);
	const lets = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.LetDeclaration);
	const lists = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.DeclarationList);

	it('selects the nodes whose slot holds a kind that always carries the flag', () => {
		expect([...params().where((c) => c.type.is('unsigned'))].map(nameOf)).toEqual(['a', 'c']);
		expect([...params().where((c) => c.type.is('unsigned').not())].map(nameOf)).toEqual(['b', 'd']);
	});

	it('selects natively what the read holds: the parameters typed by an unsigned keyword', () => {
		const UNSIGNED = [TSKindId.U8Keyword, TSKindId.U16Keyword, TSKindId.U32Keyword, TSKindId.U64Keyword, TSKindId.U128Keyword, TSKindId.UsizeKeyword];
		const reference = [...params()].filter((p) => UNSIGNED.includes((p as { type(): number }).type())).map(nameOf);
		expect([...params().where((c) => c.type.is('unsigned'))].map(nameOf)).toEqual(reference);
	});

	it('tests a flag a held kind carries by its own slots on the node the slot holds', () => {
		expect([...lets().where((c) => c.value.is('move'))].map(patternOf)).toEqual(['e']);
		expect([...lets().where((c) => c.value.is('move').not())].map(patternOf)).toEqual(['g', 'h']);
	});

	it('selects natively what the read holds: the lists declaring an async function', () => {
		type Item = { readonly $type: number; functionModifiers?(): { modifiers(): readonly number[] } | undefined };
		const isAsync = (item: Item): boolean => item.$type === TSKindId.FunctionItem && (item.functionModifiers?.()?.modifiers().includes(TSKindId.AsyncKeyword) ?? false);
		const reference = [...lists()].filter((list) => (list as { declarations(): readonly Item[] }).declarations().some(isAsync)).map(textOf);
		expect([...lists().where((c) => c.declarations.is('async'))].map(textOf)).toEqual(reference);
		expect(reference).toEqual(['{ async fn x() {} }']);
	});

	it('refuses a flag no kind the slot holds declares, naming the slot', () => {
		expect(() => [...params().where((c) => (c.type.is as (flag: string) => ReturnType<typeof c.type.is>)('async'))]).toThrow(
			'query: no kind parameter.type holds declares the flag async'
		);
	});

	it('refuses a flag a held kind declares by its context, naming the kind and the flag', () => {
		expect(() => [...lists().where((c) => (c.declarations.is as (flag: string) => ReturnType<typeof c.declarations.is>)('static'))]).toThrow(
			"query: static on function_item, which declaration_list.declarations holds, depends on the node's context"
		);
	});
});
