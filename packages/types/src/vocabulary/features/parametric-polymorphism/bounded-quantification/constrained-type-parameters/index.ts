export type * from './type.ts';

import type { BoundedQuantification } from '../index.ts';
import type { PythonTypeForms } from '../../../type-annotations/python-type-forms/index.ts';

/** Constrained type parameters: a type parameter restricted to one of a fixed list of types. */
export interface ConstrainedTypeParameters extends BoundedQuantification, PythonTypeForms {
	readonly 'constrained-type-parameters': true;
}
