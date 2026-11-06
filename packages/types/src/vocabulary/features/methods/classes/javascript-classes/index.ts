export type * from './declaration.ts';
export type * from './expression.ts';
export type * from './statement.ts';

import type { Classes } from '../index.ts';

/** JavaScript classes: `new`, class expressions, static blocks and static members. */
export interface JavaScriptClasses extends Classes {
	readonly 'javascript-classes': true;
}
