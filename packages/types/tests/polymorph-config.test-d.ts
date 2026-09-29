/**
 * Type-level tests for the Config surface of polymorph forms: the `$variant`
 * tag, and the hoist of a lone scalar child's Config into its parent.
 *
 * These are compile-time tests: if any assertion fails, the file won't
 * compile.
 *
 * Run with: pnpm --filter @sittir/types type-check
 */

import type { ChildOf, ConfigOf } from '../src/index.ts';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<_T extends true> = true;

// ---------------------------------------------------------------------------
// 1. $variant is required on the Config of a form that declares one, even
//    without a child slot, so the dispatcher's switch narrows.
// ---------------------------------------------------------------------------

interface FormWithoutChildren {
	readonly $type: 1;
	readonly $variant: 'bar';
	readonly _x: string;
}
type FormConfig = ConfigOf<FormWithoutChildren>;

export const withVariant: FormConfig = { x: 'x', $variant: 'bar' };

// @ts-expect-error $variant is required on the Config of a form that declares one.
export const missingVariant: FormConfig = { x: 'x' };

// @ts-expect-error $variant must be the exact declared literal ('bar').
export const wrongVariant: FormConfig = { x: 'x', $variant: 'other' };

// ---------------------------------------------------------------------------
// 2. A form whose only child is one scalar kind hoists that child's Config
//    into its own, and ChildOf unwraps the slot to the child kind.
// ---------------------------------------------------------------------------

interface InnerScalar {
	readonly $type: 2;
	readonly _value: number;
}

interface OuterScalarForm {
	readonly $type: 3;
	readonly $variant: 'wrapped';
	readonly $other: InnerScalar;
}

type OuterConfig = ConfigOf<OuterScalarForm>;

export type HoistsScalarChild = Expect<Equals<OuterConfig, { readonly value: number; readonly $variant: 'wrapped' }>>;

export const hoisted: OuterConfig = { value: 1, $variant: 'wrapped' };

// @ts-expect-error the hoisted child's Config replaces the `children` bag.
export const childrenBag: OuterConfig = { children: { value: 1 }, $variant: 'wrapped' };

export type UnwrapsScalarChild = Expect<Equals<ChildOf<OuterScalarForm>, InnerScalar>>;
