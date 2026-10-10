/**
 * Type-level pin: which strict rows accept the kind's own built node. A
 * strict builder does not take its own node as a copy or a pass-through; the
 * only kinds whose `BuildArgs` admit it are the ones whose one slot can hold
 * the kind itself, where the node is that slot's value and the call wraps
 * it. `parenthesizedExpressionSequence` is here through its sequence: its
 * strict builder takes the sequence's elements, and the kind is an
 * expression, so its own node is one element. `statementBlock` takes its
 * statements positionally, and a statement block is a statement.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type { Expect, SameKinds, TakesOwnNode } from '../../types/tests/support/row-is-the-call.ts';
import type * as T from '../src/types.ts';

export type StrictRowsThatTakeTheirOwnNode = Expect<
	SameKinds<
		TakesOwnNode<T.TypeKeyOf, T.NamespaceMap, 'BuildArgs'>,
		  'ambientDeclaration'
		| 'array'
		| 'arrayType'
		| 'awaitExpression'
		| 'flowMaybeType'
		| 'indexTypeQuery'
		| 'nonNullExpression'
		| 'parenthesizedExpressionSequence'
		| 'parenthesizedType'
		| 'readonlyType'
		| 'statementBlock'
		| 'tupleType'
		| 'yieldExpression'
	>
>;
