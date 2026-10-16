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

describe('c.<slot>.is(flag) on a slot whose kinds carry the flag always or by their own slots', () => {
	const SOURCE = 'a?.b;\na.b;\na?.[0];\na[0];\nf?.();\nf();\n';
	const textOf = (node: unknown): string => {
		const { start, end } = (node as Node).$_layout.at.$span;
		return SOURCE.slice(start, end);
	};
	const statements = () => ts.parse(SOURCE).$query().$descendants.ofType(ts.kinds.ExpressionStatement);

	it('selects the statements whose expression chains optionally', () => {
		expect([...statements().where((c) => c.expression.is('optionalChain'))].map(textOf)).toEqual(['a?.b;', 'a?.[0];', 'f?.();']);
		expect([...statements().where((c) => c.expression.is('optionalChain').not())].map(textOf)).toEqual(['a.b;', 'a[0];', 'f();']);
	});

	it('selects natively what the read holds', () => {
		type Expression = { readonly $type: number; separator?(): number; optionalChain?(): boolean };
		const chains = (expression: Expression): boolean =>
			expression.$type === TSKindId.CallExpressionMember ||
			(expression.$type === TSKindId.MemberExpression && expression.separator?.() === TSKindId.OptionalChain) ||
			(expression.$type === TSKindId.SubscriptExpression && expression.optionalChain?.() === true);
		const reference = [...statements()].filter((statement) => chains((statement as { expression(): Expression }).expression())).map(textOf);
		expect([...statements().where((c) => c.expression.is('optionalChain'))].map(textOf)).toEqual(reference);
	});
});
