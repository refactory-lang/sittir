export type * from './expression.ts';

/** Identity comparison: `is` and `is not`. */
export interface IdentityComparison {
	readonly 'identity-comparison': true;
}
