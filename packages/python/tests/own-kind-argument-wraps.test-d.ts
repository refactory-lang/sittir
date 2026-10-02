/**
 * Type-level pin: a kind whose one argument fills a slot that can hold the
 * kind itself has its own node in its loose row, as that slot's value, so
 * the wrapping call compiles with no cast. A list that cannot hold itself
 * has its own node in its row too, as its elements.
 *
 * Compile-time only: `pnpm --filter @sittir/python type-check`.
 */

import { ir } from '../src/ir.ts';
import type { Await, NotOperator, Tuple, List, UnionPattern, ArgumentList } from '../src/types.ts';

export function ownKindArguments(): void {
	const x = ir.identifier('x');
	const awaited = ir.await(x);
	const negated = ir.notOperator(x);
	const tuple = ir.tuple(x, ir.identifier('y'));
	const list = ir.list(x);
	const union = ir.unionPattern(ir.dottedName(x), ir.dottedName(ir.identifier('y')));
	const args = ir.argumentList(x);

	ir.await(awaited);
	ir.notOperator(negated);
	ir.tuple(tuple);
	ir.list(list);
	ir.unionPattern(union);
	ir.argumentList(args);

	[awaited] satisfies Await.LooseArgs;
	[negated] satisfies NotOperator.LooseArgs;
	[tuple] satisfies Tuple.LooseArgs;
	[list] satisfies List.LooseArgs;
	[union] satisfies UnionPattern.LooseArgs;
	[args] satisfies ArgumentList.LooseArgs;
}
