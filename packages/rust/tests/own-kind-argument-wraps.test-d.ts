/**
 * Type-level pin: a kind whose one argument fills a slot that can hold the
 * kind itself has its own node in its loose row, as that slot's value, so
 * the wrapping call compiles with no cast. A list that cannot hold itself
 * has its own node in its row too, as its elements.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import { ir } from '../src/ir.ts';
import type { AwaitExpression, TuplePattern, TokenTreeParen, Arguments } from '../src/types.ts';

export function ownKindArguments(): void {
	const x = ir.identifier('x');
	const awaited = ir.awaitExpression(x);
	const pattern = ir.tuplePattern(x, ir.identifier('y'));
	const tree = ir.tokenTree.paren(x);
	const args = ir.arguments(x);

	ir.awaitExpression(awaited);
	ir.tuplePattern(pattern);
	ir.tokenTree.paren(tree);
	ir.arguments(args);

	[awaited] satisfies AwaitExpression.LooseArgs;
	[pattern] satisfies TuplePattern.LooseArgs;
	[tree] satisfies TokenTreeParen.LooseArgs;
	[args] satisfies Arguments.LooseArgs;
}
