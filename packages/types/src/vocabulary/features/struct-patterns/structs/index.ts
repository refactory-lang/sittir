export type * from './declaration.ts';

import type { StructPatterns } from '../index.ts';

/** Structs: value types declared by their fields and built by naming them. */
export interface Structs extends StructPatterns {
	readonly structs: true;
}
