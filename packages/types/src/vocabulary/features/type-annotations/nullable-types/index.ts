import type { TypeAnnotations } from '../index.ts';

/** Nullable types: a type that admits null. */
export interface NullableTypes extends TypeAnnotations {
	readonly 'nullable-types': true;
}
