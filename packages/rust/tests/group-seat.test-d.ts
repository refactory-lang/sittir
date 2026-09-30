/**
 * Type-level pins: a group seat's fields are read and set on the parent the
 * way the config surface names them, and the seat's own accessor stays.
 *
 * Compile-time only: `pnpm --filter @sittir/rust type-check`.
 */

import type * as T from '../src/types.ts';
import rust from '../src/index.ts';
import { createEngine } from '@sittir/common';

type Equals<A, B> = (<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false;
function expectTrue<_T extends true>(): void {}

const engine = await createEngine(rust);

export function sameNameKeyReadsTheInnerPattern(arm: T.LastMatchArm.Parsed): void {
	type Inner = ReturnType<typeof arm.pattern>;
	expectTrue<Equals<Extract<Inner, { readonly $type: T.MatchPattern['$type'] }>, never>>();
}

export function newKeyReadsAsOptional(arm: T.LastMatchArm.Parsed): void {
	type Condition = ReturnType<typeof arm.condition>;
	expectTrue<Equals<undefined extends Condition ? true : false, true>>();
}

export function sameNameSetterTakesTheInnerPatternOrTheWholeGroup(arm: T.LastMatchArm.Parsed): string {
	const inner = arm.$with.pattern(engine.build.identifier('b')).$render();
	const whole = arm.$with.pattern(
		engine.build.matchPattern({ pattern: engine.build.identifier('c'), condition: engine.build.identifier('d') })
	);
	return inner + whole.$render();
}

export function newKeySetterClearsWithNoArgument(arm: T.LastMatchArm.Parsed): string {
	return arm.$with.condition().$render() + arm.$with.condition(engine.build.identifier('d')).$render();
}

export function flattenedListSeatReadsItsAccessors(block: T.MatchBlock.Parsed): void {
	block.matchArms();
	block.lastArm();
}
