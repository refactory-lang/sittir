export type * from './declaration.ts';
export type * from './type.ts';

import type { TypeAnnotations } from '../index.ts';
import type { PythonDeclarations } from '../../python-declarations/index.ts';

/** Python's type forms: constrained types and the annotations on parameter kinds and constructors. */
export interface PythonTypeForms extends TypeAnnotations, PythonDeclarations {
	readonly 'python-type-forms': true;
}
