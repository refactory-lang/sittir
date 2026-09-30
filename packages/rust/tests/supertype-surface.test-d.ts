/**
 * Type-level pins for a declared supertype's node surface: `Statement.Bound`
 * and `Statement.Parsed` are the unions over the members' `.Bound` and
 * `.Parsed`, and they narrow through `is.*` like any member union.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const rs = await createEngine(rust);

expectTrue<Equals<T.FunctionItem.Bound extends T.Statement.Bound ? true : false, true>>();
expectTrue<Equals<T.FunctionItem.Parsed extends T.Statement.Parsed ? true : false, true>>();
expectTrue<Equals<T.UseDeclaration.Bound extends T.Statement.Bound ? true : false, true>>();
expectTrue<Equals<Extract<T.Statement.Bound, { readonly $type: T.FunctionItem['$type'] }>, T.FunctionItem.Bound>>();
expectTrue<Equals<Extract<T.Statement.Parsed, { readonly $type: T.FunctionItem['$type'] }>, T.FunctionItem.Parsed>>();

export function narrowsThroughIs(statement: T.Statement.Parsed): T.FunctionItem.Parsed | undefined {
	return rs.is.functionItem(statement) ? statement : undefined;
}

export function boundNarrowsThroughIs(statement: T.Statement.Bound): T.FunctionItem.Bound | undefined {
	return rs.is.functionItem(statement) ? statement : undefined;
}
