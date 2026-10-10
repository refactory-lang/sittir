import { describe, expectTypeOf, it } from 'vitest';
import type { PortableIds, PortableIs } from '../src/portable.ts';
import { TSKindId } from '../src/types.ts';

declare const is: PortableIs;
declare const node: { readonly $type: TSKindId; readonly $text?: string };

describe('a portable guard', () => {
	it('narrows a node to the kinds its path reads as', () => {
		if (is.declaration.function(node)) expectTypeOf(node.$type).toEqualTypeOf<PortableIds['declaration.function']>();
	});

	it('narrows by a namespace to every kind read under it', () => {
		if (is.declaration(node)) expectTypeOf(node.$type).toEqualTypeOf<PortableIds['declaration']>();
	});

	it('keeps the node\'s other members', () => {
		if (is.declaration.function(node)) expectTypeOf(node.$text).toEqualTypeOf<string | undefined>();
	});

	it('tests a node, not a bare kind id', () => {
		// @ts-expect-error a guard takes a node
		is.declaration.function(TSKindId.FunctionItem);
	});
});
