import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import typescript from '../src/index.ts';
import { TSKindId } from '../src/types.ts';

const ts = await createEngine(typescript);

const SOURCE = 'type A = unique symbol;\ntype B = symbol;\ntype C = string;\n';

type Node = { readonly $_layout: { readonly at: { readonly $span: { readonly start: number; readonly end: number } } } };
const nameOf = (alias: unknown): string => {
	const { start, end } = ((alias as { name(): unknown }).name() as Node).$_layout.at.$span;
	return SOURCE.slice(start, end);
};

describe('c.<slot>.is(flag) on a slot that stores an enum kind member', () => {
	const aliases = () => ts.parse(SOURCE).$query().$descendants.ofType(ts.kinds.TypeAliasDeclaration);

	it('selects the nodes whose slot holds the member that carries the flag', () => {
		expect([...aliases().where((c) => c.value.is('unique'))].map(nameOf)).toEqual(['A']);
		expect([...aliases().where((c) => c.value.is('unique').not())].map(nameOf)).toEqual(['B', 'C']);
	});

	it('selects natively what the read holds', () => {
		const reference = [...aliases()].filter((alias) => (alias as { value(): unknown }).value() === TSKindId.Unique).map(nameOf);
		expect([...aliases().where((c) => c.value.is('unique'))].map(nameOf)).toEqual(reference);
	});
});
