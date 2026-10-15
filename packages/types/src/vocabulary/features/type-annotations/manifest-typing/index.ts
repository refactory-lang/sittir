export type * from './declaration.ts';

import type { TypeAnnotations } from '../index.ts';

/** Manifest typing: a type's fields state their types, which nothing infers. */
export interface ManifestTyping extends TypeAnnotations {
	readonly 'manifest-typing': true;
}
