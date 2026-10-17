/**
 * Type-level pins for `c.<slot>.is(flag)`: a slot takes the flags some kind it
 * can hold carries, always or by its own slots, and none that a kind it holds
 * declares only through its context.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(rust);
const params = engine.parse('fn f(a: u8) {}').$query().$descendants.ofType(engine.kinds.Parameter);
const lets = engine.parse('fn f() { let e = move || 1; }').$query().$descendants.ofType(engine.kinds.LetDeclaration);
const lists = engine.parse('mod m { async fn x() {} }').$query().$descendants.ofType(engine.kinds.DeclarationList);

export function slotFlags(): unknown[] {
	return [
		[...params.where((c) => c.type.is('unsigned'))],
		[...params.where((c) => c.type.is('unsigned').and(c.mutable.eq(false)))],
		[...lets.where((c) => c.value.is('move'))],
		[...lists.where((c) => c.declarations.is('async'))],
		// @ts-expect-error a flag no kind the slot holds declares
		[...params.where((c) => c.type.is('async'))],
		// @ts-expect-error a flag a kind the slot holds declares only through its context
		[...lists.where((c) => c.declarations.is('static'))]
	];
}
