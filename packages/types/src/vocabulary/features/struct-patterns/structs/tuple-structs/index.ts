export type * from './declaration.ts';
export type * from './element.ts';
export type * from './pattern.ts';

import type { StructPatterns } from '../../index.ts';
import type { Structs } from '../index.ts';

/** Tuple structs: structs with positional fields or none, struct update and rest patterns. */
export interface TupleStructs extends StructPatterns, Structs {
	readonly 'tuple-structs': true;
}
