export type * from './element.ts';
export type * from './expression.ts';

/** Spreads: the elements of one collection written into another. */
export interface Spreads {
	readonly spreads: true;
}
