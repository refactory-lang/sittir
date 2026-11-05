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

export function groupKeyReadsTheInnerPatternAndTheSeatTheWholeGroup(arm: T.LastMatchArm.Parsed): void {
	type Inner = ReturnType<typeof arm.pattern>;
	expectTrue<Equals<Extract<Inner, { readonly $type: T.MatchPattern['$type'] }>, never>>();
	expectTrue<Equals<ReturnType<typeof arm.match>['$type'], T.MatchPattern['$type']>>();
}

export function newKeyReadsAsOptional(arm: T.LastMatchArm.Parsed): void {
	type Condition = ReturnType<typeof arm.condition>;
	expectTrue<Equals<undefined extends Condition ? true : false, true>>();
}

export function groupKeySetterTakesTheInnerPatternAndTheSeatTheWholeGroup(arm: T.LastMatchArm.Parsed): string {
	const inner = arm.$with.pattern(engine.build.identifier('b')).$render();
	const group = engine.build.matchPattern({ pattern: engine.build.identifier('c'), condition: engine.build.identifier('d') });
	const whole = arm.$with.match(group);
	// @ts-expect-error the group's pattern key takes the inner pattern, not the whole group
	arm.$with.pattern(group);
	return inner + whole.$render();
}

export function newKeySetterClearsWithNoArgument(arm: T.LastMatchArm.Parsed): string {
	return arm.$with.condition().$render() + arm.$with.condition(engine.build.identifier('d')).$render();
}

export function aMatchBlocksArmsAreOneListEndingWithTheLastArm(arms: T.MatchBlockArms.Parsed): void {
	type Arms = ReturnType<typeof arms.arms>;
	type Last = Arms extends readonly [...unknown[], infer L] ? L : never;
	type Before = Arms extends readonly [...infer R, unknown] ? R[number] : never;
	expectTrue<Equals<Last extends { readonly $type: infer K } ? K : never, T.LastMatchArm['$type']>>();
	expectTrue<Equals<Extract<Before, { readonly $type: T.LastMatchArm['$type'] }>, never>>();
}

export function wholeGroupBySlotOrFlattenedKeysCompile(): void {
	const body = engine.build.identifier('v');
	const whole = engine.build.matchPattern({ pattern: engine.build.identifier('p') });
	engine.build.lastMatchArm({ match: whole, body });
	engine.build.lastMatchArm({ pattern: engine.build.identifier('p'), condition: engine.build.identifier('c'), body });
}

export function flattenedKeyBesideTheWholeGroupIsAnError(): void {
	const body = engine.build.identifier('v');
	const whole = engine.build.matchPattern({ pattern: engine.build.identifier('p') });
	// @ts-expect-error a group seated by its slot takes none of its keys beside it
	engine.build.lastMatchArm({ match: whole, condition: engine.build.identifier('c'), body });
}

export function aRequiredSeatHasOneShape(arm: T.LastMatchArm.Bound): void {
	expectTrue<Equals<undefined extends ReturnType<typeof arm.pattern> ? true : false, false>>();
	expectTrue<Equals<undefined extends ReturnType<typeof arm.condition> ? true : false, true>>();
	expectTrue<Equals<Extract<ReturnType<typeof arm.pattern>, { readonly $type: T.MatchPattern['$type'] }>, never>>();
}

export function anAbsentArmListReadsAsAbsent(block: T.MatchBlock.Parsed): void {
	expectTrue<Equals<undefined extends ReturnType<typeof block.matchBlockArms> ? true : false, true>>();
}
