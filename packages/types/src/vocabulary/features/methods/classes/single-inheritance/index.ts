export type * from './clause.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

import type { Classes } from '../index.ts';

/** Single inheritance: a class extends at most one superclass. */
export interface SingleInheritance extends Classes {
	readonly 'single-inheritance': true;
}
