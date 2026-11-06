export type * from './declaration.ts';
export type * from './element.ts';
export type * from './expression.ts';
export type * from './pattern.ts';

import type { StructPatterns } from '../index.ts';

/** Structs: value types declared by their fields and built by naming them. */
export interface Structs extends StructPatterns {
	readonly structs: true;
}
