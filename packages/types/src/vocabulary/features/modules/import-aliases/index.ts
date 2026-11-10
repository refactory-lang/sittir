export type * from './clause.ts';

import type { Modules } from '../index.ts';

/** Import aliases: an import bound to another name. */
export interface ImportAliases extends Modules {
	readonly 'import-aliases': true;
}
