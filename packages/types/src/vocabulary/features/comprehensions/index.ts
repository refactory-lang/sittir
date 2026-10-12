export * from './clause.ts';
export * from './expression.ts';

/** Comprehensions: a collection built by iterating and filtering in one expression. */
export interface Comprehensions {
	readonly comprehensions: true;
}
