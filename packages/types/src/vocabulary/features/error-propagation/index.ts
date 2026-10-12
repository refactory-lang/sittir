export type * from './expression.ts';

/** Error propagation: an expression that returns an error to its caller, and a block that stops it there. */
export interface ErrorPropagation {
	readonly 'error-propagation': true;
}
