import { describe, expect, it } from 'vitest';
import { createEngine } from '@sittir/common';
import rust from '../src/index.ts';

const GRAMMAR = rust;

const PAIRS = [
	{ name: 'self_parameter > self', holder: rust.kinds.SelfParameter, token: rust.kinds.Self, source: 'impl S { fn f(&self) {} }\n' },
	{ name: 'pointer_type_mut > mutable_specifier', holder: rust.kinds.PointerTypeMut, token: rust.kinds.MutableSpecifier, source: 'type T = *mut u8;\n' },
	{ name: 'reference_expression_mut > mutable_specifier', holder: rust.kinds.ReferenceExpressionMut, token: rust.kinds.MutableSpecifier, source: 'fn f() { let x = &mut a; }\n' },
	{ name: 'reference_expression_raw_mut > mutable_specifier', holder: rust.kinds.ReferenceExpressionRawMut, token: rust.kinds.MutableSpecifier, source: 'fn f() { let x = &raw mut a; }\n' },
	{ name: 'extern_crate_declaration > crate', holder: rust.kinds.ExternCrateDeclaration, token: rust.kinds.Crate, source: 'extern crate a;\n' },
	{ name: 'mut_pattern > mutable_specifier', holder: rust.kinds.MutPattern, token: rust.kinds.MutableSpecifier, source: 'fn f() { let g = move |mut e| e; }\n' },
	{ name: 'receiver_parameter_declaration > self', holder: rust.kinds.ReceiverParameterDeclaration, token: rust.kinds.Self, source: 'impl S { fn f(self: Box<Self>) {} }\n' }
];

describe.each(['object', 'arena'] as const)('a named fixed token leaves a query for its holder (%s storage)', (nodeStorage) => {
	it.each(PAIRS)('$name', async ({ holder, token, source }) => {
		using engine = await createEngine(GRAMMAR, { nodeStorage });
		const root = engine.parse(source);
		const descendants = root.$query().$descendants as unknown as { ofType(kind: number): Iterable<unknown> };
		expect([...descendants.ofType(token)]).toHaveLength(0);
		expect([...descendants.ofType(holder)]).toHaveLength(1);
	});
});
