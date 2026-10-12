export * from './declaration.ts';

import type { Methods } from '../index.ts';

/** Accessors: a property read and written through a getter and a setter. */
export interface Accessors extends Methods {
	readonly accessors: true;
}
