/**
 * Type-level pins: the flattened fields of an optional group are co-optional
 * in the config. They are given together, with the group's own required
 * fields, or not at all. The group's own seat and its flattened fields
 * exclude each other, in the strict and the loose input.
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
declare const group: T.CatchClauseGroup.Parsed;
declare const looseGroup: T.CatchClauseGroup.Loose;

export function wholeGroupOrNoneCompiles(): void {
	engine.build.catchClause({ body });
	engine.build.catchClause({ body, parameter });
	engine.build.catchClause({ body, parameter, type });
}

export function partialGroupIsAnError(): void {
	// @ts-expect-error a present group keeps its required parameter
	engine.build.catchClause({ body, type });
}

export function theSeatAloneCompiles(): void {
	engine.build.catchClause({ body, catchClauseGroup: group });
	const held = { body, catchClauseGroup: group };
	engine.build.catchClause(held);
}

export function theSeatAndAFlattenedKeyAreAnError(): void {
	// @ts-expect-error the seat and an optional flattened key exclude each other
	engine.build.catchClause({ body, catchClauseGroup: group, type });
	// @ts-expect-error the seat and the required flattened key exclude each other
	engine.build.catchClause({ body, catchClauseGroup: group, parameter });
	// @ts-expect-error the seat and every flattened key exclude each other
	engine.build.catchClause({ body, catchClauseGroup: group, parameter, type });
}

export function aHeldConfigWithTheSeatAndAKeyIsAnError(): void {
	const held = { body, catchClauseGroup: group, parameter };
	// @ts-expect-error a held config is checked the same way
	engine.build.catchClause(held);
}

declare const strictCall: (...args: T.CatchClause.BuildArgs) => unknown;
declare const looseCall: (...args: T.CatchClause.LooseArgs) => unknown;

export function theLooseRowExcludesTheSeatAndTheKeysToo(): void {
	looseCall({ body, parameter, type });
	looseCall({ body, catchClauseGroup: looseGroup });
	// @ts-expect-error the loose row excludes the seat and a flattened key too
	looseCall({ body, catchClauseGroup: looseGroup, parameter });
	// @ts-expect-error the loose row excludes the seat and an optional flattened key too
	looseCall({ body, catchClauseGroup: looseGroup, type });
}

export function theStrictRowExcludesThemAsAnArgumentRowToo(): void {
	strictCall({ body, parameter });
	strictCall({ body, catchClauseGroup: group });
	// @ts-expect-error the strict row excludes the seat and a flattened key
	strictCall({ body, catchClauseGroup: group, parameter });
	// @ts-expect-error the strict row excludes the seat and an optional flattened key
	strictCall({ body, catchClauseGroup: group, type });
}
