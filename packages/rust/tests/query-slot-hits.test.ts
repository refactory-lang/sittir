import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const rs = await createEngine(rust);
const K = rs.kinds;

type Spanned = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };

const textOf = (source: string, node: unknown): string => {
	const { start, end } = (node as Spanned).$_layout.at.$span;
	return source.slice(start, end);
};

describe('where over a slot its kind reads without routing children', () => {
	it('compares a token interior\'s slot by the group its read captures', () => {
		const SOURCE = 'const A: u8 = 1u8;\nconst B: i32 = 2i32;\nconst C: i32 = 3;\n';
		const literals = () => rs.parse(SOURCE).$query().$descendants.ofType(K.IntegerLiteralDecimal);
		expect([...literals()].map((n) => (n as { suffix(): unknown }).suffix())).toEqual(['u8', 'i32', undefined]);
		expect([...literals().where((c) => c.suffix.eq('u8'))].map((n) => textOf(SOURCE, n))).toEqual(['1u8']);
		expect([...literals().where((c) => c.suffix.match(/^i/))].map((n) => textOf(SOURCE, n))).toEqual(['2i32']);
	});

	it('compares an envelope\'s content as the node itself', () => {
		const SOURCE = 'struct Foo;\nstruct Bar;\n';
		const types = () => rs.parse(SOURCE).$query().$descendants.ofType(K.TypeIdentifier);
		expect([...types()].map((n) => textOf(SOURCE, n))).toEqual(['Foo', 'Bar']);
		expect([...types().where((c) => c.content.eq('Bar'))].map((n) => textOf(SOURCE, n))).toEqual(['Bar']);
	});
});
