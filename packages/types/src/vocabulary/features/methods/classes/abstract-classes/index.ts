import type { Classes } from '../index.ts';
export type * from './declaration.ts';
export type * from './type.ts';

/** Abstract classes: a class nothing instantiates, and members its subclasses must implement. */
export interface AbstractClasses extends Classes {
	readonly 'abstract-classes': true;
}
