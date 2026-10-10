import type { NullableTypes } from '../index.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Non-null assertions: asserting that a value, or a variable before its assignment, is not null. */
export interface NonNullAssertions extends NullableTypes {
	readonly 'non-null-assertions': true;
}
