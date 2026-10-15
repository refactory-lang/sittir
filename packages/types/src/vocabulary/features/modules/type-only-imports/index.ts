export type * from './clause.ts';
export type * from './statement.ts';

import type { Modules } from '../index.ts';
import type { TypeAnnotations } from '../../type-annotations/index.ts';

/** Type-only imports: an import or an export of names used only as types, erased at run time. */
export interface TypeOnlyImports extends Modules, TypeAnnotations {
	readonly 'type-only-imports': true;
}
