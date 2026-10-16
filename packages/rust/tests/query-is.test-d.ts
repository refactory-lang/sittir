/**
 * Type-level pins for `c.is(flag)`: the flags a view's element type takes are
 * those its kind declares, a union takes only the flags every member declares,
 * and a flag that depends on the node's context is not one of them. The test
 * imports no portable module: the grammar package carries the flags.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { FlagOf, View } from '@sittir/types';
import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(rust);
const fns = engine.parse('async fn a() {}').$query().$descendants.ofType(engine.kinds.FunctionItem);
declare const items: View<T.FunctionItem.Parsed | T.TraitItem.Parsed>;

export function flags(): unknown[] {
	expectTrue<Equals<FlagOf<T.FunctionItem.Parsed>, 'async' | 'const' | 'unsafe' | 'default'>>();
	expectTrue<Equals<FlagOf<T.FunctionItem.Parsed | T.TraitItem.Parsed>, 'unsafe'>>();
	expectTrue<Equals<FlagOf<T.Block.Parsed>, never>>();
	return [
		[...fns.where((c) => c.is('async'))],
		[...fns.where((c) => c.is('const').and(c.name.eq('a')).not())],
		[...items.where((c) => c.is('unsafe'))],
		// @ts-expect-error a flag the kind does not declare
		[...fns.where((c) => c.is('mutable'))],
		// @ts-expect-error a flag that depends on the node's context is no flag of the kind
		[...fns.where((c) => c.is('static'))],
		// @ts-expect-error over a union, only the flags every member declares
		[...items.where((c) => c.is('async'))]
	];
}
