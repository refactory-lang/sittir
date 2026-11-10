export type * from './literal.ts';

/** Implicit concatenation: adjacent string literals read as one. */
export interface ImplicitConcatenation {
	readonly 'implicit-concatenation': true;
}
