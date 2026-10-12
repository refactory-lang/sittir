export * from './declaration.ts';
export * from './type.ts';

import type { Classes } from '../index.ts';

/** Abstract classes: a class nothing instantiates, and members its subclasses must implement. */
export interface AbstractClasses extends Classes {
	readonly 'abstract-classes': true;
}
