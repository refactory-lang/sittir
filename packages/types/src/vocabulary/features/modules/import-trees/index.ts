export type * from './clause.ts';
export type * from './statement.ts';

import type { Modules } from '../index.ts';

/** Import trees: several names imported through one shared path. */
export interface ImportTrees extends Modules {
	readonly 'import-trees': true;
}
