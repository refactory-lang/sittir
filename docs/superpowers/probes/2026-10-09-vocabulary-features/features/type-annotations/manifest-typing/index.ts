import type { TypeAnnotations } from '../index.ts';
export type * from './declaration.ts';

/** Manifest typing: a type's fields state their types, which nothing infers. */
export interface ManifestTyping extends TypeAnnotations {
	readonly 'manifest-typing': true;
}
