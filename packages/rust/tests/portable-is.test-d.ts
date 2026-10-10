import { describe, expectTypeOf, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';
import type { PortableIds, PortableIs } from '../src/portable.ts';
import type * as T from '../src/types.ts';
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

	it('takes context as the enclosing nodes, not kind ids', () => {
		is.declaration.method(node, [node]);
		// @ts-expect-error context holds nodes
		is.declaration.method(node, [TSKindId.ImplItem]);
	});

	it('has no guard for a path the grammar does not bind', () => {
		// @ts-expect-error rust binds no `declaration.nothing`
		is.declaration.nothing(node);
	});

	it('narrows by $type alone, with no $subType', () => {
		// @ts-expect-error a narrowed node has no `$subType`
		if (is.declaration.function(node)) void node.$subType;
	});
});

describe('the portable engine', async () => {
	const engine = await createEngine(rust);
	const portable = await createEngine(rust, { api: 'portable' });

	it('carries the grammar\'s guards', () => {
		expectTypeOf(portable.is).toEqualTypeOf<PortableIs>();
	});

	it('narrows a parsed node to the parsed kinds of the path', () => {
		const parsed = engine.parse('fn f() {}').$query().$descendants.find()!;
		if (portable.is.declaration.function(parsed)) expectTypeOf(parsed).toExtend<T.FunctionItem.Parsed | T.FunctionSignatureItem.Parsed>();
	});
});
