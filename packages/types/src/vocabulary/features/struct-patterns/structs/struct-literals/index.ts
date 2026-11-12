export type * from './element.ts';
export type * from './expression.ts';

import type { StructPatterns } from '../../index.ts';
import type { Structs } from '../index.ts';

/** Struct literals: a struct value built by naming its fields. */
export interface StructLiterals extends StructPatterns, Structs {
	readonly 'struct-literals': true;
}
