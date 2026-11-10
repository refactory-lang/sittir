export type * from './clause.ts';

import type { Modules } from '../index.ts';

/** Wildcard imports: every public name of a module imported at once. */
export interface WildcardImports extends Modules {
	readonly 'wildcard-imports': true;
}
