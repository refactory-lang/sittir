import type { Classes } from '../index.ts';
export type * from './declaration.ts';

/** Multiple inheritance: a class lists any number of base classes. */
export interface MultipleInheritance extends Classes {
	readonly 'multiple-inheritance': true;
}
