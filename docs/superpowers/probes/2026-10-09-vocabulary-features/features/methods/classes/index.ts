import type { Methods } from '../index.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Classes: types declared with their fields and methods, whose instances a constructor makes. */
export interface Classes extends Methods {
	readonly classes: true;
}
