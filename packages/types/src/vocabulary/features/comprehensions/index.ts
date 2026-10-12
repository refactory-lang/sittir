export type * from './clause.ts';
export type * from './expression.ts';

/** Comprehensions: a collection built by iterating and filtering in one expression. */
export interface Comprehensions {
	readonly comprehensions: true;
}
