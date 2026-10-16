import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

const rs = await createEngine(rust);

const SOURCE = 'fn f(a: u8, b: i8, c: usize, d: String) { let e = move || 1; }\n';

type Node = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
const textOf = (node: unknown): string => {
	const { start, end } = (node as Node).$_layout.at.$span;
	return SOURCE.slice(start, end);
};
const nameOf = (param: unknown): string => textOf((param as { name(): unknown }).name());

describe('c.<slot>.is(flag) in a where condition', () => {
	const params = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.Parameter);

	it('selects the nodes whose slot holds a kind that always carries the flag', () => {
		expect([...params().where((c) => c.type.is('unsigned'))].map(nameOf)).toEqual(['a', 'c']);
		expect([...params().where((c) => c.type.is('unsigned').not())].map(nameOf)).toEqual(['b', 'd']);
	});

	it('selects natively what the read holds: the parameters typed by an unsigned keyword', () => {
		const UNSIGNED = [TSKindId.U8Keyword, TSKindId.U16Keyword, TSKindId.U32Keyword, TSKindId.U64Keyword, TSKindId.U128Keyword, TSKindId.UsizeKeyword];
		const reference = [...params()].filter((p) => UNSIGNED.includes((p as { type(): number }).type())).map(nameOf);
		expect([...params().where((c) => c.type.is('unsigned'))].map(nameOf)).toEqual(reference);
	});

	it('refuses a flag no kind the slot holds declares, naming the slot', () => {
		expect(() => [...params().where((c) => (c.type.is as (flag: string) => ReturnType<typeof c.type.is>)('async'))]).toThrow(
			'query: no kind parameter.type holds declares the flag async'
		);
	});

	it('refuses a flag a kind the slot holds declares only conditionally, naming the kind and the flag', () => {
		const lets = () => rs.parse(SOURCE).$query().$descendants.ofType(rs.kinds.LetDeclaration);
		expect(() => [...lets().where((c) => (c.value.is as (flag: string) => ReturnType<typeof c.value.is>)('move'))]).toThrow(
			/^query: move on \w+, which let_declaration\.value holds, depends on that node's slots; a slot test reads only the flags a kind always carries$/
		);
	});
});
