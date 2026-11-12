export type * from './declaration.ts';

import type { TypeAnnotations } from '../index.ts';
import type { Constants } from '../../constants/index.ts';

/** Annotated constants: a constant whose type is declared. */
export interface AnnotatedConstants extends TypeAnnotations, Constants {
	readonly 'annotated-constants': true;
}
