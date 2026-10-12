export type * from './attribute.ts';
export type * from './declaration.ts';
export type * from './expression.ts';

/** Decorators: a function applied to a declaration where it is declared. */
export interface Decorators {
	readonly decorators: true;
}
