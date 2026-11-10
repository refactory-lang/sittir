export type * from './type.ts';

import type { TypeAnnotations } from '../index.ts';

/** Union types: a type that admits any of several types. */
export interface UnionTypes extends TypeAnnotations {
	readonly 'union-types': true;
}
