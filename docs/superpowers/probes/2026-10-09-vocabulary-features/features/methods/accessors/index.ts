import type { Methods } from '../index.ts';
export type * from './declaration.ts';

/** Accessors: a property read and written through a getter and a setter. */
export interface Accessors extends Methods {
	readonly accessors: true;
}
