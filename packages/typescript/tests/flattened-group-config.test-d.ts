/**
 * Type-level pins: the flattened fields of an optional group are co-optional
 * in the config. They are given together, with the group's own required
 * fields, or not at all.
 *
 * Compile-time only: `pnpm --filter @sittir/typescript type-check`.
 */

import type * as T from '../src/types.ts';
import typescript from '../src/index.ts';
import { createEngine } from '@sittir/common';

const engine = await createEngine(typescript);
const body = engine.build.statementBlock({});
const parameter = engine.build.identifier('e');
declare const type: T.TypeAnnotation.Parsed;

export function wholeGroupOrNoneCompiles(): void {
	engine.build.catchClause({ body });
	engine.build.catchClause({ body, parameter });
	engine.build.catchClause({ body, parameter, type });
}

export function partialGroupIsAnError(): void {
	// @ts-expect-error a present group keeps its required parameter
	engine.build.catchClause({ body, type });
}
