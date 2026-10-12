export * from './declaration.ts';
export * from './expression.ts';

import type { NullableTypes } from '../index.ts';

/** Non-null assertions: asserting that a value, or a variable before its assignment, is not null. */
export interface NonNullAssertions extends NullableTypes {
	readonly 'non-null-assertions': true;
}
