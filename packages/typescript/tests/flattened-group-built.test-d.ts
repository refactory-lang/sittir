/**
 * Type-level pins: a built node that seats an optional flattened group is the
 * union of a group-present and a group-absent shape, told apart by the seat's
 * stored property.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(typescript);

export function presentGroupReadsEveryRequiredField(c: T.CatchClause.Bound): void {
	if (c._catch_clause_group !== undefined) {
		expectTrue<Equals<undefined extends ReturnType<typeof c.parameter> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof c.catchClauseGroup> ? true : false, false>>();
		expectTrue<Equals<undefined extends ReturnType<typeof c.type> ? true : false, true>>();
	} else {
		expectTrue<Equals<ReturnType<typeof c.parameter>, undefined>>();
		expectTrue<Equals<ReturnType<typeof c.type>, undefined>>();
		expectTrue<Equals<ReturnType<typeof c.catchClauseGroup>, undefined>>();
	}
}

export function aBuiltNodeNarrowsTheSameWay(): void {
	const c = engine.build.catchClause({ body: engine.build.statementBlock({}), parameter: engine.build.identifier('e') });
	if (c._catch_clause_group !== undefined) {
		expectTrue<Equals<undefined extends ReturnType<typeof c.parameter> ? true : false, false>>();
	}
}

export function theParsedNodeKeepsItsOptionalReads(c: T.CatchClause.Parsed): void {
	expectTrue<Equals<undefined extends ReturnType<typeof c.parameter> ? true : false, true>>();
}
