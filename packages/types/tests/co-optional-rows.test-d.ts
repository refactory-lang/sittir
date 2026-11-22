/**
 * Type-level pins: a row with an optional branch is two tuples, one with the
 * branch present, which needs its required key and takes the options, and
 * one with the branch present or absent, which takes no option of the branch.
 * A seat that refuses numeric literals leaves a row without literals alone,
 * and takes a zero-argument row.
 *
 * Compile-time only: `pnpm --filter @sittir/types type-check`.
 */

import type { ArgsOf, CoOptionalRows, Seat } from '../src/index.ts';
import type { SameArguments } from './support/row-is-the-call.ts';

interface Config {
	readonly integer: number;
	readonly exponentSign?: '+' | '-';
	readonly exponent?: number;
}
interface Options {
	readonly marker?: 'e' | 'E';
	readonly other?: true;
}
type Row = CoOptionalRows<[config: Config, options?: Options], 'exponentSign' | 'exponent', 'exponent', 'marker'>;
type Weighed = Seat<Row, string, false, undefined, { integer: true; exponent: true }>;
declare const weighed: Weighed;
declare const row: (...args: Row) => string;

export function theBranchPresentTakesTheOptions(): void {
	row({ integer: 1, exponent: 2 }, { marker: 'E', other: true });
	row({ integer: 1, exponentSign: '+', exponent: 2 }, { marker: 'e' });
}

export function theBranchAbsentTakesTheOtherOptions(): void {
	row({ integer: 1 });
	row({ integer: 1 }, {});
	row({ integer: 1 }, { other: true });
}

export function aHeldUnionOfBothShapesCompiles(held: { readonly integer: 1 } | { readonly integer: 2; readonly exponent: 3 }): void {
	row(held);
	row(held, {});
}

export function theBranchBelongsTogether(): void {
	// @ts-expect-error the sign needs the exponent
	row({ integer: 1, exponentSign: '+' });
	// @ts-expect-error the marker needs the exponent
	row({ integer: 1 }, { marker: 'E' });
	// @ts-expect-error a held union with a marker is not known to hold the exponent
	row({ integer: 1 } as { readonly integer: 1 } | { readonly integer: 2; readonly exponent: 3 }, { marker: 'E' });
}

export function theSeatJudgesLiteralsOnly(): void {
	weighed({ integer: 1 });
	weighed({ integer: 1, exponent: 2 }, { marker: 'E' });
	// @ts-expect-error a negative literal is not buildable
	weighed({ integer: -1 });
	// @ts-expect-error a literal past the safe integers is not buildable
	weighed({ integer: 9007199254740992, exponent: 1 });
	// @ts-expect-error the seat keeps the row's refusal of a marker without the exponent
	weighed({ integer: 1 }, { marker: 'E' });
}

export function theSeatKeepsItsRowForACaller(): void {
	const same: SameArguments<ArgsOf<Weighed>, Row> = true;
	void same;
}

type Empty = Seat<[] | [config: Config], string, false, undefined, { integer: true }>;
declare const empty: Empty;

export function aZeroArgumentRowStaysCallable(): void {
	empty();
	empty({ integer: 1 });
	// @ts-expect-error a negative literal is not buildable
	empty({ integer: -1 });
}
