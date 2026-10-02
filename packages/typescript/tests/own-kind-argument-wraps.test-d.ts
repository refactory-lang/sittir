/**
 * Type-level pin: a kind whose one argument fills a slot that can hold the
 * kind itself has its own node in its loose row, as that slot's value, so
 * the wrapping call compiles with no cast. A list that cannot hold itself
 * has its own node in its row too, as its elements.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import { ir } from '../src/ir.ts';
import type { AwaitExpression, TupleType, Array, Arguments, ParenthesizedExpressionSequence } from '../src/types.ts';

export function ownKindArguments(): void {
	const x = ir.identifier('x');
	const awaited = ir.awaitExpression(x);
	const tuple = ir.tupleType('A', 'B');
	const array = ir.array(x);
	const args = ir.arguments(x);
	const sequence = ir.parenthesizedExpression.sequence.strict(x, ir.identifier('y'));

	ir.awaitExpression(awaited);
	ir.tupleType(tuple);
	ir.array(array);
	ir.arguments(args);
	ir.parenthesizedExpression.sequence(sequence);
	ir.parenthesizedExpression.sequence.strict(sequence);

	[awaited] satisfies AwaitExpression.LooseArgs;
	[tuple] satisfies TupleType.LooseArgs;
	[array] satisfies Array.LooseArgs;
	[args] satisfies Arguments.LooseArgs;
	[sequence] satisfies ParenthesizedExpressionSequence.LooseArgs;
	[sequence] satisfies ParenthesizedExpressionSequence.BuildArgs;
}
