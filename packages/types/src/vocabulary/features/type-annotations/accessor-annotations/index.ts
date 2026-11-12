export type * from './declaration.ts';

import type { TypeAnnotations } from '../index.ts';
import type { Accessors } from '../../methods/accessors/index.ts';

/** Accessor annotations: the type a getter returns. */
export interface AccessorAnnotations extends TypeAnnotations, Accessors {
	readonly 'accessor-annotations': true;
}
