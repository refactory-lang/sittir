export type * from './declaration.ts';

import type { TypeAnnotations } from '../index.ts';
import type { StaticTypes } from '../static-types/index.ts';
import type { AnnotatedConstants } from '../annotated-constants/index.ts';

/** Manifest typing: a type's fields state their types, which nothing infers. */
export interface ManifestTyping extends TypeAnnotations, StaticTypes, AnnotatedConstants {
	readonly 'manifest-typing': true;
}
