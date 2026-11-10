export type * from './element.ts';
export type * from './expression.ts';

/** Set literals: a set written as its elements, and the spreads that fill one. */
export interface SetLiterals {
	readonly 'set-literals': true;
}
