export type * from './clause.ts';
export type * from './statement.ts';

import type { Modules } from '../index.ts';

/** From imports: names imported from a module by `from`, relative imports among them. */
export interface FromImports extends Modules {
	readonly 'from-imports': true;
}
