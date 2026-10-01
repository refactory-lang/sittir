/**
 * Type-level pins: a node that seats an optional flattened group is the union
 * of a group-present and a group-absent shape, told apart by the seat's stored
 * property. The absent shape has no flattened getters, and its `$with` sets
 * only the group's required field, which yields the present shape.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(typescript);
declare const typeAnnotation: T.TypeAnnotation.Parsed;

export function presentGroupReadsEveryRequiredField(c: T.CatchClause.Bound): void {
	if (c._catch_clause_group !== undefined) {
		expectTrue<Equals<undefined extends ReturnType<typeof c.parameter> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof c.catchClauseGroup> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof c.type> ? true : false, true>>();
	} else {
		expectTrue<Equals<ReturnType<typeof c.catchClauseGroup>, undefined>>();
		// @ts-expect-error an absent group has no flattened getters
		c.parameter();
		// @ts-expect-error an absent group has no flattened getters
		c.type();
	}
}

export function clearingTheGroupYieldsTheAbsentShape(c: T.CatchClause.Parsed): void {
	const cleared = c.$with.catchClauseGroup();
	expectTrue<Equals<typeof cleared._catch_clause_group, undefined>>();
	// @ts-expect-error the cleared node has no flattened getters
	cleared.parameter();
	// @ts-expect-error the cleared node has no flattened getters
	cleared.type();
}

export function anAbsentGroupSetsOnlyItsRequiredField(c: T.CatchClause.Parsed): void {
	if (c._catch_clause_group !== undefined) return;
	// @ts-expect-error an absent group cannot take an optional field alone
	c.$with.type(typeAnnotation);
	const present = c.$with.parameter(engine.build.identifier('e'));
	expectTrue<Equals<undefined extends ReturnType<typeof present.parameter> ? true : false, false>>();
	present.$with.type(typeAnnotation);
	present.$with.type();
}

export function aBuiltNodeNarrowsTheSameWay(): void {
	const c = engine.build.catchClause({ body: engine.build.statementBlock({}), parameter: engine.build.identifier('e') });
	if (c._catch_clause_group !== undefined) {
		expectTrue<Equals<undefined extends ReturnType<typeof c.parameter> ? true : false, false>>();
	}
}
