export type * from './declaration.ts';

import type { DefaultArguments } from '../index.ts';
import type { PythonDeclarations } from '../../python-declarations/index.ts';

/** Default parameter forms: parameters whose default sets them apart as their own kinds. */
export interface DefaultParameterForms extends DefaultArguments, PythonDeclarations {
	readonly 'default-parameter-forms': true;
}
