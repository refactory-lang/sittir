/**
 * Type-level pin: which strict rows accept the kind's own built node. A
 * strict builder does not take its own node as a copy or a pass-through; the
 * only kinds whose `BuildArgs` admit it are the ones whose one slot can hold
 * the kind itself, where the node is that slot's value and the call wraps
 * it.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type { Expect, SameKinds, TakesOwnNode } from '../../types/tests/support/row-is-the-call.ts';
import type * as T from '../src/types.ts';

export type StrictRowsThatTakeTheirOwnNode = Expect<
	SameKinds<
		TakesOwnNode<T.TypeKeyOf, T.NamespaceMap, 'BuildArgs'>,
		  'awaitExpression'
		| 'delimTokenTreeBrace'
		| 'delimTokenTreeBracket'
		| 'delimTokenTreeParen'
		| 'mutPattern'
		| 'orPatternPrefix'
		| 'parenthesizedExpression'
		| 'pointerTypeConst'
		| 'pointerTypeMut'
		| 'rangeExpressionPostfix'
		| 'rangeExpressionPrefix'
		| 'refPattern'
		| 'referenceExpressionBare'
		| 'referenceExpressionMut'
		| 'referenceExpressionRawConst'
		| 'referenceExpressionRawMut'
		| 'removedTraitBound'
		| 'returnExpression'
		| 'slicePattern'
		| 'tokenTreeBrace'
		| 'tokenTreeBracket'
		| 'tokenTreeParen'
		| 'tokenTreePatternBrace'
		| 'tokenTreePatternBracket'
		| 'tokenTreePatternParen'
		| 'tryExpression'
		| 'tuplePattern'
		| 'tupleType'
		| 'useList'
		| 'yieldExpression'
	>
>;
